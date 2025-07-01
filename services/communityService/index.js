
const express = require('express');
const app = express();
const communityRoutes = require('./routes/community');

app.use(express.json());
app.use('/api/community', communityRoutes);

const PORT = process.env.COMMUNITY_SERVICE_PORT || 3005;
app.listen(PORT, () => {
    console.log(`Community Service running on port ${PORT}`);
});
