const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  body:     { type: String, required: true },
  imageUrl: { type: String, default: '', trim: true },
  author:   { type: String, default: 'Anonymous' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Like' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
