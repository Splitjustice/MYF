const express = require('express');
const { authRequired } = require('../middleware/auth');
const { loadDb, saveDb } = require('../utils/fileDb');

const router = express.Router();
router.use(authRequired);

router.get('/settings', (req, res) => {
  const db = loadDb();
  res.json({ settings: db.settings });
});

router.patch('/settings', (req, res) => {
  const db = loadDb();
  db.settings = { ...db.settings, ...req.body.settings };
  saveDb(db);
  res.json({ settings: db.settings });
});

module.exports = router;
