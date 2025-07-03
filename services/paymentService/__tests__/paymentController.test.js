const request = require('supertest');
const { app, server } = require('../index');
const db = require('../db');
const stripe = require('stripe');

jest.mock('stripe', () => {
    const mStripe = {
        paymentIntents: {
            create: jest.fn(),
        },
        webhooks: {
            constructEvent: jest.fn(),
        },
    };
    return jest.fn(() => mStripe);
});

jest.mock('../db', () => ({
    query: jest.fn(),
}));

describe('Payment Controller', () => {
    afterAll(done => {
        server.close(done);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /create-payment-intent', () => {
        it('should create a payment intent successfully', async () => {
            const mockPaymentIntent = { id: 'pi_123', client_secret: 'cs_123', status: 'requires_payment_method' };
            stripe().paymentIntents.create.mockResolvedValue(mockPaymentIntent);
            db.query.mockResolvedValue({});

            const response = await request(app)
                .post('/create-payment-intent')
                .send({ amount: 1000, currency: 'usd', userId: 'user_123' });

            expect(response.status).toBe(200);
            expect(response.body.clientSecret).toBe('cs_123');
            expect(stripe().paymentIntents.create).toHaveBeenCalledWith({
                amount: 100000,
                currency: 'usd',
                payment_method_types: ['card', 'mpesa'],
                metadata: { userId: 'user_123' },
            });
            expect(db.query).toHaveBeenCalled();
        });

        it('should return 400 for missing fields', async () => {
            const response = await request(app)
                .post('/create-payment-intent')
                .send({ amount: 1000 });
            expect(response.status).toBe(400);
        });
    });

    describe('POST /webhook', () => {
        it('should handle payment_intent.succeeded', async () => {
            const mockEvent = {
                type: 'payment_intent.succeeded',
                data: { object: { id: 'pi_123' } },
            };
            stripe().webhooks.constructEvent.mockReturnValue(mockEvent);
            db.query.mockResolvedValue({});

            const response = await request(app)
                .post('/webhook')
                .set('stripe-signature', 'sig_123')
                .send('payload');
            
            expect(response.status).toBe(200);
            expect(db.query).toHaveBeenCalledWith(
                'UPDATE payments SET status = $1 WHERE transaction_id = $2',
                ['succeeded', 'pi_123']
            );
        });

        it('should handle payment_intent.payment_failed', async () => {
            const mockEvent = {
                type: 'payment_intent.payment_failed',
                data: { object: { id: 'pi_456' } },
            };
            stripe().webhooks.constructEvent.mockReturnValue(mockEvent);
            db.query.mockResolvedValue({});

            const response = await request(app)
                .post('/webhook')
                .set('stripe-signature', 'sig_456')
                .send('payload');

            expect(response.status).toBe(200);
            expect(db.query).toHaveBeenCalledWith(
                'UPDATE payments SET status = $1 WHERE transaction_id = $2',
                ['failed', 'pi_456']
            );
        });
    });

    describe('GET /:userId', () => {
        it('should fetch payment history', async () => {
            const mockHistory = [{ id: 'pi_123', amount: 1000 }];
            db.query.mockResolvedValue({ rows: mockHistory });

            const response = await request(app).get('/user_123');
            
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockHistory);
            expect(db.query).toHaveBeenCalledWith('SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC', ['user_123']);
        });
    });
}); 