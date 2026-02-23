const express = require('express');
const { runBacktest } = require('../services/backtestService');

const router = express.Router();

router.post('/run', async (req, res) => {
  try {
    const { pair, dateISO, strategy, timeframe, rr } = req.body;
    if (!pair || !dateISO || !strategy || !timeframe) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const output = await runBacktest({ pair, dateISO, strategy, timeframe, rr });
    return res.json(output);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
