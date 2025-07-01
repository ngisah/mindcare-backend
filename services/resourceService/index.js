
const express = require('express');
const app = express();
const resourceRoutes = require('./routes/resources');

app.use(express.json());
app.use('/api/resources', resourceRoutes);

const PORT = process.env.RESOURCE_SERVICE_PORT || 3004;
app.listen(PORT, () => {
    console.log(`Resource Service running on port ${PORT}`);
});
