const test = require('node:test');
const assert = require('node:assert');
const { validateSeries, validateMarketDataIntegrity, INTERVAL_MS } = require('../src/utils/candleValidator');

const buildCandles = (startIso, count, intervalMs) => {
  const start = new Date(startIso).getTime();
  return Array.from({ length: count }).map((_, idx) => ({
    open: 1,
    high: 1.1,
    low: 0.9,
    close: 1,
    time: new Date(start + idx * intervalMs).toISOString()
  }));
};

test('validateSeries passes contiguous ordered candles', () => {
  const candles = buildCandles('2026-01-01T00:00:00Z', 10, INTERVAL_MS.M5);
  const report = validateSeries(candles, 'M5');
  assert.equal(report.isValid, true);
  assert.equal(report.duplicates, 0);
  assert.equal(report.outOfOrder, 0);
  assert.equal(report.largeGaps, 0);
});

test('validateSeries detects duplicates, out-of-order and large gaps', () => {
  const candles = buildCandles('2026-01-01T00:00:00Z', 6, INTERVAL_MS.M15);
  candles[2].time = candles[1].time;
  candles[4].time = new Date(new Date(candles[3].time).getTime() + INTERVAL_MS.M15 * 3).toISOString();
  candles[5].time = new Date(new Date(candles[4].time).getTime() - INTERVAL_MS.M15).toISOString();

  const report = validateSeries(candles, 'M15');
  assert.equal(report.isValid, false);
  assert.ok(report.duplicates > 0);
  assert.ok(report.largeGaps > 0);
  assert.ok(report.outOfOrder > 0);
});

test('validateMarketDataIntegrity aggregates m5 and m15 status', () => {
  const m5 = buildCandles('2026-01-01T00:00:00Z', 10, INTERVAL_MS.M5);
  const m15 = buildCandles('2026-01-01T00:00:00Z', 10, INTERVAL_MS.M15);
  m5[4].time = m5[3].time;

  const report = validateMarketDataIntegrity({ m5, m15 });
  assert.equal(report.isValid, false);
  assert.equal(report.m5.isValid, false);
  assert.equal(report.m15.isValid, true);
});
