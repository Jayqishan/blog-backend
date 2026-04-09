const Post = require('../models/postModel');
const Like = require('../models/likeModel');
const { notifyPostOwner } = require('../utils/notifications');

exports.likePost = async (req, res) => {
  try {
    const { post } = req.body;
    if (!post) {
      return res.status(400).json({ success: false, message: 'post is required' });
    }

    const existingPost = await Post.findById(post);
    if (!existingPost) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const existing = await Like.findOne({ post, userId: req.user.id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already liked this post' });
    }

    const like = new Like({ post, userId: req.user.id, user: req.user.name });
    const savedLike = await like.save();

    await notifyPostOwner({
      post: existingPost,
      actor: req.user,
      type: 'like',
      message: `${req.user.name} liked your post "${existingPost.title}".`,
    });

    const updatedPost = await Post.findByIdAndUpdate(
      post,
      { $push: { likes: savedLike._id } },
      { new: true }
    ).populate('likes').exec();

    res.json({ success: true, post: updatedPost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error liking post' });
  }
};

exports.unlikePost = async (req, res) => {
  try {
    const { post } = req.body;
    if (!post) {
      return res.status(400).json({ success: false, message: 'post is required' });
    }

    const deletedLike = await Like.findOneAndDelete({ post, userId: req.user.id });
    if (!deletedLike) {
      return res.status(404).json({ success: false, message: 'Like not found' });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      post,
      { $pull: { likes: deletedLike._id } },
      { new: true }
    ).populate('likes').exec();

    res.json({ success: true, post: updatedPost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error unliking post' });
  }
};
