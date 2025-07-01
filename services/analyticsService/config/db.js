const { createClient } = require('@clickhouse/client');
require('dotenv').config();

const client = createClient({
    host: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USER || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || '',
    database: process.env.CLICKHOUSE_DATABASE || 'default',
});

module.exports = client; 