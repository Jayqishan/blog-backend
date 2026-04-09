const Post = require('../models/postModel');
const Comment = require('../models/commentModel');
const { notifyPostOwner } = require('../utils/notifications');

exports.createComment = async (req, res) => {
  try {
    const { post, body } = req.body;
    if (!post || !body) {
      return res.status(400).json({ success: false, message: 'post and body are required' });
    }

    const existingPost = await Post.findById(post);
    if (!existingPost) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = new Comment({
      post,
      userId: req.user.id,
      user: req.user.name,
      body,
    });
    const savedComment = await comment.save();

    await notifyPostOwner({
      post: existingPost,
      actor: req.user,
      type: 'comment',
      message: `${req.user.name} commented on your post "${existingPost.title}".`,
    });

    const updatedPost = await Post.findByIdAndUpdate(
      post,
      { $push: { comments: savedComment._id } },
      { new: true }
    )
      .populate('comments')
      .exec();

    res.json({ success: true, post: updatedPost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error creating comment' });
  }
};
