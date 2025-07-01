
const pool = require('../models/community'); // Assuming community.js will be created for connection

exports.getAllPosts = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM community_posts');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM community_posts WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createPost = async (req, res) => {
    try {
        const { user_id, title, content } = req.body;
        const result = await pool.query(
            'INSERT INTO community_posts (user_id, title, content) VALUES ($1, $2, $3) RETURNING *',
            [user_id, title, content]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const result = await pool.query(
            'UPDATE community_posts SET title = $1, content = $2 WHERE id = $3 RETURNING *',
            [title, content, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM community_posts WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addCommentToPost = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const { user_id, content } = req.body;
        const result = await pool.query(
            'INSERT INTO community_comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
            [id, user_id, content]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
