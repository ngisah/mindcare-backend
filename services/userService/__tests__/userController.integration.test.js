const request = require('supertest');
const { app, server } = require('../index');
const db = require('../db');

describe('User Service Integration', () => {
    const testUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        first_name: 'Test',
        last_name: 'User'
    };
    let accessToken;
    let userId;

    afterAll(async () => {
        // Clean up the created test user
        if (userId) {
            await db.query('DELETE FROM user_profiles WHERE user_id = $1', [userId]);
            await db.query('DELETE FROM users WHERE id = $1', [userId]);
        }
        await db.pool.end();
        await new Promise(resolve => server.close(resolve));
    });

    it('should register a new user successfully', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);
        
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('accessToken');
        const userRes = await db.query("SELECT id FROM users WHERE email = $1", [testUser.email]);
        userId = userRes.rows[0].id;
    });

    it('should log in an existing user and return a token', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('accessToken');
        accessToken = res.body.accessToken;
    });

    it('should get the user profile with a valid token', async () => {
        const res = await request(app)
            .get(`/api/users/profile`)
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.email).toEqual(testUser.email);
    });

    it('should update the user profile', async () => {
        const res = await request(app)
            .put(`/api/users/profile`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ first_name: 'Updated' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.first_name).toEqual('Updated');
    });

    it('should not get the user profile with an invalid token', async () => {
        const res = await request(app)
            .get(`/api/users/profile`)
            .set('Authorization', 'Bearer invalidtoken');
        
        expect(res.statusCode).toEqual(401);
    });
}); 