require('dotenv').config({ path: '../../.env' });
const express = require('express');
const app = express();
const port = 3001;

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.get('/', (req, res) => {
  res.send('User Service is running!');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.listen(port, () => {
  console.log(`User Service listening at http://localhost:${port}`);
});
