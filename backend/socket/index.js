const jwt = require('jsonwebtoken');
const db = require('../database');
const { JWT_SECRET } = require('../middleware/auth');

// Map of userId -> Set of socketIds (to support multiple tabs/devices)
const onlineUsers = new Map();

function setupSocket(io) {
  // Socket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.getUserById(decoded.userId);
      if (!user) {
        return next(new Error('User not found'));
      }
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`[Socket] User connected: ${socket.user.name || socket.user.email} (${userId})`);

    // Track online user
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Broadcast user online status
    io.emit('user-status-change', { userId, isOnline: true });

    // 1. Join Chat Room for a Match
    socket.on('join-match', ({ matchId }) => {
      const match = db.getMatch(matchId, userId);
      if (!match) {
        return socket.emit('error-msg', { message: 'Security alert: Not authorized for this match room.' });
      }

      socket.join(`match_${matchId}`);
      console.log(`[Socket] User ${userId} joined match room: match_${matchId}`);
    });

    // 2. Send Secure / Ephemeral Message
    socket.on('send-message', ({ matchId, encryptedPayload, iv, isViewOnce, ttlSeconds }) => {
      const match = db.getMatch(matchId, userId);
      if (!match) {
        return socket.emit('error-msg', { message: 'Cannot send message to unmatched user.' });
      }

      const recipientId = match.user1Id === userId ? match.user2Id : match.user1Id;
      const now = Date.now();
      const expiresAt = ttlSeconds && ttlSeconds > 0 ? now + (ttlSeconds * 1000) : null;

      const messageRecord = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        matchId,
        senderId: userId,
        recipientId,
        encryptedPayload,
        iv,
        isViewOnce: !!isViewOnce,
        opened: false,
        expiresAt,
        createdAt: new Date().toISOString()
      };

      db.addMessage(messageRecord);

      // Broadcast to room
      io.to(`match_${matchId}`).emit('new-message', messageRecord);

      // If ephemeral, schedule immediate client-side and server expiration notification
      if (expiresAt) {
        setTimeout(() => {
          io.to(`match_${matchId}`).emit('message-expired', { messageId: messageRecord.id, matchId });
        }, ttlSeconds * 1000);
      }
    });

    // 3. Typing indicator
    socket.on('typing', ({ matchId, isTyping }) => {
      socket.to(`match_${matchId}`).emit('partner-typing', { userId, isTyping });
    });

    // 4. View-Once Opened
    socket.on('view-once-opened', ({ messageId, matchId }) => {
      const success = db.markViewOnceOpened(messageId, userId);
      if (success) {
        io.to(`match_${matchId}`).emit('view-once-destroyed', { messageId });
      }
    });

    // ==========================================
    // WebRTC 1-on-1 Audio & Video Calling Handlers
    // ==========================================

    // Initiate Call
    socket.on('call-user', ({ targetUserId, matchId, isVideo, offer }) => {
      // Security: verify mutual match exists between caller and target
      const match = db.getMatch(matchId, userId);
      if (!match || (match.user1Id !== targetUserId && match.user2Id !== targetUserId)) {
        return socket.emit('call-error', { message: 'You can only call confirmed mutual matches.' });
      }

      console.log(`[WebRTC] Call initiated from ${userId} to ${targetUserId} (Video: ${isVideo})`);

      const targetSockets = onlineUsers.get(targetUserId);
      if (!targetSockets || targetSockets.size === 0) {
        return socket.emit('call-offline', { targetUserId, message: 'Student is currently offline.' });
      }

      // Notify recipient
      for (const sId of targetSockets) {
        io.to(sId).emit('incoming-call', {
          callerId: userId,
          callerName: socket.user.name || 'Chandigarh University Student',
          callerPhoto: socket.user.photos?.[0] || '',
          callerDepartment: socket.user.department || '',
          matchId,
          isVideo,
          offer
        });
      }
    });

    // Call Accepted
    socket.on('accept-call', ({ callerId, matchId, answer }) => {
      console.log(`[WebRTC] Call accepted by ${userId} for caller ${callerId}`);
      const callerSockets = onlineUsers.get(callerId);
      if (callerSockets) {
        for (const sId of callerSockets) {
          io.to(sId).emit('call-accepted', {
            targetUserId: userId,
            matchId,
            answer
          });
        }
      }
    });

    // Call Rejected / Declined
    socket.on('reject-call', ({ callerId, matchId, reason }) => {
      console.log(`[WebRTC] Call rejected by ${userId} for caller ${callerId}`);
      const callerSockets = onlineUsers.get(callerId);
      if (callerSockets) {
        for (const sId of callerSockets) {
          io.to(sId).emit('call-rejected', {
            targetUserId: userId,
            matchId,
            reason: reason || 'Call declined'
          });
        }
      }
    });

    // ICE Candidate Exchange
    socket.on('ice-candidate', ({ targetUserId, candidate, matchId }) => {
      const targetSockets = onlineUsers.get(targetUserId);
      if (targetSockets) {
        for (const sId of targetSockets) {
          io.to(sId).emit('ice-candidate', {
            fromUserId: userId,
            candidate,
            matchId
          });
        }
      }
    });

    // End Call
    socket.on('end-call', ({ targetUserId, matchId }) => {
      console.log(`[WebRTC] Call ended by ${userId}`);
      const targetSockets = onlineUsers.get(targetUserId);
      if (targetSockets) {
        for (const sId of targetSockets) {
          io.to(sId).emit('call-ended', {
            endedByUserId: userId,
            matchId
          });
        }
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${userId}`);
      if (onlineUsers.has(userId)) {
        onlineUsers.get(userId).delete(socket.id);
        if (onlineUsers.get(userId).size === 0) {
          onlineUsers.delete(userId);
          io.emit('user-status-change', { userId, isOnline: false });
        }
      }
    });
  });
}

module.exports = { setupSocket };
