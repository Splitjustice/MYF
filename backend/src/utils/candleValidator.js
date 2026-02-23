const INTERVAL_MS = {
  M5: 5 * 60 * 1000,
  M15: 15 * 60 * 1000
};

const parseTimeMs = (time) => {
  const ms = new Date(time).getTime();
  return Number.isFinite(ms) ? ms : NaN;
};

const validateSeries = (candles, intervalLabel) => {
  const expectedMs = INTERVAL_MS[intervalLabel];
  const report = {
    interval: intervalLabel,
    expectedIntervalMs: expectedMs,
    total: candles.length,
    duplicates: 0,
    outOfOrder: 0,
    largeGaps: 0,
    invalidTimestamps: 0,
    isValid: true
  };

  const seen = new Set();
  let prev = null;

  for (const candle of candles) {
    const ts = parseTimeMs(candle.time);
    if (!Number.isFinite(ts)) {
      report.invalidTimestamps += 1;
      continue;
    }

    if (seen.has(ts)) report.duplicates += 1;
    seen.add(ts);

    if (prev !== null) {
      const delta = ts - prev;
      if (delta < 0) {
        report.outOfOrder += 1;
      } else if (delta > expectedMs * 2) {
        report.largeGaps += 1;
      }
    }
    prev = ts;
  }

  report.isValid = report.duplicates === 0 && report.outOfOrder === 0 && report.largeGaps === 0 && report.invalidTimestamps === 0;
  return report;
};

const validateMarketDataIntegrity = ({ m5, m15 }) => {
  const m5Report = validateSeries(m5 || [], 'M5');
  const m15Report = validateSeries(m15 || [], 'M15');
  return {
    m5: m5Report,
    m15: m15Report,
    isValid: m5Report.isValid && m15Report.isValid
  };
};

module.exports = { validateSeries, validateMarketDataIntegrity, INTERVAL_MS };
