const db = require('../db');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  const { email, password, first_name, last_name } = req.body;

  try {
    const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });
    const newUser = await db.query(
      'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, hashedPassword, first_name, last_name]
    );

    // Create a corresponding user profile
    await db.query('INSERT INTO user_profiles (user_id) VALUES ($1)', [
      newUser.rows[0].id,
    ]);

    const accessToken = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
    });


    res.status(201).json({ accessToken, refreshToken });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      return res.status(400).send('Invalid credentials');
    }

    const validPassword = await argon2.verify(user.rows[0].password_hash, password);

    if (!validPassword) {
      return res.status(400).send('Invalid credentials');
    }

    const accessToken = jwt.sign({ id: user.rows[0].id }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign({ id: user.rows[0].id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
    });

    res.json({ accessToken, refreshToken });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

const refresh = (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }

        const accessToken = jwt.sign({ id: user.id }, process.env.JWT_ACCESS_SECRET, {
            expiresIn: '15m',
        });

        res.json({ accessToken });
    });
};


module.exports = {
  register,
  login,
  refresh,
};
