const express = require('express');
const paymentRoutes = require('./routes/payments');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/', paymentRoutes);

const server = app.listen(port, () => {
    console.log(`Payment service listening at http://localhost:${port}`);
});

module.exports = { app, server };
