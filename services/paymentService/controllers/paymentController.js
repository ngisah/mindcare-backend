
const pool = require('../models/payment'); // Assuming payment.js will be created for connection

exports.processPayment = async (req, res) => {
    try {
        const { userId, amount, currency, paymentMethodId, subscriptionPlanId } = req.body;
        // Simulate payment processing
        const transactionId = `txn_${Date.now()}`;
        const status = 'completed';

        const result = await pool.query(
            'INSERT INTO payments (user_id, amount, currency, payment_method_id, subscription_plan_id, transaction_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [userId, amount, currency, paymentMethodId, subscriptionPlanId, transactionId, status]
        );
        res.status(200).json({ message: 'Payment processed successfully', transaction: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.handleWebhook = async (req, res) => {
    try {
        // This would typically involve verifying the webhook signature and processing the event
        console.log('Webhook received:', req.body);
        res.status(200).json({ received: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getUserSubscriptions = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query('SELECT * FROM subscriptions WHERE user_id = $1', [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createSubscription = async (req, res) => {
    try {
        const { userId, planId, startDate, endDate, status } = req.body;
        const result = await pool.query(
            'INSERT INTO subscriptions (user_id, plan_id, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userId, planId, startDate, endDate, status]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateSubscription = async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const { planId, startDate, endDate, status } = req.body;
        const result = await pool.query(
            'UPDATE subscriptions SET plan_id = $1, start_date = $2, end_date = $3, status = $4 WHERE id = $5 RETURNING *',
            [planId, startDate, endDate, status, subscriptionId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Subscription not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.cancelSubscription = async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const result = await pool.query('UPDATE subscriptions SET status = 'cancelled' WHERE id = $1 RETURNING *', [subscriptionId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Subscription not found' });
        }
        res.json({ message: 'Subscription cancelled successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
