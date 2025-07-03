const { trackEvent, getDashboardStats, trackAssessmentEvent, trackPerformanceMetric } = require('../controllers/analyticsController');
const client = require('../config/db');

jest.mock('../config/db', () => ({
    insert: jest.fn(),
    query: jest.fn(),
}));

describe('Analytics Controller - Unit Tests', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Mock request and response objects
    const mockRequest = (body) => ({ body });
    const mockResponse = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    describe('trackEvent', () => {
        it('should track an event successfully', async () => {
            const req = mockRequest({ event_name: 'test_event', user_id: 'user123', properties: { foo: 'bar' } });
            const res = mockResponse();
            client.insert.mockResolvedValue();

            await trackEvent(req, res);

            expect(client.insert).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Event tracked successfully' });
        });

        it('should return 400 if required fields are missing', async () => {
            const req = mockRequest({ event_name: 'test_event' });
            const res = mockResponse();
            await trackEvent(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getDashboardStats', () => {
        it('should retrieve dashboard stats successfully', async () => {
            const res = mockResponse();
            client.query.mockImplementation(({ query }) => {
                if (query.includes('count(DISTINCT user_id)')) return Promise.resolve({ json: () => Promise.resolve({ data: [{ total_users: 10 }] }) });
                if (query.includes('count() as events_today')) return Promise.resolve({ json: () => Promise.resolve({ data: [{ events_today: 100 }] }) });
                if (query.includes('GROUP BY hour')) return Promise.resolve({ json: () => Promise.resolve({ data: [] }) });
                if (query.includes('avg(response_time_ms)')) return Promise.resolve({ json: () => Promise.resolve({ data: [{ avg_response_time: 50 }] }) });
                if (query.includes('error_rate')) return Promise.resolve({ json: () => Promise.resolve({ data: [{ error_rate: 5 }] }) });
                if (query.includes('avg(score)')) return Promise.resolve({ json: () => Promise.resolve({ data: [{ avg_assessment_score: 15 }] }) });
            });
            
            await getDashboardStats({}, res);

            expect(client.query).toHaveBeenCalledTimes(6);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.any(Object));
        });
    });
}); 