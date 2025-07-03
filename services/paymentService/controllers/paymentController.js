const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db'); // Assuming a db module exists

const createPaymentIntent = async (req, res) => {
    const { amount, currency, userId } = req.body;

    if (!amount || !currency || !userId) {
        return res.status(400).send({ error: 'Missing required fields: amount, currency, userId' });
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Amount in cents
            currency: currency,
            payment_method_types: ['card', 'mpesa'],
            metadata: { userId }
        });

        // Save initial payment record to our DB
        await db.query(
            'INSERT INTO payments (id, user_id, amount, currency, status, transaction_id) VALUES ($1, $2, $3, $4, $5, $1)',
            [paymentIntent.id, userId, amount, currency, paymentIntent.status]
        );

        res.status(200).send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).send({ error: 'Failed to create payment intent' });
    }
};

const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed.', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        await db.query('UPDATE payments SET status = $1 WHERE transaction_id = $2', ['succeeded', paymentIntent.id]);
        console.log(`PaymentIntent ${paymentIntent.id} succeeded.`);
        // Fulfill the purchase (e.g., grant access to premium features)
    } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        await db.query('UPDATE payments SET status = $1 WHERE transaction_id = $2', ['failed', paymentIntent.id]);
        console.log(`PaymentIntent ${paymentIntent.id} failed.`);
    }

    res.status(200).send();
};

const getPaymentHistory = async (req, res) => {
    const { userId } = req.params;

    try {
        const { rows } = await db.query('SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).send({ error: 'Failed to fetch payment history' });
    }
};

module.exports = {
    createPaymentIntent,
    handleWebhook,
    getPaymentHistory
};
