const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(503).json({ message: 'Server misconfigured: JWT_SECRET not set' });
    }
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: 'Database not connected. In MongoDB Atlas: Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0). Then wait 1–2 min and retry.'
      });
    }
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

module.exports = router; 