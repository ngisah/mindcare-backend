const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../db'); // Assuming a db module exists

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

const handleChat = async (req, res) => {
    const { message, history, userId, culturalContext } = req.body;

    if (!message || !history) {
        return res.status(400).send({ error: 'Missing required fields: message, history' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

        // Add cultural context to the prompt
        const culturalPrompt = `You are a culturally sensitive AI assistant for MindCare Africa. The user's cultural context is: ${JSON.stringify(culturalContext)}. Please respond to the following message in a way that is empathetic, supportive, and respectful of their background.`;
        
        const fullHistory = [
            ...history,
            {
                role: "user",
                parts: [{ text: `${culturalPrompt}\n\nUser: ${message}` }],
            }
        ];

        const chat = model.startChat({
            history: fullHistory.slice(0, -1), // Pass all but the last message
        });
        
        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        // Optionally, save the interaction to the database
        // await db.query('INSERT INTO messages ...');

        res.status(200).send({ response: text });
    } catch (error) {
        console.error('Error handling chat:', error);
        res.status(500).send({ error: 'Failed to get response from AI' });
    }
};

module.exports = {
    handleChat
};

