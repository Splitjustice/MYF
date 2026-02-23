const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'store.json');

const loadDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
const saveDb = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

module.exports = { loadDb, saveDb };
