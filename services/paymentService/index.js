
const express = require('express');
const app = express();
const paymentRoutes = require('./routes/payments');

app.use(express.json());
app.use('/api/payments', paymentRoutes);

const PORT = process.env.PAYMENT_SERVICE_PORT || 3006;
app.listen(PORT, () => {
    console.log(`Payment Service running on port ${PORT}`);
});
