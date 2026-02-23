const express = require('express');
const { authRequired } = require('../middleware/auth');
const { loadDb } = require('../utils/fileDb');
const { getSession } = require('../utils/time');

const router = express.Router();

router.get('/', authRequired, (req, res) => {
  const db = loadDb();
  const journal = db.journal;
  const wins = journal.filter((t) => t.outcome === 'WIN').length;
  const rollingWinRate = journal.length ? (wins / journal.length) * 100 : 0;
  const adrToday = db.signals.length ? db.signals.reduce((sum, s) => sum + (s.confidence || 0), 0) / db.signals.length : 85;
  const activeSignals = db.signals.filter((s) => s.status === 'NEW' || s.status === 'ACTIVE').length;
  res.json({ summary: { currentSession: getSession(), adrToday, rollingWinRate, activeSignals } });
});

module.exports = router;
