const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const app = require('./app');
const { setupSocket } = require('./socket');

const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setupSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  const frontendDist = path.join(__dirname, '../frontend/dist');
  console.log(`\n======================================================`);
  console.log(`🎓 CU-Spark Backend running on http://localhost:${PORT}`);
  console.log(`🔒 Privacy & E2EE Anti-Leak Chat Server Active`);
  console.log(`📞 WebRTC 1-on-1 Audio & Video Calling Signaling Active`);
  if (fs.existsSync(frontendDist)) {
    console.log(`📱 Web App UI active at http://localhost:${PORT}`);
  }
  console.log(`======================================================\n`);
});

module.exports = server;
