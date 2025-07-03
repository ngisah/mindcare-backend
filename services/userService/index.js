require('dotenv').config({ path: '../../.env' });
const express = require('express');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();
const port = process.env.USER_SERVICE_PORT || 3000;

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

let server;
// Only listen if the file is run directly
if (require.main === module) {
    server = app.listen(port, () => {
        console.log(`User service listening at http://localhost:${port}`);
    });
} else {
    // For testing
    server = app.listen(0);
}

module.exports = { app, server };
