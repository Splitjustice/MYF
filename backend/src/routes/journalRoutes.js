const express = require('express');
const { authRequired } = require('../middleware/auth');
const { loadDb, saveDb } = require('../utils/fileDb');

const router = express.Router();

router.get('/', authRequired, (req, res) => {
  const db = loadDb();
  res.json({ journal: db.journal.filter((t) => t.userId === req.user.id) });
});

router.post('/', authRequired, (req, res) => {
  const db = loadDb();
  const pnl = Number(req.body.pnl);
  const trade = {
    id: `t_${Date.now()}`,
    userId: req.user.id,
    pair: req.body.pair,
    direction: req.body.direction,
    entry: Number(req.body.entry),
    exit: Number(req.body.exit),
    pnl,
    outcome: pnl >= 0 ? 'WIN' : 'LOSS',
    createdAt: new Date().toISOString()
  };
  db.journal.unshift(trade);
  saveDb(db);
  res.status(201).json({ trade });
});

module.exports = router;
