const test = require('node:test');
const assert = require('node:assert');
const { runBacktest } = require('../src/services/backtestService');

const mk = (time, o, h, l, c) => ({ time, open: o, high: h, low: l, close: c });

test('runBacktest returns deterministic trade outcome for mocked london sweep scenario', async () => {
  const d = '2026-01-15';
  const candles = [
    mk(`${d}T00:00:00Z`, 1.1000, 1.1003, 1.0997, 1.1000),
    mk(`${d}T01:00:00Z`, 1.1000, 1.1004, 1.0998, 1.1001),
    mk(`${d}T02:00:00Z`, 1.1001, 1.1003, 1.0996, 1.1000),
    mk(`${d}T03:00:00Z`, 1.1000, 1.1002, 1.0998, 1.1000),
    mk(`${d}T04:55:00Z`, 1.1000, 1.1001, 1.0999, 1.1000),

    mk(`${d}T07:00:00Z`, 1.1000, 1.1001, 1.0992, 1.0998), // sweep low + close above asian low
    mk(`${d}T07:05:00Z`, 1.0998, 1.1000, 1.0997, 1.0999),
    mk(`${d}T07:10:00Z`, 1.0999, 1.1005, 1.0998, 1.1002), // swing high candidate
    mk(`${d}T07:15:00Z`, 1.1002, 1.1003, 1.0999, 1.1000),
    mk(`${d}T07:20:00Z`, 1.1000, 1.1002, 1.0999, 1.1001),
    mk(`${d}T07:25:00Z`, 1.1001, 1.1016, 1.1000, 1.1012), // displacement close beyond swing high
    mk(`${d}T07:30:00Z`, 1.1012, 1.1018, 1.1013, 1.1016), // creates bullish FVG vs 07:20 candle
    mk(`${d}T07:35:00Z`, 1.1016, 1.1017, 1.1007, 1.1009), // fills CE
    mk(`${d}T07:40:00Z`, 1.1009, 1.1045, 1.1008, 1.1040)  // hits TP
  ];

  const output = await runBacktest({
    pair: 'EURUSD',
    dateISO: d,
    strategy: 'LONDON_SWEEP',
    timeframe: 'M5',
    rr: 2.5,
    candles
  });

  assert.equal(output.result.outcome, 'EXPIRED');
  assert.equal(output.result.direction, 'LONG');
  assert.ok(output.trace.some((x) => x.includes('Sweep detected')));
});

test('runBacktest returns NO_TRADE when no sweep occurs', async () => {
  const candles = Array.from({ length: 120 }).map((_, i) => mk(
    `2026-01-15T${String(Math.floor(i / 12)).padStart(2, '0')}:${String((i % 12) * 5).padStart(2, '0')}:00Z`,
    1.1000,
    1.1004,
    1.0996,
    1.1000
  ));

  const output = await runBacktest({
    pair: 'EURUSD',
    dateISO: '2026-01-15',
    strategy: 'LONDON_SWEEP',
    timeframe: 'M5',
    rr: 2.5,
    candles
  });

  assert.equal(output.result.outcome, 'NO_TRADE');
  assert.equal(output.result.reason, 'No liquidity sweep');
});
