const test = require('node:test');
const assert = require('node:assert');
const {
  calcADR,
  generateSignal,
  detectMss,
  detectFvgAfterMss,
  detectOrderBlock,
  isFvgObConfluent,
  resolveRiskConfig
} = require('../src/services/signalEngine');

const candle = ({ o, h, l, c }) => ({ open: o, high: h, low: l, close: c });

test('calcADR computes average pip range', () => {
  const daily = Array.from({ length: 14 }).map(() => ({ high: 1.1, low: 1.09 }));
  assert.ok(Math.abs(calcADR(daily) - 100) < 0.001);
});

test('MSS long passes with fractal swing break and displacement threshold', () => {
  const m5 = [
    candle({ o: 1.1000, h: 1.1008, l: 1.0992, c: 1.1002 }),
    candle({ o: 1.1002, h: 1.1010, l: 1.0995, c: 1.1006 }),
    candle({ o: 1.1006, h: 1.1013, l: 1.0998, c: 1.1009 }),
    candle({ o: 1.1009, h: 1.1017, l: 1.1000, c: 1.1012 }),
    candle({ o: 1.1012, h: 1.1030, l: 1.1003, c: 1.1010 }),
    candle({ o: 1.1010, h: 1.1016, l: 1.1001, c: 1.1008 }),
    candle({ o: 1.1008, h: 1.1014, l: 1.0999, c: 1.1005 }),
    candle({ o: 1.1005, h: 1.1011, l: 1.0997, c: 1.1000 }),
    candle({ o: 1.1000, h: 1.1045, l: 1.0998, c: 1.1040 })
  ];

  const result = detectMss(m5, 'LONG', { swingSensitivity: 2, displacementPips: 5, requireFollowThrough: false });
  assert.equal(result.ok, true);
  assert.equal(result.oppositeSwingPrice, 1.1030);
  assert.ok(result.bodyPips >= 5);
});

test('detectFvgAfterMss finds bullish 3-candle FVG in displacement leg', () => {
  const m5 = [
    candle({ o: 1.1000, h: 1.1004, l: 1.0994, c: 1.0999 }),
    candle({ o: 1.0999, h: 1.1001, l: 1.0991, c: 1.0995 }),
    candle({ o: 1.0995, h: 1.1000, l: 1.0990, c: 1.0997 }),
    candle({ o: 1.0997, h: 1.1001, l: 1.0993, c: 1.1000 }),
    candle({ o: 1.1000, h: 1.1014, l: 1.0999, c: 1.1012 }),
    candle({ o: 1.1012, h: 1.1020, l: 1.1015, c: 1.1019 }),
    candle({ o: 1.1019, h: 1.1022, l: 1.1016, c: 1.1020 })
  ];

  const fvg = detectFvgAfterMss(m5, 'LONG', { displacementIndex: 4 });
  assert.deepEqual(fvg, { low: 1.1001, high: 1.1015, createdAtIndex: 5 });
});

test('detectFvgAfterMss finds bearish 3-candle FVG in displacement leg', () => {
  const m5 = [
    candle({ o: 1.1020, h: 1.1024, l: 1.1016, c: 1.1021 }),
    candle({ o: 1.1021, h: 1.1026, l: 1.1018, c: 1.1023 }),
    candle({ o: 1.1023, h: 1.1028, l: 1.1020, c: 1.1025 }),
    candle({ o: 1.1025, h: 1.1027, l: 1.1019, c: 1.1022 }),
    candle({ o: 1.1022, h: 1.1023, l: 1.1007, c: 1.1009 }),
    candle({ o: 1.1009, h: 1.1010, l: 1.1004, c: 1.1006 }),
    candle({ o: 1.1006, h: 1.1008, l: 1.1001, c: 1.1002 })
  ];

  const fvg = detectFvgAfterMss(m5, 'SHORT', { displacementIndex: 4 });
  assert.deepEqual(fvg, { low: 1.1010, high: 1.1019, createdAtIndex: 5 });
});

test('detectOrderBlock returns last opposing candle before MSS displacement', () => {
  const m5 = [
    candle({ o: 1.1000, h: 1.1004, l: 1.0997, c: 1.1002 }),
    candle({ o: 1.1002, h: 1.1005, l: 1.0998, c: 1.0999 }),
    candle({ o: 1.0999, h: 1.1002, l: 1.0996, c: 1.1001 }),
    candle({ o: 1.1001, h: 1.1010, l: 1.1000, c: 1.1009 })
  ];

  const ob = detectOrderBlock(m5, 'LONG', 3);
  assert.deepEqual(ob, {
    index: 1,
    open: 1.1002,
    close: 1.0999,
    bodyLow: 1.0999,
    bodyHigh: 1.1002
  });
});

test('isFvgObConfluent respects configurable pip distance to OB body', () => {
  const fvg = { low: 1.1000, high: 1.1004 };
  const ob = { bodyLow: 1.1006, bodyHigh: 1.1008 };

  assert.equal(isFvgObConfluent(fvg, ob, 5), true);
  assert.equal(isFvgObConfluent(fvg, ob, 1), false);
});

test('resolveRiskConfig maps legacy and risk config values', () => {
  const cfg = resolveRiskConfig({ adrMin: 75, risk: { assumedSpreadPips: 1.4, maxSpreadPips: 2.2 } });
  assert.equal(cfg.minADR, 75);
  assert.equal(cfg.assumedSpreadPips, 1.4);
  assert.equal(cfg.maxSpreadPips, 2.2);
  assert.equal(cfg.newsFilterEnabled, false);
});

test('generateSignal blocked by ADR filter', () => {
  const signal = generateSignal({
    pair: 'EURUSD',
    data: {
      m5: [],
      m15: [],
      daily: Array.from({ length: 14 }).map(() => ({ high: 1.1005, low: 1.0995 })),
      integrityReport: { isValid: true }
    },
    settings: { minADR: 20, assumedSpreadPips: 1, maxSpreadPips: 2 }
  });

  assert.equal(signal.direction, 'NO_TRADE');
  assert.match(signal.reasoning, /ADR filter blocked/);
});

test('generateSignal blocked by spread filter', () => {
  const signal = generateSignal({
    pair: 'EURUSD',
    data: {
      m5: [],
      m15: [],
      daily: Array.from({ length: 14 }).map(() => ({ high: 1.11, low: 1.09 })),
      integrityReport: { isValid: true }
    },
    settings: { minADR: 80, assumedSpreadPips: 3.2, maxSpreadPips: 2.0 }
  });

  assert.equal(signal.direction, 'NO_TRADE');
  assert.match(signal.reasoning, /spread filter blocked/);
});

test('generateSignal blocked by near-news filter when enabled', () => {
  const signal = generateSignal({
    pair: 'EURUSD',
    data: {
      m5: [],
      m15: [],
      daily: Array.from({ length: 14 }).map(() => ({ high: 1.11, low: 1.09 })),
      integrityReport: { isValid: true }
    },
    settings: {
      minADR: 80,
      assumedSpreadPips: 1.1,
      maxSpreadPips: 2.0,
      newsFilterEnabled: true,
      nearHighImpactNews: true
    }
  });

  assert.equal(signal.direction, 'NO_TRADE');
  assert.match(signal.reasoning, /near high-impact news/);
});

test('detectFvgAfterMss rejects FVG when already traded through', () => {
  const m5 = [
    candle({ o: 1.1000, h: 1.1004, l: 1.0994, c: 1.0999 }),
    candle({ o: 1.0999, h: 1.1001, l: 1.0991, c: 1.0995 }),
    candle({ o: 1.0995, h: 1.1000, l: 1.0990, c: 1.0997 }),
    candle({ o: 1.0997, h: 1.1001, l: 1.0993, c: 1.1000 }),
    candle({ o: 1.1000, h: 1.1014, l: 1.0999, c: 1.1012 }),
    candle({ o: 1.1012, h: 1.1020, l: 1.1015, c: 1.1019 }),
    candle({ o: 1.1019, h: 1.1022, l: 1.1000, c: 1.1008 })
  ];

  const fvg = detectFvgAfterMss(m5, 'LONG', { displacementIndex: 4 });
  assert.equal(fvg, null);
});

test('generateSignal refuses on data integrity issues', () => {
  const data = {
    m5: [],
    m15: [],
    daily: Array.from({ length: 14 }).map(() => ({ high: 1.1, low: 1.09 })),
    integrityReport: {
      isValid: false,
      m5: { duplicates: 1, largeGaps: 0, outOfOrder: 0 },
      m15: { duplicates: 0, largeGaps: 1, outOfOrder: 0 }
    }
  };

  const signal = generateSignal({ pair: 'EURUSD', data, settings: { adrMin: 80, rrTarget: 2.5 } });
  assert.equal(signal.direction, 'NO_TRADE');
  assert.match(signal.reasoning, /NO TRADE: data integrity/);
});
