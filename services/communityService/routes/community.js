
const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');

router.get('/posts', communityController.getAllPosts);
router.get('/posts/:id', communityController.getPostById);
router.post('/posts', communityController.createPost);
router.put('/posts/:id', communityController.updatePost);
router.delete('/posts/:id', communityController.deletePost);
router.post('/posts/:id/comments', communityController.addCommentToPost);

module.exports = router;
