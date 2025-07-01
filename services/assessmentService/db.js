const { Pool } = require('pg');

const pool = new Pool({
  user: 'ngisah',
  host: 'localhost',
  database: 'mindcare_db',
  password: '02796',
  port: 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
