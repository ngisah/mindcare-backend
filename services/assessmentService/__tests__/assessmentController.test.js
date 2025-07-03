const request = require('supertest');
const express = require('express');
const assessmentController = require('../controllers/assessmentController');
const db = require('../db');
const assessmentRoutes = require('../routes/assessments');

// Mock the db module
jest.mock('../db', () => ({
  query: jest.fn(),
}));

const app = express();
app.use(express.json());
// Use the actual routes file
app.use('/', assessmentRoutes);

describe('Assessment Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /templates', () => {
    it('should return a list of assessment templates', async () => {
      const mockTemplates = [{ id: '1', name: 'PHQ-9' }, { id: '2', name: 'GAD-7' }];
      db.query.mockResolvedValue({ rows: mockTemplates });
      const response = await request(app).get('/templates');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTemplates);
      expect(db.query).toHaveBeenCalledWith('SELECT * FROM assessment_templates ORDER BY name ASC');
    });
  });

  describe('GET /templates/:id', () => {
    it('should return a single assessment template by id', async () => {
        const mockTemplate = { id: '1', name: 'PHQ-9', questions: [] };
        db.query.mockResolvedValue({ rows: [mockTemplate] });
        const response = await request(app).get('/templates/1');
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockTemplate);
        expect(db.query).toHaveBeenCalledWith('SELECT * FROM assessment_templates WHERE id = $1', ['1']);
    });

    it('should return 404 if template not found', async () => {
        db.query.mockResolvedValue({ rows: [] });
        const response = await request(app).get('/templates/999');
        expect(response.status).toBe(404);
        expect(response.text).toBe('Assessment template not found');
    });
  });

  describe('POST /responses', () => {
    it('should calculate score, interpretation and save a new response', async () => {
        const mockTemplate = {
            id: '1',
            name: 'PHQ-9',
            scoring_rules: { type: 'sum_of_scores', questions: ['q1', 'q2'] },
            interpretation_guidelines: {
                score_ranges: [{ min: 0, max: 4, level: 'Minimal', interpretation: 'OK' }]
            }
        };
        const mockResponse = { id: 'resp1', interpretation: {} };
        // Mock the two DB calls
        db.query
            .mockResolvedValueOnce({ rows: [mockTemplate] }) // First call for template
            .mockResolvedValueOnce({ rows: [mockResponse] });   // Second call for insert

        const newResponse = {
            user_id: 'user1',
            template_id: '1',
            responses: { q1: 1, q2: 2 },
            cultural_context: {}
        };

        const response = await request(app)
            .post('/responses')
            .send(newResponse);

        expect(response.status).toBe(201);
        expect(response.body).toEqual(mockResponse);
        expect(db.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('GET /responses/:id', () => {
    it('should return a single assessment response by id', async () => {
        const mockResponse = { id: '1', responses: {} };
        db.query.mockResolvedValue({ rows: [mockResponse] });
        const response = await request(app).get('/responses/1');
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockResponse);
        expect(db.query).toHaveBeenCalledWith('SELECT * FROM assessment_responses WHERE id = $1', ['1']);
    });
  });

  describe('GET /progress', () => {
    it('should return assessment progress for a user', async () => {
        const mockProgress = [{ id: '1', completed_at: new Date().toISOString() }];
        db.query.mockResolvedValue({ rows: mockProgress });
        const response = await request(app).get('/progress?user_id=user1');
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockProgress);
        expect(db.query).toHaveBeenCalledWith('SELECT * FROM assessment_responses WHERE user_id = $1 ORDER BY completed_at DESC', ['user1']);
    });
  });

  describe('GET /recommendations', () => {
    it('should return a 400 error if user_id is not provided', async () => {
      const response = await request(app).get('/recommendations');
      expect(response.status).toBe(400);
      expect(response.text).toBe('user_id is required');
    });

    it('should return a 404 error if no assessments are found for the user', async () => {
      db.query.mockResolvedValue({ rows: [] });
      const response = await request(app).get('/recommendations?user_id=some-user-id');
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('No assessments found for this user.');
    });

    it('should return crisis support recommendations for special notices', async () => {
        const mockAssessment = {
          interpretation: {
            level: 'Moderate',
            special_notices: ['Risk of self-harm detected.'],
          },
          template_name: 'PHQ-9',
          cultural_context: {},
        };
        db.query.mockResolvedValue({ rows: [mockAssessment] });
  
        const response = await request(app).get('/recommendations?user_id=test-user');
  
        expect(response.status).toBe(200);
        expect(response.body.recommendations[0].type).toBe('crisis_support');
        expect(response.body.recommendations[0].title).toBe('Immediate Support Recommended');
      });
  
      it('should return professional help recommendations for severe levels', async () => {
        const mockAssessment = {
          interpretation: { level: 'Severe', special_notices: [] },
          template_name: 'GAD-7',
          cultural_context: {},
        };
        db.query.mockResolvedValue({ rows: [mockAssessment] });
  
        const response = await request(app).get('/recommendations?user_id=test-user');
  
        expect(response.status).toBe(200);
        expect(response.body.recommendations[0].type).toBe('professional_help');
        expect(response.body.recommendations[0].title).toBe('Professional Support Recommended');
      });

      it('should return self-help recommendations for mild levels', async () => {
        const mockAssessment = {
          interpretation: { level: 'Mild', special_notices: [] },
          template_name: 'PSS-10',
          cultural_context: {},
        };
        db.query.mockResolvedValue({ rows: [mockAssessment] });
  
        const response = await request(app).get('/recommendations?user_id=test-user');
  
        expect(response.status).toBe(200);
        expect(response.body.recommendations[0].type).toBe('self_help');
        expect(response.body.recommendations[0].title).toBe('Self-Help Resources');
      });

      it('should return well-being recommendations for minimal levels', async () => {
        const mockAssessment = {
          interpretation: { level: 'Minimal', special_notices: [] },
          template_name: 'GAD-7',
          cultural_context: {},
        };
        db.query.mockResolvedValue({ rows: [mockAssessment] });
  
        const response = await request(app).get('/recommendations?user_id=test-user');
  
        expect(response.status).toBe(200);
        expect(response.body.recommendations[0].type).toBe('well_being');
        expect(response.body.recommendations[0].title).toBe('Maintain Your Well-being');
      });

      it('should return culturally-specific recommendations when context is available', async () => {
        const mockAssessment = {
          interpretation: { level: 'Low Stress', special_notices: [] },
          template_name: 'PSS-10',
          cultural_context: { region: 'East Africa' },
        };
        db.query.mockResolvedValue({ rows: [mockAssessment] });
  
        const response = await request(app).get('/recommendations?user_id=test-user');
  
        expect(response.status).toBe(200);
        const culturalRec = response.body.recommendations.find(r => r.type === 'cultural_resource');
        expect(culturalRec).toBeDefined();
        expect(culturalRec.title).toBe('Culturally-Specific Resource');
      });
  });
}); 