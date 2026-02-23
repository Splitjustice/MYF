const app = require('./app');
const { port } = require('./config/env');

app.listen(port, () => {
  console.log(`Killzone Edge backend running on ${port}`);
});
