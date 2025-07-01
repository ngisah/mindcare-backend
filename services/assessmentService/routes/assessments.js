const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');

// GET /assessments/templates
router.get('/templates', assessmentController.getAssessmentTemplates);

// GET /assessments/templates/:id
router.get('/templates/:id', assessmentController.getAssessmentTemplateById);

// POST /assessments/responses
router.post('/responses', assessmentController.submitAssessmentResponses);

// GET /assessments/responses/:id
router.get('/responses/:id', assessmentController.getAssessmentResponsesById);

// GET /assessments/progress
router.get('/progress', assessmentController.getAssessmentProgress);

// GET /assessments/recommendations
router.get('/recommendations', assessmentController.getAssessmentRecommendations);

module.exports = router;
