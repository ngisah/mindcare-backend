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
  const { user_id, template_id, responses, cultural_context } = req.body;

  try {
    // 1. Fetch the assessment template
    const templateResult = await db.query('SELECT * FROM assessment_templates WHERE id = $1', [template_id]);
    if (templateResult.rows.length === 0) {
      return res.status(404).send('Assessment template not found');
    }
    const template = templateResult.rows[0];
    const { scoring_rules, interpretation_guidelines } = template;

    // 2. Calculate the score based on the rules
    let totalScore = 0;
    if (scoring_rules.type === 'sum_of_scores' || scoring_rules.type === 'sum_of_scores_with_reverse') {
      scoring_rules.questions.forEach(questionId => {
        let score = responses[questionId] || 0;
        if (scoring_rules.type === 'sum_of_scores_with_reverse' && scoring_rules.reverse_scored_questions.includes(questionId)) {
          // The values from the request are numbers, but the reverse_logic map has string keys
          score = scoring_rules.reverse_logic[score.toString()];
        }
        totalScore += score;
      });
    }
    const scores = { total_score: totalScore };

    // 3. Determine the interpretation
    let interpretationText = 'No interpretation available.';
    let interpretationLevel = 'N/A';
    if (interpretation_guidelines && interpretation_guidelines.score_ranges) {
      for (const range of interpretation_guidelines.score_ranges) {
        if (totalScore >= range.min && totalScore <= range.max) {
          interpretationText = range.interpretation;
          interpretationLevel = range.level;
          break;
        }
      }
    }

    // Handle special rules (e.g., for PHQ-9 self-harm question)
    let specialNotices = [];
    if (interpretation_guidelines && interpretation_guidelines.special_rules) {
        interpretation_guidelines.special_rules.forEach(rule => {
            const responseValue = responses[rule.question_id];
            if (responseValue !== undefined) {
                const condition = rule.condition;
                let conditionMet = false;
                if (condition.operator === '>' && responseValue > condition.value) {
                    conditionMet = true;
                }
                // Add more operators as needed (e.g., '<', '===')
                
                if (conditionMet) {
                    specialNotices.push(rule.interpretation);
                }
            }
        });
    }
    
    const interpretation = {
        level: interpretationLevel,
        text: interpretationText,
        special_notices: specialNotices
    };

    // 4. Save the new assessment response
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
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).send('user_id is required');
  }

  try {
    // 1. Get the latest assessment for the user
    const latestAssessment = await db.query(
      'SELECT * FROM assessment_responses WHERE user_id = $1 ORDER BY completed_at DESC LIMIT 1',
      [user_id]
    );

    if (latestAssessment.rows.length === 0) {
      return res.status(404).json({ recommendations: [], message: 'No assessments found for this user.' });
    }

    const { scores } = latestAssessment.rows[0];
    const totalScore = scores.total_score || 0; // Assuming scores is a JSONB with a total_score field

    // 2. Provide recommendations based on the score
    let recommendations = [];
    if (totalScore > 15) {
      recommendations.push({
        type: 'professional_help',
        message: 'Your assessment score is high. We recommend seeking professional help. You can find a list of local therapists in our resource center.',
      });
    } else {
      recommendations.push({
        type: 'self_help',
        message: 'Your assessment score is in a manageable range. We recommend exploring our self-help resources for continued well-being.',
      });
    }

    res.json({ recommendations });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

module.exports = {
  getAssessmentTemplates,
  getAssessmentTemplateById,
  submitAssessmentResponses,
  getAssessmentResponsesById,
  getAssessmentProgress,
  getAssessmentRecommendations,
};
