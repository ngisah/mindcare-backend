const pool = require('../models/resource');
const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({ node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200' });

exports.getAllResources = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM resources');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getResourceById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM resources WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Resource not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createResource = async (req, res) => {
    try {
        const { title, content, language, cultural_tags, mental_health_topics, difficulty_level } = req.body;
        const result = await pool.query(
            'INSERT INTO resources (title, content, language, cultural_tags, mental_health_topics, difficulty_level) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title, content, language, cultural_tags, mental_health_topics, difficulty_level]
        );
        const newResource = result.rows[0];
        // Index the new resource in Elasticsearch
        await esClient.index({
            index: 'resources',
            id: newResource.id,
            document: newResource
        });
        res.status(201).json(newResource);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateResource = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, language, cultural_tags, mental_health_topics, difficulty_level } = req.body;
        const result = await pool.query(
            'UPDATE resources SET title = $1, content = $2, language = $3, cultural_tags = $4, mental_health_topics = $5, difficulty_level = $6 WHERE id = $7 RETURNING *',
            [title, content, language, cultural_tags, mental_health_topics, difficulty_level, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Resource not found' });
        }
        const updatedResource = result.rows[0];
        // Update the resource in Elasticsearch
        await esClient.update({
            index: 'resources',
            id: updatedResource.id,
            doc: updatedResource
        });
        res.json(updatedResource);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteResource = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM resources WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Resource not found' });
        }
        // Delete the resource from Elasticsearch
        await esClient.delete({
            index: 'resources',
            id: id
        });
        res.json({ message: 'Resource deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.searchResources = async (req, res) => {
    try {
        const { q, language, cultural_tags, mental_health_topics, difficulty_level } = req.query;
        const body = {
            query: {
                bool: {
                    must: [],
                    filter: []
                }
            }
        };

        if (q) {
            body.query.bool.must.push({
                multi_match: {
                    query: q,
                    fields: ['title^', 'content']
                }
            });
        }
        if (language) {
            body.query.bool.filter.push({ term: { language: language } });
        }
        if (cultural_tags) {
            body.query.bool.filter.push({ terms: { cultural_tags: cultural_tags.split(',') } });
        }
        if (mental_health_topics) {
            body.query.bool.filter.push({ terms: { mental_health_topics: mental_health_topics.split(',') } });
        }
        if (difficulty_level) {
            body.query.bool.filter.push({ term: { difficulty_level: parseInt(difficulty_level) } });
        }

        const { hits } = await esClient.search({
            index: 'resources',
            body: body
        });

        res.json(hits.hits.map(hit => hit._source));
    } catch (err) {
        console.error('Elasticsearch search error:', err);
        res.status(500).json({ error: err.message });
    }
};