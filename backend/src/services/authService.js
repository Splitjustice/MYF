const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { jwtSecret } = require('../config/env');
const { loadDb, saveDb } = require('../utils/fileDb');

const buildToken = (userId) => jwt.sign({ sub: userId }, jwtSecret, { expiresIn: '7d' });

const register = async ({ email, password, name }) => {
  const db = loadDb();
  if (db.users.find((u) => u.email === email)) throw new Error('Email already exists');
  const id = `u_${Date.now()}`;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id, email, name, passwordHash, preferredPairs: ['GBPUSD', 'EURUSD'], notificationsEnabled: true };
  db.users.push(user);
  saveDb(db);
  return { token: buildToken(id), user: sanitize(user) };
};

const login = async ({ email, password }) => {
  const db = loadDb();
  const user = db.users.find((u) => u.email === email);
  if (!user) throw new Error('Invalid credentials');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error('Invalid credentials');
  return { token: buildToken(user.id), user: sanitize(user) };
};

const sanitize = (user) => {
  const { passwordHash, ...safe } = user;
  return safe;
};

module.exports = { register, login, sanitize };
