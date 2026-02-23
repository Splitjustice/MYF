const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const signalRoutes = require('./routes/signalRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const journalRoutes = require('./routes/journalRoutes');
const adminRoutes = require('./routes/adminRoutes');
const backtestRoutes = require('./routes/backtestRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/auth', authRoutes);
app.use('/signals', signalRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/journal', journalRoutes);
app.use('/admin', adminRoutes);
app.use('/api/backtest', backtestRoutes);

module.exports = app;
