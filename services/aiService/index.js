require('dotenv').config({ path: '../../.env' });
const express = require('express');
const app = express();
const port = 3003;

const aiRoutes = require('./routes/ai');

app.use(express.json());

app.get('/', (req, res) => {
  res.send('AI Service is running!');
});

app.use('/ai', aiRoutes);

app.listen(port, () => {
  console.log(`AI Service listening at http://localhost:${port}`);
});
