const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

// 1. Get Discover Profiles (Chandigarh University students)
router.get('/discover', requireAuth, (req, res) => {
  const users = db.getDiscoveryUsers(req.user.id);
  
  // Augment each card with mutual interest tags count
  const enriched = users.map(u => {
    const commonInterests = (req.user.interests && u.interests)
      ? req.user.interests.filter(i => u.interests.includes(i))
      : [];
    return {
      ...u,
      commonInterests
    };
  });

  res.json({ success: true, count: enriched.length, users: enriched });
});

// 2. Swipe action (like / pass / superlike)
router.post('/swipe', requireAuth, (req, res) => {
  const { toUserId, type } = req.body;
  if (!toUserId || !['like', 'pass', 'superlike'].includes(type)) {
    return res.status(400).json({ error: 'Valid toUserId and swipe type required.' });
  }

  const targetUser = db.getUserById(toUserId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Student profile not found.' });
  }

  const { isMatch, matchRecord } = db.addSwipe(req.user.id, toUserId, type);

  let matchDetails = null;
  if (isMatch && matchRecord) {
    const commonInterests = (req.user.interests && targetUser.interests)
      ? req.user.interests.filter(i => targetUser.interests.includes(i))
      : [];

    matchDetails = {
      matchId: matchRecord.id,
      partner: targetUser,
      mutualInterests: commonInterests,
      matchedAt: matchRecord.matchedAt
    };
  }

  res.json({
    success: true,
    isMatch,
    match: matchDetails
  });
});

// 3. Get confirmed mutual matches
router.get('/list', requireAuth, (req, res) => {
  const matches = db.getMatchesForUser(req.user.id);
  res.json({ success: true, matches });
});

// 4. Get specific match info (with E2EE secret seed)
router.get('/:matchId', requireAuth, (req, res) => {
  const match = db.getMatch(req.params.matchId, req.user.id);
  if (!match) {
    return res.status(403).json({ error: 'You are not part of this mutual match.' });
  }

  const partnerId = match.user1Id === req.user.id ? match.user2Id : match.user1Id;
  const partner = db.getUserById(partnerId);

  const commonInterests = (req.user.interests && partner?.interests)
    ? req.user.interests.filter(i => partner.interests.includes(i))
    : [];

  res.json({
    success: true,
    match: {
      ...match,
      partner,
      mutualInterests: commonInterests
    }
  });
});

module.exports = router;
