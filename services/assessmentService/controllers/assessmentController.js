const db = require('../db');

const getAssessmentTemplates = async (req, res) => {
  try {
    const templates = await db.query('SELECT * FROM assessment_templates ORDER BY name ASC');
    res.json(templates.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

const getAssessmentTemplateById = async (req, res) => {
  const { id } = req.params;

  try {
    const template = await db.query('SELECT * FROM assessment_templates WHERE id = $1', [id]);

    if (template.rows.length === 0) {
      return res.status(404).send('Assessment template not found');
    }

    res.json(template.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

const submitAssessmentResponses = async (req, res) => {
  const { user_id, template_id, responses, scores, interpretation, cultural_context } = req.body;

  try {
    const newResponse = await db.query(
      'INSERT INTO assessment_responses (user_id, template_id, responses, scores, interpretation, cultural_context) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user_id, template_id, responses, scores, interpretation, cultural_context]
    );

    res.status(201).json(newResponse.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

const getAssessmentResponsesById = async (req, res) => {
  const { id } = req.params;

  try {
    const responses = await db.query('SELECT * FROM assessment_responses WHERE id = $1', [id]);

    if (responses.rows.length === 0) {
      return res.status(404).send('Assessment responses not found');
    }

    res.json(responses.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

const getAssessmentProgress = async (req, res) => {
  const { user_id } = req.query;

  try {
    const progress = await db.query('SELECT * FROM assessment_responses WHERE user_id = $1 ORDER BY completed_at DESC', [user_id]);
    res.json(progress.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

const getAssessmentRecommendations = async (req, res) => {
  // This is a placeholder. In a real application, this would involve
  // analyzing the user's assessment history and providing recommendations.
  res.json({ recommendations: [] });
};

module.exports = {
  getAssessmentTemplates,
  getAssessmentTemplateById,
  submitAssessmentResponses,
  getAssessmentResponsesById,
  getAssessmentProgress,
  getAssessmentRecommendations,
};
