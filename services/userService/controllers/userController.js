const db = require('../db');

const getProfile = async (req, res) => {
  try {
    const user = await db.query('SELECT id, email, first_name, last_name, phone_number, cultural_background, language_preference, country_code, timezone, last_active, account_status, privacy_settings, emergency_contacts FROM users WHERE id = $1', [req.user.id]);

    if (user.rows.length === 0) {
      return res.status(404).send('User not found');
    }

    res.json(user.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

const updateProfile = async (req, res) => {
  const { first_name, last_name, phone_number, cultural_background, language_preference, country_code, timezone, privacy_settings } = req.body;
  const userId = req.user.id;

  const fields = [];
  const values = [];
  let paramCount = 1;

  if (first_name) {
    fields.push(`first_name = $${paramCount++}`);
    values.push(first_name);
  }
  if (last_name) {
    fields.push(`last_name = $${paramCount++}`);
    values.push(last_name);
  }
  if (phone_number) {
    fields.push(`phone_number = $${paramCount++}`);
    values.push(phone_number);
  }
  if (cultural_background) {
    fields.push(`cultural_background = $${paramCount++}`);
    values.push(cultural_background);
  }
  if (language_preference) {
    fields.push(`language_preference = $${paramCount++}`);
    values.push(language_preference);
  }
  if (country_code) {
    fields.push(`country_code = $${paramCount++}`);
    values.push(country_code);
  }
  if (timezone) {
    fields.push(`timezone = $${paramCount++}`);
    values.push(timezone);
  }
  if (privacy_settings) {
    fields.push(`privacy_settings = $${paramCount++}`);
    values.push(privacy_settings);
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  fields.push(`updated_at = NOW()`);

  const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  values.push(userId);

  try {
    const updatedUser = await db.query(query, values);
    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

const deleteAccount = async (req, res) => {
  const userId = req.user.id;

  try {
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
    res.status(200).json({ message: 'User account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Server error deleting account' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  deleteAccount,
};
