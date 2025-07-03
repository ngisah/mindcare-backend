const express = require('express');
const notificationRoutes = require('./routes/notifications');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/', notificationRoutes);

const server = app.listen(port, () => {
    console.log(`Notification service listening at http://localhost:${port}`);
});

module.exports = { app, server };
