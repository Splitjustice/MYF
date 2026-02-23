const express = require('express');
const { getMarketData } = require('../services/marketDataService');
const { generateSignal } = require('../services/signalEngine');
const { updateSignalStatus, OPEN_STATUSES } = require('../services/signalLifecycle');
const { authRequired } = require('../middleware/auth');
const { loadDb, saveDb } = require('../utils/fileDb');

const router = express.Router();

router.get('/', authRequired, async (req, res) => {
  const db = loadDb();
  const settings = db.settings;
  const now = new Date();
  const nextSignals = [...db.signals];

  for (const pair of settings.enabledPairs) {
    const data = await getMarketData(pair);
    const latestCandle = data.m5[data.m5.length - 1];

    for (let i = 0; i < nextSignals.length; i += 1) {
      if (nextSignals[i].pair !== pair) continue;
      nextSignals[i] = updateSignalStatus(nextSignals[i], latestCandle, now, settings.signalExpiryBufferMin ?? 15);
    }

    const hasOpenSignal = nextSignals.some((s) => s.pair === pair && OPEN_STATUSES.has(s.status));
    if (hasOpenSignal) continue;

    const signal = generateSignal({ pair, data, settings });
    if (signal.direction === 'NO_TRADE') continue;

    nextSignals.unshift({
      id: `${pair}_${Date.now()}`,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      status: 'NEW',
      entry: signal.entry,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      rr: signal.rr,
      killzone: signal.killzone,
      ...signal
    });
  }

  db.signals = nextSignals;
  saveDb(db);
  res.json({ signals: nextSignals });
});

module.exports = router;
