#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const User = require('./models/User');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const username = (await ask('Username: ')).trim();
  if (!username) {
    console.error('Username required');
    process.exit(1);
  }
  const password = (await ask('Password: ')).trim();
  if (!password) {
    console.error('Password required');
    process.exit(1);
  }
  const existing = await User.findOne({ username });
  if (existing) {
    existing.password = password;
    await existing.save();
    console.log('Updated password for existing user:', username);
  } else {
    await User.create({ username, password });
    console.log('Admin user created:', username);
  }
  rl.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
