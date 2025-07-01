const express = require('express');
const app = express();
const port = 3006;
const analyticsRoutes = require('./routes/analyticsRoutes');

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Analytics Service is running!');
});

app.use('/api/analytics', analyticsRoutes);

app.listen(port, () => {
  console.log(`Analytics Service listening at http://localhost:${port}`);
});
