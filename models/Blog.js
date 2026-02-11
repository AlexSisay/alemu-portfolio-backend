const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  excerpt: { type: String, default: '' },
  content: { type: String, required: true },
  author: { type: String, default: 'Alemu Sisay Nigru' },
  tags: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Blog', blogSchema); 