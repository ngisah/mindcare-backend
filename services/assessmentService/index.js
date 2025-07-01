const express = require('express');
const app = express();
const port = 3004;

const assessmentRoutes = require('./routes/assessments');

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Assessment Service is running!');
});

app.use('/assessments', assessmentRoutes);

app.listen(port, () => {
  console.log(`Assessment Service listening at http://localhost:${port}`);
});
