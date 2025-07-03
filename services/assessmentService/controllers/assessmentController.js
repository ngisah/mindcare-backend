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
    const latestAssessmentResult = await db.query(
      'SELECT r.*, t.name as template_name FROM assessment_responses r JOIN assessment_templates t ON r.template_id = t.id WHERE r.user_id = $1 ORDER BY r.completed_at DESC LIMIT 1',
      [user_id]
    );

    if (latestAssessmentResult.rows.length === 0) {
      return res.status(404).json({ recommendations: [], message: 'No assessments found for this user.' });
    }

    const latestAssessment = latestAssessmentResult.rows[0];
    const { interpretation, template_name, cultural_context } = latestAssessment;
    const { level, special_notices } = interpretation;

    // 2. Generate recommendations based on the interpretation level and assessment type
    let recommendations = [];

    // Prioritize crisis support based on special notices (e.g., self-harm question)
    if (special_notices && special_notices.length > 0) {
      recommendations.push({
        type: 'crisis_support',
        title: 'Immediate Support Recommended',
        message: `Your assessment raised some important concerns. ${special_notices.join(' ')} We strongly recommend contacting a crisis support line immediately.`,
        resource_link: '/resources/crisis-support' // Placeholder link
      });
    }

    // Generate recommendations based on severity level
    switch (level) {
      case 'Severe':
      case 'Moderately Severe':
        recommendations.push({
          type: 'professional_help',
          title: 'Professional Support Recommended',
          message: `Your results from the ${template_name} indicate a ${level.toLowerCase()} level of symptoms. Seeking support from a mental health professional is strongly advised.`,
          resource_link: '/resources/therapist-directory' // Placeholder link
        });
        break;
      case 'Moderate':
        recommendations.push({
          type: 'professional_help',
          title: 'Consider Professional Support',
          message: `Your results from the ${template_name} indicate a moderate level of symptoms. Speaking with a mental health professional could be very beneficial.`,
          resource_link: '/resources/therapist-directory' // Placeholder link
        });
        recommendations.push({
            type: 'self_help',
            title: 'Guided Self-Help Exercises',
            message: 'We also have guided exercises that may help you manage your symptoms. You can find them in our resource center.',
            resource_link: `/resources/exercises/${template_name.toLowerCase().split(' ')[0]}` // Placeholder
        });
        break;
      case 'Mild':
        recommendations.push({
          type: 'self_help',
          title: 'Self-Help Resources',
          message: `Your results from the ${template_name} suggest mild symptoms. Exploring self-help resources like guided meditations or educational articles can be a great next step.`,
          resource_link: `/resources/articles/${template_name.toLowerCase().split(' ')[0]}` // Placeholder
        });
        break;
      case 'None-minimal':
      case 'Minimal':
      case 'Low Stress':
        recommendations.push({
            type: 'well_being',
            title: 'Maintain Your Well-being',
            message: 'Your assessment results are in a healthy range. Continue to practice self-care and monitor your well-being. Check out our resources for maintaining mental fitness.',
            resource_link: '/resources/well-being' // Placeholder
        });
        break;
    }

    // Add culturally specific recommendations (placeholder)
    if (cultural_context && cultural_context.region === 'East Africa') {
        recommendations.push({
            type: 'cultural_resource',
            title: 'Culturally-Specific Resource',
            message: 'We have resources that are specifically tailored for East African cultural contexts. You may find them particularly helpful.',
            resource_link: '/resources/cultural/east-africa' // Placeholder
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
