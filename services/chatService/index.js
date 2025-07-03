require('dotenv').config({ path: '../../.env' });
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const conversationRoutes = require('./routes/conversations');
const redis = require('redis');


const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.CHAT_SERVICE_PORT || 3000;

app.use(express.json());
app.use('/conversations', conversationRoutes);


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

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
    socket.on('join_conversation', ({ conversationId }) => {
        socket.join(conversationId);
        console.log(`User joined conversation: ${conversationId}`);
    });
    socket.on('send_message', ({ conversationId, content, type }) => {
        const messageData = { conversationId, content, type, timestamp: new Date() };
        io.to(conversationId).emit('message_received', messageData);
        console.log(`Message sent to conversation ${conversationId}: ${content}`);
    });
});


if (require.main === module) {
    server.listen(port, () => {
        console.log(`Chat service listening at http://localhost:${port}`);
    });
}

module.exports = { app, server, io, redisClient };