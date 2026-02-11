const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  section: { type: String, unique: true }, // e.g., 'home', 'about'
  data: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('Content', contentSchema); 