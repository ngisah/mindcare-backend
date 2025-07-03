const request = require('supertest');
const { app, server } = require('../index');
const client = require('../config/db');
const fs = require('fs');
const path = require('path');

describe('Analytics Controller - Integration Tests', () => {
    
    beforeAll(async () => {
        // Drop tables first to ensure a clean state
        await client.command({ query: 'DROP TABLE IF EXISTS events' });
        await client.command({ query: 'DROP TABLE IF EXISTS assessment_events' });
        await client.command({ query: 'DROP TABLE IF EXISTS performance_metrics' });
        // Create tables
        const schema = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
        const assessmentSchema = fs.readFileSync(path.join(__dirname, '../assessment_schema.sql'), 'utf8');
        const performanceSchema = fs.readFileSync(path.join(__dirname, '../performance_schema.sql'), 'utf8');
        await client.command({ query: schema });
        await client.command({ query: assessmentSchema });
        await client.command({ query: performanceSchema });
    });

    afterAll(async () => {
        // Drop tables
        await client.command({ query: 'DROP TABLE IF EXISTS events' });
        await client.command({ query: 'DROP TABLE IF EXISTS assessment_events' });
        await client.command({ query: 'DROP TABLE IF EXISTS performance_metrics' });
        await client.close();
        await new Promise(resolve => server.close(resolve));
    });

    it('should track an event and then retrieve it in dashboard stats', async () => {
        // 1. Track an event
        const trackRes = await request(app)
            .post('/track')
            .send({ event_name: 'test_event', user_id: 'integration_user' });
        expect(trackRes.statusCode).toBe(200);

        // 2. Track an assessment event
        const trackAssessmentRes = await request(app)
            .post('/track-assessment')
            .send({ user_id: 'integration_user', template_id: 'template1', score: 20 });
        expect(trackAssessmentRes.statusCode).toBe(200);

        // 3. Track a performance metric
        const trackPerfRes = await request(app)
            .post('/track-performance')
            .send({ service_name: 'test_service', endpoint: '/test', response_time_ms: 100, status_code: 200 });
        expect(trackPerfRes.statusCode).toBe(200);
        
        // Give ClickHouse a moment to process the insertions
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 4. Get dashboard stats and verify
        const statsRes = await request(app).get('/dashboard');
        expect(statsRes.statusCode).toBe(200);
        expect(statsRes.body.totalUsers).toBe(1);
        expect(statsRes.body.eventsToday).toBe(1);
        expect(statsRes.body.avgAssessmentScore).toBe(20);
        expect(statsRes.body.avgResponseTime).toBe(100);
        expect(statsRes.body.errorRate).toBe(0);
    });
}); 