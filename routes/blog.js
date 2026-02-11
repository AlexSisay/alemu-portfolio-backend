const express = require('express');
const Blog = require('../models/Blog');
const auth = require('../middleware/auth');
const router = express.Router();

// Helper to format blog for client (add id, date, readTime)
const formatBlog = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  const content = obj.content || '';
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  return {
    ...obj,
    id: obj._id,
    date: obj.createdAt,
    readTime,
    tags: obj.tags || []
  };
};

// Public: Get all blogs
router.get('/', async (req, res) => {
  const blogs = await Blog.find().sort({ createdAt: -1 });
  res.json(blogs.map(formatBlog));
});

// Public: Get single blog by ID
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Post not found' });
    res.json(formatBlog(blog));
  } catch (err) {
    res.status(404).json({ message: 'Post not found' });
  }
});

// Admin: Create blog
router.post('/', auth, async (req, res) => {
  const blog = new Blog(req.body);
  await blog.save();
  res.status(201).json(formatBlog(blog));
});

// Admin: Update blog
router.put('/:id', auth, async (req, res) => {
  const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!blog) return res.status(404).json({ message: 'Post not found' });
  res.json(formatBlog(blog));
});

// Admin: Delete blog
router.delete('/:id', auth, async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

module.exports = router; 