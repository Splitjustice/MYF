const test = require('node:test');
const assert = require('node:assert');
const { getSession, isWithinLondonWindow, WINDOWS, toLondonDateTime, LONDON_TZ } = require('../src/utils/time');

const cases = [
  {
    name: 'winter',
    ts: '2026-01-15T08:30:00Z',
    expectSession: 'London',
    asianIn: '2026-01-15T01:30:00Z',
    asianOut: '2026-01-15T05:30:00Z',
    nyIn: '2026-01-15T12:30:00Z',
    nyOut: '2026-01-15T15:30:00Z'
  },
  {
    name: 'summer',
    ts: '2026-07-15T07:30:00Z',
    expectSession: 'London',
    asianIn: '2026-07-15T00:30:00+01:00',
    asianOut: '2026-07-15T05:30:00+01:00',
    nyIn: '2026-07-15T12:30:00+01:00',
    nyOut: '2026-07-15T15:30:00+01:00'
  }
];

test('converts timestamps to Europe/London timezone safely', () => {
  const dt = toLondonDateTime('2026-07-15T07:30:00Z');
  assert.equal(dt.zoneName, LONDON_TZ);
  assert.equal(dt.hour, 8);
});

for (const c of cases) {
  test(`session windows are correct in ${c.name}`, () => {
    assert.equal(getSession(c.ts), c.expectSession);
    assert.equal(isWithinLondonWindow(c.asianIn, WINDOWS.ASIAN_RANGE), true);
    assert.equal(isWithinLondonWindow(c.asianOut, WINDOWS.ASIAN_RANGE), false);
    assert.equal(isWithinLondonWindow(c.nyIn, WINDOWS.NY_KZ), true);
    assert.equal(isWithinLondonWindow(c.nyOut, WINDOWS.NY_KZ), false);
  });
}
