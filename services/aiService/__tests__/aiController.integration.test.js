const request = require('supertest');
const { app, server } = require('../index');

// We are not mocking the dependencies here to test the real integration

describe('AI Controller Integration', () => {
    // Increase the timeout for this test suite as it makes real API calls
    jest.setTimeout(30000);

    afterAll(done => {
        server.close(done);
    });

    describe('POST /chat', () => {
        it('should return a successful response from the real Gemini API', async () => {
            const response = await request(app)
                .post('/chat')
                .send({
                    message: 'Hello, how are you?',
                    history: [],
                    userId: 'integration-test-user',
                    culturalContext: { region: 'East Africa' }
                });

            expect(response.status).toBe(200);
            expect(response.body.response).toBeDefined();
            expect(typeof response.body.response).toBe('string');
            expect(response.body.response.length).toBeGreaterThan(0);
            console.log("Gemini Response:", response.body.response);
        });

        it('should handle a more complex conversation', async () => {
            const history = [
                {
                    role: "user",
                    parts: [{ text: "Hello, I am feeling a bit down today." }],
                },
                {
                    role: "model",
                    parts: [{ text: "I'm sorry to hear that. I'm here to listen. What's on your mind?" }],
                }
            ];

            const response = await request(app)
                .post('/chat')
                .send({
                    message: 'I am worried about my exams.',
                    history: history,
                    userId: 'integration-test-user-2',
                    culturalContext: { region: 'Nigeria' }
                });

            expect(response.status).toBe(200);
            expect(response.body.response).toBeDefined();
            expect(typeof response.body.response).toBe('string');
            expect(response.body.response.length).toBeGreaterThan(0);
            console.log("Gemini Response (complex convo):", response.body.response);
        });
    });
}); 