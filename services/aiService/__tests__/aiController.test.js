const { GoogleGenerativeAI } = require('@google/generative-ai');

const mockSendMessage = jest.fn();
const mockStartChat = jest.fn(() => ({ sendMessage: mockSendMessage }));
const mockGetGenerativeModel = jest.fn(() => ({ startChat: mockStartChat }));

jest.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn(() => ({
        getGenerativeModel: mockGetGenerativeModel,
    })),
}));

const request = require('supertest');
const { app, server } = require('../index');
const db = require('../db');

jest.mock('../db', () => ({
    query: jest.fn(),
}));

describe('AI Controller', () => {
    afterAll(done => {
        server.close(done);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /chat', () => {
        it('should return a successful response from the AI model', async () => {
            const mockApiResponse = {
                response: {
                    text: () => 'Hello! How can I help you today?',
                },
            };
            mockSendMessage.mockResolvedValue(mockApiResponse);

            const response = await request(app)
                .post('/chat')
                .send({
                    message: 'Hello',
                    history: [],
                    userId: 'user123',
                    culturalContext: { region: 'West Africa' }
                });

            expect(response.status).toBe(200);
            expect(response.body.response).toBe('Hello! How can I help you today?');
            expect(mockSendMessage).toHaveBeenCalled();
        });

        it('should return 400 for missing fields', async () => {
            const response = await request(app)
                .post('/chat')
                .send({ message: 'Hello' });
            expect(response.status).toBe(400);
        });

        it('should handle errors from the AI model', async () => {
            mockSendMessage.mockRejectedValue(new Error('AI Error'));

            const response = await request(app)
                .post('/chat')
                .send({
                    message: 'Hello',
                    history: [],
                    userId: 'user123',
                    culturalContext: {}
                });

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to get response from AI');
        });

        it('should handle an empty response from the AI model', async () => {
            const mockApiResponse = {
                response: {
                    text: () => '',
                },
            };
            mockSendMessage.mockResolvedValue(mockApiResponse);

            const response = await request(app)
                .post('/chat')
                .send({
                    message: 'Hello',
                    history: [],
                    userId: 'user123',
                    culturalContext: {}
                });

            expect(response.status).toBe(200);
            expect(response.body.response).toBe('');
        });
    });
}); 