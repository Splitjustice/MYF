const express = require('express');
const { register, login, sanitize } = require('../services/authService');
const { authRequired } = require('../middleware/auth');
const { loadDb, saveDb } = require('../utils/fileDb');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const result = await register(req.body);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const result = await login(req.body);
    res.json(result);
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

router.get('/me', authRequired, (req, res) => res.json({ user: sanitize(req.user) }));

router.patch('/profile', authRequired, (req, res) => {
  const db = loadDb();
  const idx = db.users.findIndex((u) => u.id === req.user.id);
  db.users[idx] = { ...db.users[idx], ...req.body };
  saveDb(db);
  res.json({ user: sanitize(db.users[idx]) });
});

module.exports = router;
