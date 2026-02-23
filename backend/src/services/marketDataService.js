const { twelveDataApiKey } = require('../config/env');
const { validateMarketDataIntegrity } = require('../utils/candleValidator');

const pairs = ['GBPUSD', 'EURUSD', 'EURGBP'];

const randomCandles = (start, count, intervalMs, volatility = 0.0007) => {
  const candles = [];
  let price = start;
  const now = Date.now();

  for (let i = 0; i < count; i += 1) {
    const open = price;
    const close = price + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    candles.push({ open, high, low, close, time: new Date(now - (count - i) * intervalMs).toISOString() });
    price = close;
  }

  return candles;
};

const withValidationReport = (data) => ({
  ...data,
  integrityReport: validateMarketDataIntegrity(data)
});

const getMockMarketData = async (pair) => {
  const seed = pair === 'EURUSD' ? 1.08 : pair === 'GBPUSD' ? 1.27 : 0.86;
  return withValidationReport({
    m15: randomCandles(seed, 80, 15 * 60 * 1000, 0.001),
    m5: randomCandles(seed, 200, 5 * 60 * 1000, 0.0008),
    daily: randomCandles(seed, 20, 24 * 60 * 60 * 1000, 0.01)
  });
};

const getMarketData = async (pair) => {
  if (!pairs.includes(pair)) throw new Error('Unsupported pair');
  if (!twelveDataApiKey) return getMockMarketData(pair);

  const symbol = `${pair.slice(0, 3)}/${pair.slice(3)}`;
  const fetchSeries = async (interval, outputsize) => {
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${twelveDataApiKey}`;
    const res = await fetch(url);
    const json = await res.json();
    if (!json.values) throw new Error('Twelve Data unavailable');
    return json.values.reverse().map((v) => ({
      open: Number(v.open), high: Number(v.high), low: Number(v.low), close: Number(v.close), time: v.datetime
    }));
  };

  const data = {
    m15: await fetchSeries('15min', 80),
    m5: await fetchSeries('5min', 200),
    daily: await fetchSeries('1day', 20)
  };

  return withValidationReport(data);
};

module.exports = { getMarketData, getMockMarketData };
