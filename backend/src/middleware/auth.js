const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { loadDb } = require('../utils/fileDb');

const authRequired = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Missing token' });
  try {
    const token = header.replace('Bearer ', '');
    const payload = jwt.verify(token, jwtSecret);
    const user = loadDb().users.find((u) => u.id === payload.sub);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { authRequired };
