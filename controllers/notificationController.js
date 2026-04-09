const Notification = require('../models/notificationModel');
const Post = require('../models/postModel');
const { ADMIN_NOTIFICATION_ID, notifyPostOwner } = require('../utils/notifications');

function sortNewest(items) {
  return [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

exports.getNotifications = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin';
    const recipientId = isAdmin ? ADMIN_NOTIFICATION_ID : req.user.id;
    const audience = isAdmin ? 'admin' : 'user';

    const notifications = await Notification.find({ recipientId, audience })
      .sort({ createdAt: -1 })
      .limit(80)
      .lean();

    const unreadCount = notifications.filter((item) => !item.read).length;

    if (isAdmin) {
      const authors = notifications.filter((item) => item.adminSegment === 'author');
      const visitors = notifications.filter((item) => item.adminSegment === 'visitor');
      const platform = notifications.filter((item) => item.adminSegment === 'platform');

      return res.json({
        success: true,
        notifications,
        unreadCount,
        sections: {
          authors,
          visitors,
          platform,
        },
      });
    }

    const activity = notifications.filter((item) => ['like', 'comment', 'share'].includes(item.type));
    const admin = notifications.filter((item) => item.type === 'admin_post_updated' || item.type === 'admin_post_deleted');

    return res.json({
      success: true,
      notifications,
      unreadCount,
      sections: {
        activity: sortNewest(activity),
        admin: sortNewest(admin),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin';
    const recipientId = isAdmin ? ADMIN_NOTIFICATION_ID : req.user.id;
    const audience = isAdmin ? 'admin' : 'user';

    await Notification.updateMany({ recipientId, audience, read: false }, { $set: { read: true } });

    return res.json({ success: true, message: 'Notifications marked as read' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
};

exports.sharePost = async (req, res) => {
  try {
    const { post: postId } = req.body;
    if (!postId) {
      return res.status(400).json({ success: false, message: 'post is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    await notifyPostOwner({
      post,
      actor: req.user,
      type: 'share',
      message: `${req.user.name} shared your post "${post.title}".`,
    });

    return res.json({ success: true, message: 'Post shared successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to share post' });
  }
};
