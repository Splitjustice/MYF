const test = require('node:test');
const assert = require('node:assert');
const { updateSignalStatus } = require('../src/services/signalLifecycle');

const baseSignal = {
  id: 's1',
  pair: 'EURUSD',
  direction: 'LONG',
  entry: 1.1,
  stopLoss: 1.098,
  takeProfit: 1.104,
  killzone: 'London',
  status: 'NEW',
  createdAt: '2026-01-15T08:00:00Z'
};

test('transitions NEW to ACTIVE when still valid', () => {
  const next = updateSignalStatus(baseSignal, { high: 1.101, low: 1.099 }, '2026-01-15T08:30:00Z', 15);
  assert.equal(next.status, 'ACTIVE');
});

test('marks HIT_TP when price touches tp', () => {
  const next = updateSignalStatus({ ...baseSignal, status: 'ACTIVE' }, { high: 1.1041, low: 1.099 }, '2026-01-15T08:40:00Z', 15);
  assert.equal(next.status, 'HIT_TP');
});

test('marks EXPIRED after killzone end + buffer', () => {
  const next = updateSignalStatus({ ...baseSignal, status: 'ACTIVE' }, { high: 1.101, low: 1.099 }, '2026-01-15T10:20:00Z', 15);
  assert.equal(next.status, 'EXPIRED');
});
