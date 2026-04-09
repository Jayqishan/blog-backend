const Notification = require('../models/notificationModel');

const ADMIN_NOTIFICATION_ID = '000000000000000000000001';

async function createNotification(payload) {
  if (!payload?.recipientId || !payload?.message || !payload?.type) return null;

  return Notification.create({
    recipientId: payload.recipientId,
    recipientRole: payload.recipientRole || '',
    actorId: payload.actorId || null,
    actorName: payload.actorName || '',
    actorRole: payload.actorRole || '',
    type: payload.type,
    postId: payload.postId || null,
    postTitle: payload.postTitle || '',
    message: payload.message,
    audience: payload.audience || 'user',
    adminSegment: payload.adminSegment || '',
  });
}

async function notifyPostOwner({ post, actor, type, message }) {
  if (!post?.authorId || !actor?.id) return null;
  if (String(post.authorId) === String(actor.id)) return null;

  return createNotification({
    recipientId: post.authorId,
    recipientRole: 'Author',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    type,
    postId: post._id,
    postTitle: post.title,
    message,
    audience: 'user',
  });
}

async function notifyAdminAboutSignup(user) {
  if (!user?._id || !user?.role) return null;

  const isAuthor = user.role === 'Author';
  return createNotification({
    recipientId: ADMIN_NOTIFICATION_ID,
    recipientRole: 'Admin',
    actorId: user._id,
    actorName: user.name,
    actorRole: user.role,
    type: isAuthor ? 'new_author' : 'new_visitor',
    message: `${user.name} joined as a ${isAuthor ? 'new author' : 'new visitor'}.`,
    audience: 'admin',
    adminSegment: isAuthor ? 'author' : 'visitor',
  });
}

module.exports = {
  ADMIN_NOTIFICATION_ID,
  createNotification,
  notifyPostOwner,
  notifyAdminAboutSignup,
};
