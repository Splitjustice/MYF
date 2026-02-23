const { DateTime } = require('luxon');
const { detectMss, detectFvgAfterMss } = require('./signalEngine');
const { getMarketData } = require('./marketDataService');
const { LONDON_TZ } = require('../utils/time');

const buildSeededRng = (seedString) => {
  let seed = 0;
  for (let i = 0; i < seedString.length; i += 1) seed = (seed * 31 + seedString.charCodeAt(i)) >>> 0;
  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
};

const generateMockDayCandles = (pair, dateISO) => {
  const rng = buildSeededRng(`${pair}_${dateISO}`);
  const base = pair === 'EURUSD' ? 1.08 : pair === 'GBPUSD' ? 1.27 : 0.86;
  const start = DateTime.fromISO(dateISO, { zone: 'utc' }).setZone(LONDON_TZ).startOf('day');
  const candles = [];
  let price = base;
  for (let i = 0; i < 288; i += 1) {
    const t = start.plus({ minutes: i * 5 });
    const open = price;
    const drift = (rng() - 0.5) * 0.0006;
    const close = open + drift;
    const high = Math.max(open, close) + rng() * 0.0003;
    const low = Math.min(open, close) - rng() * 0.0003;
    candles.push({ open, high, low, close, time: t.toUTC().toISO() });
    price = close;
  }
  return candles;
};

const fetchBacktestCandles = async ({ pair, dateISO, timeframe, candles }) => {
  if (Array.isArray(candles) && candles.length) return candles;
  if (timeframe !== 'M5') throw new Error('Only M5 timeframe is currently supported');

  try {
    const market = await getMarketData(pair);
    if (market.m5?.length) return market.m5;
  } catch {
    // fallback to mock below
  }

  return generateMockDayCandles(pair, dateISO);
};

const runBacktest = async ({ pair, dateISO, strategy, timeframe, rr = 2.5, candles }) => {
  const trace = [];
  if (strategy !== 'LONDON_SWEEP') throw new Error('Unsupported strategy');
  const m5 = await fetchBacktestCandles({ pair, dateISO, timeframe, candles });

  const day = DateTime.fromISO(dateISO, { zone: 'utc' }).setZone(LONDON_TZ).startOf('day');
  const asian = m5.filter((c) => {
    const dt = DateTime.fromISO(c.time, { zone: 'utc' }).setZone(LONDON_TZ);
    return dt >= day && dt < day.plus({ hours: 5 });
  });
  if (!asian.length) return { result: { outcome: 'NO_TRADE', reason: 'No Asian candles' }, trace };

  const asianHigh = Math.max(...asian.map((c) => c.high));
  const asianLow = Math.min(...asian.map((c) => c.low));
  trace.push(`Asian range high=${asianHigh.toFixed(5)} low=${asianLow.toFixed(5)}`);

  const london = m5.filter((c) => {
    const dt = DateTime.fromISO(c.time, { zone: 'utc' }).setZone(LONDON_TZ);
    return dt >= day.plus({ hours: 7 }) && dt < day.plus({ hours: 10 });
  });

  let sweepIndex = -1;
  let direction = 'NO_TRADE';
  for (const candle of london) {
    const idx = m5.indexOf(candle);
    if (candle.low < asianLow && candle.close > asianLow) {
      sweepIndex = idx;
      direction = 'LONG';
      break;
    }
    if (candle.high > asianHigh && candle.close < asianHigh) {
      sweepIndex = idx;
      direction = 'SHORT';
      break;
    }
  }
  if (sweepIndex < 0) return { result: { outcome: 'NO_TRADE', reason: 'No liquidity sweep' }, trace };
  trace.push(`Sweep detected at index ${sweepIndex} direction=${direction}`);

  let mss = null;
  let mssIndex = -1;
  for (let i = sweepIndex + 1; i < m5.length; i += 1) {
    const candidate = detectMss(m5.slice(0, i + 1), direction, { swingSensitivity: 1, displacementPips: 3, requireFollowThrough: false });
    if (candidate.ok) {
      mss = candidate;
      mssIndex = i;
      break;
    }
  }
  if (!mss) return { result: { outcome: 'NO_TRADE', reason: 'No MSS after sweep' }, trace };
  trace.push(`MSS detected at index ${mss.displacementIndex}`);

  const fvg = detectFvgAfterMss(m5, direction, mss);
  if (!fvg) return { result: { outcome: 'NO_TRADE', reason: 'No FVG after MSS' }, trace };
  const entry = (fvg.low + fvg.high) / 2;
  trace.push(`FVG found low=${fvg.low.toFixed(5)} high=${fvg.high.toFixed(5)} entry=${entry.toFixed(5)}`);

  const sweepCandle = m5[sweepIndex];
  const stopLoss = direction === 'LONG' ? sweepCandle.low - 0.0002 : sweepCandle.high + 0.0002;
  const risk = Math.abs(entry - stopLoss);
  const takeProfit = direction === 'LONG' ? entry + risk * rr : entry - risk * rr;

  let entryIndex = -1;
  for (let i = mssIndex + 1; i < m5.length; i += 1) {
    const c = m5[i];
    const touched = direction === 'LONG' ? c.low <= entry : c.high >= entry;
    if (touched) {
      entryIndex = i;
      break;
    }
  }
  if (entryIndex < 0) return { result: { outcome: 'NO_TRADE', reason: 'Entry not filled', direction, entry, stopLoss, takeProfit }, trace };
  trace.push(`Entry filled at index ${entryIndex}`);

  for (let i = entryIndex + 1; i < m5.length; i += 1) {
    const c = m5[i];
    if (direction === 'LONG') {
      if (c.low <= stopLoss) return { result: { outcome: 'HIT_SL', direction, entry, stopLoss, takeProfit, exitIndex: i }, trace };
      if (c.high >= takeProfit) return { result: { outcome: 'HIT_TP', direction, entry, stopLoss, takeProfit, exitIndex: i }, trace };
    } else {
      if (c.high >= stopLoss) return { result: { outcome: 'HIT_SL', direction, entry, stopLoss, takeProfit, exitIndex: i }, trace };
      if (c.low <= takeProfit) return { result: { outcome: 'HIT_TP', direction, entry, stopLoss, takeProfit, exitIndex: i }, trace };
    }
  }

  return { result: { outcome: 'EXPIRED', direction, entry, stopLoss, takeProfit }, trace };
};

module.exports = { runBacktest, generateMockDayCandles };
