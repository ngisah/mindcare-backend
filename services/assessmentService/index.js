require('dotenv').config({ path: '../../.env' });
const express = require('express');
const assessmentRoutes = require('./routes/assessments');

const app = express();
const port = process.env.ASSESSMENT_SERVICE_PORT || 3000;

app.use(express.json());
app.use('/', assessmentRoutes);

// Only listen if the file is run directly
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Assessment service listening at http://localhost:${port}`);
    });
}

module.exports = app;
