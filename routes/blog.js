const express = require('express');
const router  = express.Router();

const { createComment }                         = require('../controllers/commentController');
const { createPost, getAllPosts, getPostById, getMyPosts, editPost, deletePost } = require('../controllers/postController');
const { likePost, unlikePost }                  = require('../controllers/likeController');
const { getNotifications, markAllNotificationsRead, sharePost } = require('../controllers/notificationController');
const { uploadImage }                           = require('../controllers/uploadController');
const { generateAiContent }                     = require('../controllers/aiController');
const { auth }                                  = require('../middleware/auth');
const upload = require('../middleware/upload');

// Posts
router.get('/posts',              getAllPosts);
router.get('/posts/mine',         auth, getMyPosts);
router.get('/posts/:id',          getPostById);
router.post('/posts/create',      auth, createPost);
router.put('/posts/:id',          auth, editPost);
router.delete('/posts/:id',       auth, deletePost);
router.post('/uploads/image',     auth, upload.single('image'), uploadImage);

// AI
router.post('/ai/generate',       generateAiContent);

// Comments
router.post('/comments/create',   auth, createComment);

// Likes
router.post('/likes/like',        auth, likePost);
router.post('/likes/unlike',      auth, unlikePost);
router.post('/shares/create',     auth, sharePost);

// Notifications
router.get('/notifications',      auth, getNotifications);
router.patch('/notifications/read-all', auth, markAllNotificationsRead);

module.exports = router;
