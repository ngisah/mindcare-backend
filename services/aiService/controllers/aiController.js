const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

const crisisDetection = {
  suicideKeywords: [
    'want to die', 'kill myself', 'end it all', 'suicide',
    'better off dead', 'can\'t go on', 'no way out'
  ],
};

const detectCrisisIndicators = (message) => {
  const lowerCaseMessage = message.toLowerCase();
  for (const keyword of crisisDetection.suicideKeywords) {
    if (lowerCaseMessage.includes(keyword)) {
      return 1; // Level 1 crisis detected
    }
  }
  return 0; // No crisis detected
};

const processAIRequest = async (req, res) => {
  const { userMessage, userContext } = req.body;

  try {
    // 1. Crisis detection
    const crisisLevel = detectCrisisIndicators(userMessage);

    // 2. Cultural context preparation
    const culturalContextPrompt = `
      You are a mental health support AI designed specifically for African users.
      Your responses should:

      1. Respect African cultural values including:
         - Ubuntu philosophy (interconnectedness)
         - Respect for elders and community wisdom
         - Spiritual and religious considerations
         - Extended family support systems

      2. Language considerations:
         - User's preferred language: ${userContext.userLanguage}
         - Cultural idioms and expressions
         - Appropriate formality levels
         - Local terminology for mental health concepts

      3. Cultural mental health approaches:
         - Integration with traditional healing practices
         - Community-based support systems
         - Religious and spiritual coping mechanisms
         - Cultural stigma awareness and sensitivity

      4. Crisis intervention culturally appropriate methods:
         - Family and community involvement protocols
         - Religious leader consultation when appropriate
         - Cultural emergency contacts and resources
         - Traditional calming and grounding techniques

      Current user context:
      - Cultural background: ${userContext.userCulture}
      - Language preference: ${userContext.userLanguage}
      - Location: ${userContext.userLocation}
      - Previous conversation context: ${userContext.conversationHistory}
    `;

    // 3. Gemini API call
    const result = await model.generateContent(culturalContextPrompt + userMessage);
    const response = await result.response;
    const text = response.text();

    // 4. Response validation and filtering (simplified)
    const validatedResponse = text; // Placeholder

    // 5. Cultural enhancement (simplified)
    const enhancedResponse = validatedResponse; // Placeholder

    // 6. Crisis escalation if needed
    if (crisisLevel > 0) {
      // In a real application, this would trigger a more robust crisis protocol,
      // such as notifying a human crisis counselor.
      console.log(`Crisis detected with level ${crisisLevel}. Escalating...`);
      // For now, we will just prepend a crisis warning to the response.
      const crisisResponse = "It sounds like you are going through a difficult time. Please know that there is help available. You can connect with people who can support you by calling or texting 988 anytime in the US and Canada. In the UK, you can call 111.";
      return res.json({ response: crisisResponse, crisisLevel });
    }

    res.json({ response: enhancedResponse, crisisLevel });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

module.exports = {
  processAIRequest,
};

