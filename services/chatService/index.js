require('dotenv').config({ path: '../../.env' });
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = 3002;
const redis = require('redis');

const conversationRoutes = require('./routes/conversations');

app.use(express.json());

// Redis Client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('connect', () => console.log('Redis Client Connected'));
redisClient.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
  await redisClient.connect();
})();

// Make redisClient available to routes/controllers
app.set('redisClient', redisClient);

app.get('/', (req, res) => {
  res.send('Chat Service is running!');
});

app.use('/conversations', conversationRoutes);

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('join_conversation', ({ conversationId }) => {
    socket.join(conversationId);
    console.log(`User joined conversation: ${conversationId}`);
  });

  socket.on('send_message', ({ conversationId, content, type }) => {
    // In a real application, this would save the message to the database
    // and then emit to other clients in the conversation.
    const messageData = { conversationId, content, type, timestamp: new Date() };
    io.to(conversationId).emit('message_received', messageData);
    console.log(`Message sent to conversation ${conversationId}: ${content}`);
  });

  socket.on('ai_typing', ({ conversationId, isTyping }) => {
    io.to(conversationId).emit('ai_typing', { conversationId, isTyping });
  });

  socket.on('crisis_alert', (alertData) => {
    // This would typically trigger a notification to crisis counselors or relevant parties
    console.log('Crisis alert received:', alertData);
    // Example: io.emit('admin_crisis_alert', alertData);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(port, () => {
  console.log(`Chat Service listening at http://localhost:${port}`);
});