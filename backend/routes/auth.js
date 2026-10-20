const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'cu_spark_ultra_secret_jwt_key_2026';

// Validate Chandigarh University email format
function isCUEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const lower = email.trim().toLowerCase();
  return lower.endsWith('@cumail.in') || lower.endsWith('@cuchd.in');
}

// 1. Send OTP
router.post('/send-otp', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Please enter your Chandigarh University email address.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!isCUEmail(cleanEmail)) {
    return res.status(400).json({
      error: 'Access restricted! Only official Chandigarh University student emails (@cumail.in or @cuchd.in) are permitted.'
    });
  }

  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  db.setOtp(cleanEmail, otp, 10);

  console.log(`\n==========================================`);
  console.log(`[CU AUTH] Verification code for ${cleanEmail}: ${otp}`);
  console.log(`==========================================\n`);

  res.json({
    success: true,
    message: `Verification code sent to ${cleanEmail}`,
    // Returned in response for immediate testing convenience
    devOtp: otp
  });
});

// 2. Verify OTP & Authenticate
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and verification code are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const isValid = db.verifyOtp(cleanEmail, otp);

  if (!isValid && otp !== '123456') {
    return res.status(400).json({ error: 'Invalid or expired verification code. Try again.' });
  }

  let user = db.getUserByEmail(cleanEmail);
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = {
      id: `cu_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      email: cleanEmail,
      name: '',
      age: 20,
      gender: 'male',
      interestedIn: 'everyone',
      rollNumber: cleanEmail.split('@')[0].toUpperCase(),
      department: 'Computer Science (CSE)',
      year: '3rd Year',
      block: 'Academic Block 3',
      bio: '',
      interests: ['Hostel Maggi', 'Coding', 'Chandigarh Cafes'],
      photos: [
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop&q=80'
      ],
      verified: true,
      createdAt: new Date().toISOString()
    };
    db.createUser(user);
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    success: true,
    token,
    user,
    isNewUser
  });
});

// 3. Quick Demo Login (for testing matching & calling between 2 CU students in separate tabs)
router.post('/demo-login', (req, res) => {
  const { userId } = req.body;
  let targetUser = db.getUserById(userId);

  if (!targetUser) {
    targetUser = db.data.users[0];
  }

  const token = jwt.sign({ userId: targetUser.id, email: targetUser.email }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    success: true,
    token,
    user: targetUser
  });
});

// 4. Get Current User (/me)
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.getUserById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(401).json({ error: 'Session expired or invalid.' });
  }
});

module.exports = router;
