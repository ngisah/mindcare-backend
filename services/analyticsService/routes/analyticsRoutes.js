const express = require('express');
const router = express.Router();
const { trackEvent, getDashboardStats, trackAssessmentEvent, trackPerformanceMetric } = require('../controllers/analyticsController');

router.post('/track', trackEvent);
router.get('/dashboard', getDashboardStats);
router.post('/track-assessment', trackAssessmentEvent);
router.post('/track-performance', trackPerformanceMetric);

module.exports = router; 