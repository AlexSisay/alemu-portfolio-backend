const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  authors: { type: String, default: '' },
  journal: { type: String, default: '' },
  year: { type: Number, required: true },
  status: { type: String, enum: ['Published', 'Under Review'], default: 'Published' },
  highlights: { type: [String], default: [] },
  abstract: { type: String, default: '' },
  link: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Publication', publicationSchema);
