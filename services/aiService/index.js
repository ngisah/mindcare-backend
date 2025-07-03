require('dotenv').config({ path: '../../.env' });
const express = require('express');
const aiRoutes = require('./routes/ai');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/', aiRoutes);

const server = app.listen(port, () => {
    console.log(`AI service listening at http://localhost:${port}`);
});

module.exports = { app, server };
