const request = require('supertest');
const app = require('../index'); // Assuming index exports the app
const db = require('../db');
const fs = require('fs');
const path = require('path');

describe('Assessment Controller Integration', () => {
    let server;
    // Known template IDs from the seed script
    const PHQ9_ID = '00000000-0000-0000-0000-000000000001';
    const GAD7_ID = '00000000-0000-0000-0000-000000000002';
    // A user ID for testing. In a real scenario, this would be created.
    const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';
    let createdResponseIds = [];

    beforeAll(async () => {
        // Start the server on a random port
        await new Promise(resolve => {
            server = app.listen(0, resolve);
        });
        // Seed the database
        const seedSql = fs.readFileSync(path.join(__dirname, '../../../add_assessment_templates.sql')).toString();
        await db.query(seedSql);
    });

    afterAll(async () => {
        // Clean up all created test data
        if (createdResponseIds.length > 0) {
            await db.query('DELETE FROM assessment_responses WHERE id = ANY($1)', [createdResponseIds]);
        }
        // It's better to use a specific test user that can be cleaned up
        await db.query("DELETE FROM users WHERE email = 'integration_test_user@test.com'");
        await db.query("DELETE FROM assessment_templates WHERE id = ANY($1)", [[PHQ9_ID, GAD7_ID, '00000000-0000-0000-0000-000000000003']]);
        
        await new Promise(resolve => server.close(resolve));
        await db.pool.end(); // Close the connection pool
    });

    // We need a test user for foreign key constraints
    beforeEach(async () => {
        await db.query("INSERT INTO users (id, email, password_hash, first_name) VALUES ($1, 'integration_test_user@test.com', 'hash', 'Test') ON CONFLICT (email) DO NOTHING", [TEST_USER_ID]);
    });

    it('should fetch all assessment templates', async () => {
        const res = await request(server).get('/templates');
        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toBeGreaterThanOrEqual(3);
        expect(res.body.find(t => t.id === PHQ9_ID)).toBeDefined();
    });

    it('should fetch a single assessment template by ID', async () => {
        const res = await request(server).get(`/templates/${GAD7_ID}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toEqual('GAD-7 Anxiety Screening');
    });

    it('should submit an assessment response and calculate score', async () => {
        const responses = { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3, q8: 3, q9: 3 };
        const res = await request(server)
            .post('/responses')
            .send({
                user_id: TEST_USER_ID,
                template_id: PHQ9_ID,
                responses: responses,
                cultural_context: { region: 'test' }
            });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body.scores.total_score).toEqual(27);
        expect(res.body.interpretation.level).toEqual('Severe');
        createdResponseIds.push(res.body.id); // Save for cleanup
    });

    it('should fetch assessment progress for a user', async () => {
        // First, create a response to ensure there's progress
        const responses = { q1: 1, q2: 1 };
        const createRes = await request(server)
            .post('/responses')
            .send({ user_id: TEST_USER_ID, template_id: GAD7_ID, responses });
        createdResponseIds.push(createRes.body.id);

        const res = await request(server).get(`/progress?user_id=${TEST_USER_ID}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0].user_id).toEqual(TEST_USER_ID);
    });
    
    it('should get recommendations for a user', async () => {
        // Submit a high-scoring assessment
        const responses = { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3 };
        const createRes = await request(server)
            .post('/responses')
            .send({ user_id: TEST_USER_ID, template_id: GAD7_ID, responses });
        createdResponseIds.push(createRes.body.id);

        const res = await request(server).get(`/recommendations?user_id=${TEST_USER_ID}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.recommendations).toBeDefined();
        expect(res.body.recommendations[0].type).toEqual('professional_help');
    });
}); 