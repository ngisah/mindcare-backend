require('dotenv').config({ path: '../../.env' });
const express = require('express');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const port = process.env.ANALYTICS_SERVICE_PORT || 3000;

app.use(express.json());
app.use('/', analyticsRoutes);

let server;
if (require.main === module) {
    server = app.listen(port, () => {
        console.log(`Analytics service listening at http://localhost:${port}`);
    });
} else {
    server = app.listen(0);
}

module.exports = { app, server };
