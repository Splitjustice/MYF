const { getKillzoneEndWithBuffer, toLondonDateTime } = require('../utils/time');

const OPEN_STATUSES = new Set(['NEW', 'ACTIVE']);

const updateSignalStatus = (signal, latestCandle, now, expiryBufferMinutes = 15) => {
  if (!OPEN_STATUSES.has(signal.status)) return signal;

  const nowLondon = toLondonDateTime(now);
  const expiry = getKillzoneEndWithBuffer(signal.killzone, signal.createdAt, expiryBufferMinutes);
  if (nowLondon > expiry) return { ...signal, status: 'EXPIRED', closedAt: nowLondon.toISO() };

  if (!latestCandle) return { ...signal, status: signal.status === 'NEW' ? 'ACTIVE' : signal.status };

  if (signal.direction === 'LONG') {
    if (latestCandle.low <= signal.stopLoss) return { ...signal, status: 'HIT_SL', closedAt: nowLondon.toISO() };
    if (latestCandle.high >= signal.takeProfit) return { ...signal, status: 'HIT_TP', closedAt: nowLondon.toISO() };
  }

  if (signal.direction === 'SHORT') {
    if (latestCandle.high >= signal.stopLoss) return { ...signal, status: 'HIT_SL', closedAt: nowLondon.toISO() };
    if (latestCandle.low <= signal.takeProfit) return { ...signal, status: 'HIT_TP', closedAt: nowLondon.toISO() };
  }

  return { ...signal, status: signal.status === 'NEW' ? 'ACTIVE' : signal.status };
};

module.exports = { updateSignalStatus, OPEN_STATUSES };
