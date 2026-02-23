const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/app');

test('health endpoint returns ok', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  const body = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/health`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });

  server.close();
  assert.equal(JSON.parse(body).ok, true);
});
