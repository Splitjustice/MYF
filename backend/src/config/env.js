const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'super-secret-key',
  twelveDataApiKey: process.env.TWELVE_DATA_API_KEY || ''
};
