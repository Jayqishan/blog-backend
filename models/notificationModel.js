const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  recipientRole: {
    type: String,
    default: '',
  },
  actorId: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  actorName: {
    type: String,
    default: '',
    trim: true,
  },
  actorRole: {
    type: String,
    default: '',
    trim: true,
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'share', 'admin_post_updated', 'admin_post_deleted', 'new_author', 'new_visitor'],
    required: true,
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null,
  },
  postTitle: {
    type: String,
    default: '',
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  audience: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  adminSegment: {
    type: String,
    enum: ['', 'author', 'visitor', 'platform'],
    default: '',
  },
  read: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

notificationSchema.index({ recipientId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
