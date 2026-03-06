const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  ip: { type: String, default: '' },
  country: { type: String, default: 'Unknown' },
  countryCode: { type: String, default: '' },
  path: { type: String, default: '/' },
  userAgent: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Visit', visitSchema);
