const request = require('supertest');
const { app, server } = require('../index'); // Bring in the express app and server
const db = '.._db_';
const AWS = require('aws-sdk');
const twilio = require('twilio');
const db_mock = require('../db');
const SES = require('aws-sdk').SES;
const twilio_mock = require('twilio');

// Mock external dependencies
jest.mock('../db', () => ({ query: jest.fn() }));
jest.mock('aws-sdk', () => {
    const mockSES = {
        sendEmail: jest.fn().mockReturnThis(),
        promise: jest.fn(),
    };
    return {
        SES: jest.fn(() => mockSES),
    };
});
jest.mock('twilio', () => {
    const mockTwilio = {
        messages: {
            create: jest.fn().mockResolvedValue({ sid: 'SM_SID' })
        }
    };
    return jest.fn(() => mockTwilio);
});

describe('Notification Controller', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /email', () => {
        it('should send an email successfully', async () => {
            const sesInstance = new SES();
            sesInstance.sendEmail().promise.mockResolvedValueOnce({ MessageId: 'test-message-id' });

            const emailData = { to: 'test@example.com', subject: 'Test', body: 'This is a test' };
            const response = await request(app).post('/email').send(emailData);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Email sent successfully');
            expect(sesInstance.sendEmail).toHaveBeenCalled();
        });

        it('should return 400 if required fields are missing', async () => {
            const response = await request(app).post('/email').send({ to: 'test@example.com' });
            expect(response.status).toBe(400);
            expect(response.text).toBe('Missing required fields: to, subject, body');
        });

        it('should return 500 if AWS SES fails', async () => {
            const sesInstance = new SES();
            sesInstance.sendEmail().promise.mockRejectedValueOnce(new Error('AWS Error'));
            const emailData = { to: 'test@example.com', subject: 'Test', body: 'This is a test' };
            const response = await request(app).post('/email').send(emailData);
            expect(response.status).toBe(500);
            expect(response.text).toBe('Failed to send email');
        });
    });

    describe('POST /sms', () => {
        it('should send an SMS successfully', async () => {
            const smsData = { to: '+1234567890', body: 'Test SMS' };
            const response = await request(app).post('/sms').send(smsData);
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('SMS sent successfully');
            expect(twilio_mock().messages.create).toHaveBeenCalled();
        });

        it('should return 400 if required fields are missing', async () => {
            const response = await request(app).post('/sms').send({});
            expect(response.status).toBe(400);
            expect(response.text).toBe('Missing required fields: to, body');
        });

        it('should return 500 if twilio fails', async () => {
            twilio_mock().messages.create.mockRejectedValueOnce(new Error('Twilio Error'));
            const smsData = { to: '+1234567890', body: 'Test SMS' };
            const response = await request(app).post('/sms').send(smsData);
            expect(response.status).toBe(500);
            expect(response.text).toBe('Failed to send SMS');
        });
    });

    describe('GET /:userId', () => {
        it('should fetch notifications for a user', async () => {
            const mockNotifications = [{ id: '1', content: 'Test Notification' }];
            db_mock.query.mockResolvedValue({ rows: mockNotifications });

            const response = await request(app).get('/user123');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockNotifications);
            expect(db_mock.query).toHaveBeenCalledWith('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', ['user123']);
        });

        it('should return 500 if there is a database error', async () => {
            db_mock.query.mockRejectedValue(new Error('DB Error'));
            const response = await request(app).get('/user123');
            expect(response.status).toBe(500);
            expect(response.text).toBe('Failed to fetch notifications');
        });
    });
});

afterAll((done) => {
    server.close(done);
}); 