const bcrypt = require('bcrypt');
const User   = require('../models/User');
const Post   = require('../models/postModel');
const Comment = require('../models/commentModel');
const Like    = require('../models/likeModel');
const jwt    = require('jsonwebtoken');
const Notification = require('../models/notificationModel');
const { notifyAdminAboutSignup } = require('../utils/notifications');
require('dotenv').config();

async function removeUserContent(userId) {
  const posts = await Post.find({ authorId: userId }, '_id');
  const postIds = posts.map((post) => post._id);

  const userComments = await Comment.find({ userId }, '_id post');
  const userCommentIds = userComments.map((comment) => comment._id);
  const commentedPostIds = [...new Set(userComments.map((comment) => comment.post?.toString()).filter(Boolean))];

  const userLikes = await Like.find({ userId }, '_id post');
  const userLikeIds = userLikes.map((like) => like._id);
  const likedPostIds = [...new Set(userLikes.map((like) => like.post?.toString()).filter(Boolean))];

  if (userCommentIds.length) {
    await Post.updateMany(
      { _id: { $in: commentedPostIds } },
      { $pull: { comments: { $in: userCommentIds } } }
    );
    await Comment.deleteMany({ _id: { $in: userCommentIds } });
  }

  if (userLikeIds.length) {
    await Post.updateMany(
      { _id: { $in: likedPostIds } },
      { $pull: { likes: { $in: userLikeIds } } }
    );
    await Like.deleteMany({ _id: { $in: userLikeIds } });
  }

  if (postIds.length) {
    await Comment.deleteMany({ post: { $in: postIds } });
    await Like.deleteMany({ post: { $in: postIds } });
    await Post.deleteMany({ _id: { $in: postIds } });
  }

  await Notification.deleteMany({
    $or: [
      { recipientId: userId },
      { actorId: userId },
    ],
  });
}

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    headline: user.headline || '',
    bio: user.bio || '',
    avatarUrl: user.avatarUrl || '',
  };
}

// Signup
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedRole = role === 'Author' ? 'Author' : 'Visitor';

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    if (process.env.ADMIN_EMAIL && normalizedEmail === process.env.ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'This email is reserved and cannot sign up publicly' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: normalizedEmail, password: hashedPassword, role: normalizedRole });
    await notifyAdminAboutSignup(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: serializeUser(user),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password, adminKey } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    if (process.env.ADMIN_EMAIL && normalizedEmail === process.env.ADMIN_EMAIL.toLowerCase()) {
      if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_LOGIN_KEY) {
        return res.status(500).json({ success: false, message: 'Admin login is not configured on the server' });
      }
      if (!adminKey) {
        return res.status(400).json({ success: false, message: 'Admin login key is required' });
      }
      if (password !== process.env.ADMIN_PASSWORD || adminKey !== process.env.ADMIN_LOGIN_KEY) {
        return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
      }

      const adminUser = {
        id: '000000000000000000000001',
        name: 'Admin',
        email: process.env.ADMIN_EMAIL,
        role: 'Admin',
        headline: 'System Administrator',
        bio: 'Controls the platform and moderation tools.',
        avatarUrl: '',
      };

      const token = jwt.sign(
        { email: adminUser.email, id: adminUser.id, role: adminUser.role, name: adminUser.name },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        success: true,
        message: 'Admin logged in successfully',
        token,
      user: adminUser,
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.role === 'Student') {
      user.role = 'Author';
      await user.save();
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { email: user.email, id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    }).status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: serializeUser(user),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    if (req.user.role === 'Admin' && req.user.id === '000000000000000000000001') {
      return res.json({
        success: true,
        user: {
          id: req.user.id,
          name: req.user.name || 'Admin',
          email: req.user.email,
          role: 'Admin',
          headline: 'System Administrator',
          bio: 'Controls the platform and moderation tools.',
          avatarUrl: '',
        },
      });
    }

    const user = await User.findById(req.user.id, '-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.role === 'Student') {
      user.role = 'Author';
      await user.save();
    }

    return res.json({ success: true, user: serializeUser(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to load profile' });
  }
};

exports.updateCurrentUser = async (req, res) => {
  try {
    if (req.user.role === 'Admin' && req.user.id === '000000000000000000000001') {
      return res.status(403).json({ success: false, message: 'Admin profile cannot be edited here' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { name, headline = '', bio = '', avatarUrl = '' } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    user.name = String(name).trim();
    user.headline = String(headline || '').trim();
    user.bio = String(bio || '').trim();
    user.avatarUrl = String(avatarUrl || '').trim();
    await user.save();

    await Post.updateMany(
      { authorId: user._id },
      { $set: { author: user.name } }
    );

    return res.json({ success: true, message: 'Profile updated', user: serializeUser(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// Get all users (Admin only) 
exports.getAllUsers = async (req, res) => {
  try {
    await User.updateMany({ role: 'Student' }, { $set: { role: 'Author' } });
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// Delete user (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }

    await removeUserContent(user._id);

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

exports.deleteOwnAccount = async (req, res) => {
  try {
    if (req.user.role === 'Admin') {
      return res.status(403).json({ success: false, message: 'Admin account cannot be deleted from the app' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await removeUserContent(user._id);
    await User.findByIdAndDelete(user._id);

    return res.json({ success: true, message: 'Your account has been deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to delete your account' });
  }
};
