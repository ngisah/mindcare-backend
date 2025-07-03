const request = require('supertest');
const { app, server, io, redisClient } = require('../index');
const db = require('../db');
const { io: Client } = require('socket.io-client');

describe('Chat Service Integration', () => {
    let clientSocket;
    const testUser = { id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', email: 'chat-user@test.com', password: 'password', first_name: 'Chat' };
    let conversationId;

    beforeAll(async () => {
        await new Promise(resolve => server.listen(0, resolve));
        // Create a test user
        await db.query("INSERT INTO users (id, email, password_hash, first_name) VALUES ($1, $2, 'hash', $3) ON CONFLICT (id) DO NOTHING", [testUser.id, testUser.email, testUser.first_name]);
        
        // Setup Socket.IO client
        const port = server.address().port;
        clientSocket = Client(`http://localhost:${port}`);
        await new Promise(resolve => clientSocket.on('connect', resolve));
    });

    afterAll(async () => {
        // Cleanup
        if (conversationId) {
            await db.query('DELETE FROM messages WHERE conversation_id = $1', [conversationId]);
            await db.query('DELETE FROM conversations WHERE id = $1', [conversationId]);
        }
        await db.query('DELETE FROM users WHERE id = $1', [testUser.id]);
        
        io.close();
        if(redisClient.isOpen) await redisClient.quit();
        await db.pool.end();
        if(clientSocket) clientSocket.close();
        await new Promise(resolve => server.close(resolve));
    });

    describe('REST Endpoints', () => {
        it('should create a new conversation', async () => {
            const res = await request(app)
                .post('/conversations')
                .send({ user_id: testUser.id, title: 'Test Conversation' });
            
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('id');
            conversationId = res.body.id;

            // Check if it's in Redis
            const cached = await redisClient.get(`conversation:${conversationId}`);
            expect(cached).not.toBeNull();
        });

        it('should get messages for a conversation', async () => {
            // First, create a message
            await db.query("INSERT INTO messages (conversation_id, sender_type, encrypted_content, encryption_key_id) VALUES ($1, 'user', 'hello', 'key1')", [conversationId]);
            
            const res = await request(app).get(`/conversations/${conversationId}/messages`);
            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBeGreaterThan(0);
        });
    });

    describe('Socket.IO Events', () => {
        it('should join a conversation and receive a message', (done) => {
            const message = { conversationId: conversationId, content: 'Hello via Socket!' };
            
            clientSocket.emit('join_conversation', { conversationId });

            clientSocket.on('message_received', (msg) => {
                expect(msg.content).toBe(message.content);
                done();
            });

            // Add a small delay to ensure the join event is processed before sending the message
            setTimeout(() => {
                clientSocket.emit('send_message', message);
            }, 100);
        });
    });
}); 