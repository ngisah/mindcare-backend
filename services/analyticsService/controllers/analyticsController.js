const client = require('../config/db');

const trackEvent = async (req, res) => {
    const { event_name, user_id, properties } = req.body;

    if (!event_name || !user_id) {
        return res.status(400).json({ error: 'event_name and user_id are required' });
    }

    try {
        await client.insert({
            table: 'events',
            values: [{ event_name, user_id, properties: JSON.stringify(properties || {}) }],
            format: 'JSONEachRow',
        });
        res.status(200).json({ message: 'Event tracked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to track event' });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        // User Engagement
        const totalUsersResult = await client.query({
            query: 'SELECT count(DISTINCT user_id) as total_users FROM default.events',
            format: 'JSON',
        });
        const totalUsersData = await totalUsersResult.json();

        const eventsTodayResult = await client.query({
            query: 'SELECT count() as events_today FROM default.events WHERE toDate(timestamp) = today()',
            format: 'JSON',
        });
        const eventsTodayData = await eventsTodayResult.json();

        const eventsOverTimeResult = await client.query({
            query: `
                SELECT toStartOfHour(timestamp) as hour, count() as count
                FROM default.events
                WHERE timestamp >= now() - INTERVAL 24 HOUR
                GROUP BY hour
                ORDER BY hour
            `,
            format: 'JSON',
        });
        const eventsOverTimeData = await eventsOverTimeResult.json();

        // Performance Monitoring
        const avgResponseTimeResult = await client.query({
            query: 'SELECT avg(response_time_ms) as avg_response_time FROM default.performance_metrics',
            format: 'JSON',
        });
        const avgResponseTimeData = await avgResponseTimeResult.json();
        
        const errorRateResult = await client.query({
            query: 'SELECT (sum(if(status_code >= 400, 1, 0)) / count()) * 100 as error_rate FROM default.performance_metrics',
            format: 'JSON',
        });
        const errorRateData = await errorRateResult.json();

        // Clinical Outcomes
        const avgAssessmentScoreResult = await client.query({
            query: 'SELECT avg(score) as avg_assessment_score FROM default.assessment_events',
            format: 'JSON',
        });
        const avgAssessmentScoreData = await avgAssessmentScoreResult.json();


        res.status(200).json({
            totalUsers: totalUsersData.data[0].total_users,
            eventsToday: eventsTodayData.data[0].events_today,
            eventsOverTime: eventsOverTimeData.data,
            avgResponseTime: avgResponseTimeData.data[0].avg_response_time,
            errorRate: errorRateData.data[0].error_rate,
            avgAssessmentScore: avgAssessmentScoreData.data[0].avg_assessment_score,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve dashboard stats' });
    }
};

const trackAssessmentEvent = async (req, res) => {
    const { user_id, template_id, score } = req.body;

    if (!user_id || !template_id || score === undefined) {
        return res.status(400).json({ error: 'user_id, template_id, and score are required' });
    }

    try {
        await client.insert({
            table: 'assessment_events',
            values: [{ user_id, template_id, score }],
            format: 'JSONEachRow',
        });
        res.status(200).json({ message: 'Assessment event tracked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to track assessment event' });
    }
};

const trackPerformanceMetric = async (req, res) => {
    const { service_name, endpoint, response_time_ms, status_code } = req.body;

    if (!service_name || !endpoint || !response_time_ms || !status_code) {
        return res.status(400).json({ error: 'service_name, endpoint, response_time_ms, and status_code are required' });
    }

    try {
        await client.insert({
            table: 'performance_metrics',
            values: [{ service_name, endpoint, response_time_ms, status_code }],
            format: 'JSONEachRow',
        });
        res.status(200).json({ message: 'Performance metric tracked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to track performance metric' });
    }
};

module.exports = {
    trackEvent,
    getDashboardStats,
    trackAssessmentEvent,
    trackPerformanceMetric,
}; 