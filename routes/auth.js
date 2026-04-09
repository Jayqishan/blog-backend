const express = require('express');
const router  = express.Router();
const { signup, login, getAllUsers, deleteUser, deleteOwnAccount, getCurrentUser, updateCurrentUser } = require('../controllers/auth');
const { auth, isAdmin } = require('../middleware/auth');

router.post('/signup',          signup);
router.post('/login',           login);
router.get('/me',               auth, getCurrentUser);
router.put('/me',               auth, updateCurrentUser);
router.delete('/me',            auth, deleteOwnAccount);
router.get('/users',            auth, isAdmin, getAllUsers);
router.delete('/users/:id',     auth, isAdmin, deleteUser);

module.exports = router;
