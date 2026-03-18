const app = require('./app');
const seed = require('./seed');

const PORT = process.env.PORT || 4000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`SmartPark API running on port ${PORT}`);
  await seed();
});
