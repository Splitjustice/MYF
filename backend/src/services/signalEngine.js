const { getSession, isWithinLondonWindow, WINDOWS } = require('../utils/time');

const calcADR = (daily) => {
  const ranges = daily.slice(-14).map((c) => (c.high - c.low) * 10000);
  return ranges.reduce((a, b) => a + b, 0) / (ranges.length || 1);
};

const getAsianRange = (m15) => {
  const asian = m15.filter((c) => isWithinLondonWindow(c.time, WINDOWS.ASIAN_RANGE));
  if (!asian.length) return { high: NaN, low: NaN };
  const high = Math.max(...asian.map((c) => c.high));
  const low = Math.min(...asian.map((c) => c.low));
  return { high, low };
};

const detectSweep = (m5, range) => {
  const recent = m5.slice(-24);
  const sweepHigh = recent.find((c) => c.high > range.high && c.close < range.high);
  const sweepLow = recent.find((c) => c.low < range.low && c.close > range.low);
  return { sweepHigh, sweepLow };
};

const findSwingPoints = (candles, sensitivity = 2) => {
  const swingHighs = [];
  const swingLows = [];

  for (let i = sensitivity; i < candles.length - sensitivity; i += 1) {
    const current = candles[i];
    let isHigh = true;
    let isLow = true;

    for (let j = i - sensitivity; j <= i + sensitivity; j += 1) {
      if (j === i) continue;
      if (candles[j].high >= current.high) isHigh = false;
      if (candles[j].low <= current.low) isLow = false;
    }

    if (isHigh) swingHighs.push({ index: i, price: current.high });
    if (isLow) swingLows.push({ index: i, price: current.low });
  }

  return { swingHighs, swingLows };
};

const detectMss = (m5, direction, mssConfig = {}) => {
  const sensitivity = Number(mssConfig.swingSensitivity || 2);
  const displacementPips = Number(mssConfig.displacementPips || 5);
  const requireFollowThrough = Boolean(mssConfig.requireFollowThrough);

  const { swingHighs, swingLows } = findSwingPoints(m5, sensitivity);
  const oppositeSwing = direction === 'LONG'
    ? swingHighs[swingHighs.length - 1]
    : swingLows[swingLows.length - 1];

  if (!oppositeSwing) return { ok: false, reason: 'No opposite swing point found' };

  const maxIdx = requireFollowThrough ? m5.length - 2 : m5.length - 1;
  for (let i = oppositeSwing.index + 1; i <= maxIdx; i += 1) {
    const displacement = m5[i];
    const bodyPips = Math.abs(displacement.close - displacement.open) * 10000;
    const bodyValid = bodyPips >= displacementPips;
    const breakValid = direction === 'LONG'
      ? displacement.close > oppositeSwing.price
      : displacement.close < oppositeSwing.price;

    if (!bodyValid || !breakValid) continue;

    if (requireFollowThrough) {
      const follow = m5[i + 1];
      const followValid = direction === 'LONG'
        ? follow.close > displacement.close
        : follow.close < displacement.close;
      if (!followValid) return { ok: false, reason: 'Missing follow-through candle' };
    }

    return {
      ok: true,
      displacementIndex: i,
      oppositeSwingPrice: oppositeSwing.price,
      bodyPips: Number(bodyPips.toFixed(2))
    };
  }

  return { ok: false, reason: 'No displacement break beyond opposite swing' };
};

const detectFvgAfterMss = (m5, direction, mss) => {
  const start = Math.max(0, (mss?.displacementIndex ?? 0) - 2);

  for (let i = start + 2; i < m5.length; i += 1) {
    const candle1 = m5[i - 2];
    const candle3 = m5[i];

    if (direction === 'LONG' && candle1.high < candle3.low) {
      const fvg = { low: candle1.high, high: candle3.low, createdAtIndex: i };
      const tradedThrough = m5.slice(i + 1).some((c) => c.low <= fvg.low);
      if (!tradedThrough) return fvg;
    }

    if (direction === 'SHORT' && candle1.low > candle3.high) {
      const fvg = { low: candle3.high, high: candle1.low, createdAtIndex: i };
      const tradedThrough = m5.slice(i + 1).some((c) => c.high >= fvg.high);
      if (!tradedThrough) return fvg;
    }
  }

  return null;
};

const hasDataIntegrityIssues = (data) => data.integrityReport && !data.integrityReport.isValid;

const detectOrderBlock = (m5, direction, displacementIndex) => {
  if (!Number.isInteger(displacementIndex) || displacementIndex <= 0) return null;

  for (let i = displacementIndex - 1; i >= 0; i -= 1) {
    const candle = m5[i];
    const isOpposing = direction === 'LONG'
      ? candle.close < candle.open
      : candle.close > candle.open;

    if (isOpposing) {
      const bodyLow = Math.min(candle.open, candle.close);
      const bodyHigh = Math.max(candle.open, candle.close);
      return {
        index: i,
        open: candle.open,
        close: candle.close,
        bodyLow,
        bodyHigh
      };
    }
  }

  return null;
};

const isFvgObConfluent = (fvg, ob, confluencePips) => {
  if (!fvg || !ob) return false;
  const ce = (fvg.high + fvg.low) / 2;
  const maxPips = Number(confluencePips ?? 5);

  let distance = 0;
  if (ce < ob.bodyLow) distance = (ob.bodyLow - ce) * 10000;
  else if (ce > ob.bodyHigh) distance = (ce - ob.bodyHigh) * 10000;

  return distance <= maxPips;
};

const resolveRiskConfig = (settings = {}) => ({
  minADR: Number(settings.minADR ?? settings.adrMin ?? settings.risk?.minADR ?? 80),
  assumedSpreadPips: Number(settings.assumedSpreadPips ?? settings.risk?.assumedSpreadPips ?? 1.2),
  maxSpreadPips: Number(settings.maxSpreadPips ?? settings.risk?.maxSpreadPips ?? 2.5),
  newsFilterEnabled: Boolean(settings.newsFilterEnabled ?? settings.risk?.newsFilterEnabled ?? false),
  nearHighImpactNews: Boolean(settings.nearHighImpactNews ?? settings.risk?.nearHighImpactNews ?? false)
});

const generateSignal = ({ pair, data, settings }) => {
  if (hasDataIntegrityIssues(data)) {
    const m5 = data.integrityReport.m5;
    const m15 = data.integrityReport.m15;
    return {
      pair,
      direction: 'NO_TRADE',
      confidence: 5,
      reasoning: `NO TRADE: data integrity (M5 dup:${m5.duplicates} gap:${m5.largeGaps} order:${m5.outOfOrder}; M15 dup:${m15.duplicates} gap:${m15.largeGaps} order:${m15.outOfOrder})`
    };
  }

  const risk = resolveRiskConfig(settings);
  const adr = calcADR(data.daily);
  if (adr < risk.minADR) {
    return { pair, direction: 'NO_TRADE', confidence: 20, reasoning: `NO TRADE: ADR filter blocked (${adr.toFixed(1)} < ${risk.minADR})` };
  }

  if (risk.assumedSpreadPips > risk.maxSpreadPips) {
    return { pair, direction: 'NO_TRADE', confidence: 18, reasoning: `NO TRADE: spread filter blocked (${risk.assumedSpreadPips.toFixed(1)} > ${risk.maxSpreadPips.toFixed(1)} pips)` };
  }

  if (risk.newsFilterEnabled && risk.nearHighImpactNews) {
    return { pair, direction: 'NO_TRADE', confidence: 15, reasoning: 'NO TRADE: near high-impact news (news filter enabled)' };
  }

  const now = settings.currentTime ? new Date(settings.currentTime) : new Date();
  const session = getSession(now);
  const killzone = session === 'London' ? 'London' : session === 'NY' ? 'NY' : null;
  if (!killzone) return { pair, direction: 'NO_TRADE', confidence: 10, reasoning: 'Outside killzone window' };

  const asianRange = getAsianRange(data.m15);
  if (!Number.isFinite(asianRange.high) || !Number.isFinite(asianRange.low)) {
    return { pair, direction: 'NO_TRADE', confidence: 15, reasoning: 'Insufficient candles in London-time Asian range window' };
  }

  const sweep = detectSweep(data.m5, asianRange);
  const direction = sweep.sweepLow ? 'LONG' : sweep.sweepHigh ? 'SHORT' : 'NO_TRADE';
  if (direction === 'NO_TRADE') return { pair, direction, confidence: 30, reasoning: 'No clear liquidity sweep of Asian range' };

  const mss = detectMss(data.m5, direction, settings.mss || {});
  const fvg = detectFvgAfterMss(data.m5, direction, mss);
  const ob = detectOrderBlock(data.m5, direction, mss.displacementIndex);
  const obConfluencePips = settings.mss?.obConfluencePips ?? 5;
  const hasConfluence = isFvgObConfluent(fvg, ob, obConfluencePips);

  if (!mss.ok || !fvg || !ob || !hasConfluence) {
    return { pair, direction: 'NO_TRADE', confidence: 35, reasoning: `Missing MSS/FVG/OB consensus${mss.ok ? '' : ` (${mss.reason})`}${mss.ok && fvg && ob && !hasConfluence ? ' (No OB-FVG confluence)' : ''}` };
  }

  const entry = (fvg.high + fvg.low) / 2;
  const sl = direction === 'LONG' ? (sweep.sweepLow.low - 0.0002) : (sweep.sweepHigh.high + 0.0002);
  const riskAmount = Math.abs(entry - sl);
  const tp = direction === 'LONG' ? entry + riskAmount * settings.rrTarget : entry - riskAmount * settings.rrTarget;
  const rr = Number((Math.abs(tp - entry) / riskAmount).toFixed(2));

  const confidence = Math.min(100, Math.round(55 + 15 + (fvg ? 15 : 0) + (ob ? 15 : 0)));
  return {
    pair,
    direction,
    entry,
    stopLoss: sl,
    takeProfit: tp,
    rr,
    killzone,
    confidence,
    reasoning: `${killzone} KZ sweep confirmed, MSS displacement (${mss.bodyPips} pips) validated, FVG overlaps M15 OB. ADR ${adr.toFixed(1)} pips.`
  };
};

module.exports = { generateSignal, calcADR, detectMss, findSwingPoints, detectFvgAfterMss, detectOrderBlock, isFvgObConfluent, resolveRiskConfig };
