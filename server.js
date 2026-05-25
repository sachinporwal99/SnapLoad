const app = require('./src/app');
const { PORT } = require('./src/config');

app.listen(PORT, () => {
  console.log(`\n✅ SnapLoad running → http://localhost:${PORT}\n`);
});
