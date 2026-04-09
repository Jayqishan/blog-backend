const Post = require('../models/postModel');
const Comment = require('../models/commentModel');
const Like = require('../models/likeModel');
const { createNotification } = require('../utils/notifications');

exports.createPost = async (req, res) => {
  try {
    const { title, body, imageUrl = '' } = req.body;
    const isAuthor = req.user?.role === 'Author';
    const isAdmin = req.user?.role === 'Admin';

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required' });
    }
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only authors can publish posts' });
    }

    const author = req.user ? req.user.name : 'Anonymous';
    const authorId = req.user ? req.user.id : null;

    const post = await Post.create({ title, body, imageUrl, author, authorId });
    return res.status(201).json({ success: true, post });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 24);
    const search = (req.query.search || '').trim();

    const filter = search ? {
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ],
    } : {};

    const totalPosts = await Post.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(totalPosts / limit), 1);
    const safePage = Math.min(page, totalPages);

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * limit)
      .limit(limit)
      .populate('comments')
      .populate('likes')
      .exec();

    return res.json({
      success: true,
      posts,
      pagination: {
        page: safePage,
        limit,
        totalPosts,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
      search,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('comments')
      .populate('likes')
      .exec();

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    return res.json({ success: true, post });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      $or: [
        { authorId: req.user.id },
        { author: req.user.name },
      ],
    })
      .sort({ createdAt: -1 })
      .populate('comments')
      .populate('likes')
      .exec();

    return res.json({ success: true, posts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to fetch your posts' });
  }
};

exports.editPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const isOwner = post.authorId && post.authorId.toString() === req.user.id;
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this post' });
    }

    const { title, body, imageUrl = '' } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required' });
    }

    post.title = title;
    post.body = body;
    post.imageUrl = imageUrl;
    await post.save();

    if (isAdmin && !isOwner && post.authorId) {
      await createNotification({
        recipientId: post.authorId,
        recipientRole: 'Author',
        actorId: req.user.id,
        actorName: req.user.name,
        actorRole: req.user.role,
        type: 'admin_post_updated',
        postId: post._id,
        postTitle: post.title,
        message: `Admin updated your post "${post.title}".`,
        audience: 'user',
      });
    }

    return res.json({ success: true, message: 'Post updated', post });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const isOwner = post.authorId && post.authorId.toString() === req.user.id;
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    if (isAdmin && !isOwner && post.authorId) {
      await createNotification({
        recipientId: post.authorId,
        recipientRole: 'Author',
        actorId: req.user.id,
        actorName: req.user.name,
        actorRole: req.user.role,
        type: 'admin_post_deleted',
        postId: post._id,
        postTitle: post.title,
        message: `Admin deleted your post "${post.title}".`,
        audience: 'user',
      });
    }

    await Comment.deleteMany({ post: post._id });
    await Like.deleteMany({ post: post._id });
    await Post.findByIdAndDelete(req.params.id);

    return res.json({ success: true, message: 'Post deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
