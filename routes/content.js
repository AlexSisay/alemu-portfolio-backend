const express = require('express');
const Content = require('../models/Content');
const auth = require('../middleware/auth');
const router = express.Router();

// Public: Get content by section
router.get('/:section', async (req, res) => {
  const content = await Content.findOne({ section: req.params.section });
  res.json(content);
});

// Admin: Update content
router.put('/:section', auth, async (req, res) => {
  const content = await Content.findOneAndUpdate(
    { section: req.params.section },
    { data: req.body.data },
    { upsert: true, new: true }
  );
  res.json(content);
});

module.exports = router; 