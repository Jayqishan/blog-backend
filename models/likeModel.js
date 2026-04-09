const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user: { type: String, required: true },
}, { timestamps: true });

likeSchema.index({ post: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);
