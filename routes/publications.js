const express = require('express');
const Publication = require('../models/Publication');
const auth = require('../middleware/auth');
const router = express.Router();

// Helper to format publication for client
const formatPublication = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    id: obj._id,
    highlights: obj.highlights || []
  };
};

// Public: Get all publications (sorted by year desc, then by createdAt)
router.get('/', async (req, res) => {
  try {
    const pubs = await Publication.find().sort({ year: -1, createdAt: -1 }).lean();
    res.json(pubs.map((p) => ({ ...p, id: p._id })));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch publications' });
  }
});

// Admin: Create publication
router.post('/', auth, async (req, res) => {
  try {
    const pub = new Publication(req.body);
    await pub.save();
    res.status(201).json(formatPublication(pub));
  } catch (err) {
    res.status(400).json({ message: err.message || 'Invalid publication data' });
  }
});

// Admin: Update publication
router.put('/:id', auth, async (req, res) => {
  try {
    const pub = await Publication.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pub) return res.status(404).json({ message: 'Publication not found' });
    res.json(formatPublication(pub));
  } catch (err) {
    res.status(400).json({ message: err.message || 'Update failed' });
  }
});

// Admin: Delete publication
router.delete('/:id', auth, async (req, res) => {
  try {
    const pub = await Publication.findByIdAndDelete(req.params.id);
    if (!pub) return res.status(404).json({ message: 'Publication not found' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

module.exports = router;
