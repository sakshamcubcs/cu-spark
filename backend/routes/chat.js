const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

// Get messages for a match
router.get('/:matchId/messages', requireAuth, (req, res) => {
  const match = db.getMatch(req.params.matchId, req.user.id);
  if (!match) {
    return res.status(403).json({ error: 'Access restricted! Only mutual matches can view conversations.' });
  }

  const messages = db.getMessages(req.params.matchId, req.user.id);
  res.json({ success: true, messages });
});

// View-Once open event
router.post('/view-once-opened', requireAuth, (req, res) => {
  const { messageId } = req.body;
  if (!messageId) {
    return res.status(400).json({ error: 'messageId required' });
  }

  const destroyed = db.markViewOnceOpened(messageId, req.user.id);
  res.json({ success: destroyed });
});

module.exports = router;
