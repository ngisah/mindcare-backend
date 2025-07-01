const db = require('../db');

const createConversation = async (req, res) => {
  const { user_id, title, cultural_context } = req.body;
  const redisClient = req.app.get('redisClient');

  try {
    const newConversation = await db.query(
      'INSERT INTO conversations (user_id, title, cultural_context) VALUES ($1, $2, $3) RETURNING *',
      [user_id, title, cultural_context]
    );
    const conversation = newConversation.rows[0];
    // Cache the new conversation in Redis
    await redisClient.set(`conversation:${conversation.id}`, JSON.stringify(conversation), { EX: 3600 }); // Cache for 1 hour
    res.status(201).json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

const getConversations = async (req, res) => {
  const { user_id } = req.query; // Assuming user_id is passed as a query parameter

  try {
    const conversations = await db.query('SELECT * FROM conversations WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);
    res.json(conversations.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

const getConversationById = async (req, res) => {
  const { id } = req.params;
  const redisClient = req.app.get('redisClient');

  try {
    // Try to get conversation from Redis cache first
    const cachedConversation = await redisClient.get(`conversation:${id}`);
    if (cachedConversation) {
      console.log('Serving conversation from Redis cache');
      return res.json(JSON.parse(cachedConversation));
    }

    const conversation = await db.query('SELECT * FROM conversations WHERE id = $1', [id]);

    if (conversation.rows.length === 0) {
      return res.status(404).send('Conversation not found');
    }

    const fetchedConversation = conversation.rows[0];
    // Cache the fetched conversation in Redis
    await redisClient.set(`conversation:${fetchedConversation.id}`, JSON.stringify(fetchedConversation), { EX: 3600 }); // Cache for 1 hour
    res.json(fetchedConversation);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

const deleteConversation = async (req, res) => {
  const { id } = req.params;
  const redisClient = req.app.get('redisClient');

  try {
    // First, delete all messages associated with the conversation
    await db.query('DELETE FROM messages WHERE conversation_id = $1', [id]);
    
    // Then, delete the conversation itself
    const result = await db.query('DELETE FROM conversations WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).send('Conversation not found');
    }

    // Invalidate cache after deletion
    await redisClient.del(`conversation:${id}`);

    res.status(204).send(); // No content
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

const getMessages = async (req, res) => {
  const { id } = req.params; // conversation_id

  try {
    const messages = await db.query('SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC', [id]);
    res.json(messages.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

const createMessage = async (req, res) => {
  const { id } = req.params;
  const { sender_type, encrypted_content, encryption_key_id, message_type, metadata, sentiment_score, crisis_indicators } = req.body;

  try {
    const newMessage = await db.query(
      'INSERT INTO messages (conversation_id, sender_type, encrypted_content, encryption_key_id, message_type, metadata, sentiment_score, crisis_indicators) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [id, sender_type, encrypted_content, encryption_key_id, message_type, metadata, sentiment_score, crisis_indicators]
    );
    res.status(201).json(newMessage.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

const updateMessage = async (req, res) => {
  const { id, messageId } = req.params; // id is conversation_id, messageId is message id
  const { encrypted_content, message_type, metadata, sentiment_score, crisis_indicators } = req.body;

  try {
    const updatedMessage = await db.query(
      'UPDATE messages SET encrypted_content = $1, message_type = $2, metadata = $3, sentiment_score = $4, crisis_indicators = $5 WHERE id = $6 AND conversation_id = $7 RETURNING *',
      [encrypted_content, message_type, metadata, sentiment_score, crisis_indicators, messageId, id]
    );

    if (updatedMessage.rows.length === 0) {
      return res.status(404).send('Message not found or does not belong to this conversation');
    }

    res.json(updatedMessage.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

module.exports = {
  createConversation,
  getConversations,
  getConversationById,
  deleteConversation,
  getMessages,
  createMessage,
  updateMessage,
};