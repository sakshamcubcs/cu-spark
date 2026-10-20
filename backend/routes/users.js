const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

// Multer storage for student profile photos
const uploadDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '../uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn('[Uploads] Could not create uploadDir:', e.message);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `photo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Update profile
router.put('/profile', requireAuth, (req, res) => {
  const allowed = [
    'name', 'age', 'gender', 'interestedIn', 'department', 
    'year', 'block', 'bio', 'interests', 'photos', 'rollNumber'
  ];
  
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  const updatedUser = db.updateUser(req.user.id, updates);
  res.json({ success: true, user: updatedUser });
});

// Photo upload
router.post('/upload-photo', requireAuth, upload.single('photo'), (req, res) => {
  if (!req.file) {
    // Check if base64 provided
    if (req.body.photoBase64) {
      const photos = req.user.photos || [];
      photos.push(req.body.photoBase64);
      db.updateUser(req.user.id, { photos });
      return res.json({ success: true, photoUrl: req.body.photoBase64, photos });
    }
    return res.status(400).json({ error: 'No image uploaded' });
  }

  const photoUrl = `/uploads/${req.file.filename}`;
  const photos = req.user.photos || [];
  photos.push(photoUrl);
  db.updateUser(req.user.id, { photos });

  res.json({ success: true, photoUrl, photos });
});

// Get demo students list for the quick-switch bar in demo mode
router.get('/demo-list', (req, res) => {
  const list = db.data.users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    department: u.department,
    gender: u.gender,
    photo: u.photos?.[0] || ''
  }));
  res.json({ success: true, users: list });
});

module.exports = router;
