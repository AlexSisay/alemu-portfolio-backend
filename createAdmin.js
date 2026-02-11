require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  const username = 'alexsisay1'; // change as desired
  const password = 'admin123'; // change as desired

  const existing = await User.findOne({ username });
  if (existing) {
    console.log('Admin user already exists');
    process.exit();
  }

  const user = new User({ username, password });
  await user.save();
  console.log('Admin user created!');
  process.exit();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});