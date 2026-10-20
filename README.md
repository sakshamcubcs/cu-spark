# 🎓 CU Spark (Chandigarh University Unofficial Dating App)

**CU Spark** is a private, security-first dating and connection web app designed exclusively for Chandigarh University students. Built with mutual interest matching, zero-leakage client-encrypted chat, anti-screenshot deterrents, and peer-to-peer WebRTC 1-on-1 audio/video calling.

---

## 🌟 Key Features

### 1. 🛡️ Chandigarh University Email Verification
- Accepts **only** Chandigarh University student emails ending with:
  - `@cumail.in`
  - `@cuchd.in`
- 6-digit OTP verification system prevents external accounts and maintains an authentic campus community.
- Pre-seeded with realistic Chandigarh University student profiles (CSE, AI & Data Science, BBA, MBA, Biotechnology, Law from North and South Campus blocks) with 1-click test access.

### 2. 💘 Mutual Interest & Campus Matching
- **Tinder/Bumble-style Card Stack**: Browse fellow CU students with photos, department, year, campus block, and bio.
- **Mutual Interest Highlighting**: Automatically calculates and highlights common hobbies & hangout spots (e.g., *“Both love Kasauli Road Trips, Hostel Maggi & Sector 17 Cafes”*).
- **Match Celebration**: Real-time confetti celebration popup when two students mutually like each other. Unmatched users can never contact or message you.

### 3. 🔒 Zero-Leakage & Anti-Leak Chat Environment
- **Client-Side End-to-End Encryption (E2EE)**: Messages are encrypted in the browser with **AES-GCM (256-bit)** using keys derived from the mutual match seed. The server and network intermediaries only handle ciphertext.
- **Anti-Screenshot Identity Watermarking**: Dynamic repeating watermark with the viewing student's email and UID tiled subtly across the chat canvas. Anyone attempting a screenshot exposes their own identity.
- **Focus / Tab-Switch Privacy Blur**: The chat automatically blurs with a privacy shield whenever you switch tabs or minimize the window. A quick **Panic Shield** button is also available in the header.
- **Ephemeral / Disappearing Messages**: Configurable timer (Off, 30s, 5m, 1h, 24h) that permanently purges messages from the client and database.
- **View-Once Media (1️⃣)**: Send photos that self-destruct 8 seconds after the recipient opens them.

### 4. 📞 1-on-1 Audio & Video Calling (WebRTC)
- Direct peer-to-peer WebRTC connection with STUN server signaling over Socket.io.
- Incoming call ring notification modal with animated incoming pulse.
- **Video Call**: Fullscreen remote camera, local camera preview in draggable Picture-in-Picture, camera toggle, and mic toggle.
- **Voice Call**: Clean audio interface with pulsing visualizer avatar and call duration timer.
- **Mutual Match Permission Gate**: Calls can only be placed between verified mutual matches.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ or v22+)
- Modern web browser (Chrome, Safari, Edge, Firefox)

### Running the App
1. Open PowerShell / Terminal in the project folder:
   ```bash
   cd C:\Users\saksh\.gemini\antigravity\scratch\cu-spark
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

---

## 🧪 Testing Between 2 Students (Multi-Window Demo)

To test the matching, instant messaging, and WebRTC audio/video call between two students:

1. Open **Browser Window 1** (e.g. Regular Chrome):
   - Go to `http://localhost:5000`.
   - Use the **Demo CU Student** picker in the top navbar or login modal to log in as **Rohit Sharma** (B.Tech CSE).
2. Open **Browser Window 2** (e.g. Incognito window or another browser):
   - Go to `http://localhost:5000`.
   - Log in as **Ananya Kapoor** (BBA, South Campus).
3. Both students are already mutual matches!
4. Navigate to the **Matches** tab on both windows:
   - Click each other's conversation.
   - Send encrypted messages in real-time.
   - Try the **Disappearing Message timer** or **View-Once photo**.
   - Click the **Phone 📞** or **Video 📹** call button to test real-time WebRTC calling with audio & video streams!

---

## 📁 Project Structure

```
cu-spark/
├── backend/
│   ├── database.js          # Persistent JSON store & ephemeral purge engine
│   ├── server.js            # Express server & static frontend serving
│   ├── middleware/
│   │   └── auth.js          # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js          # CU domain check, OTP verify & demo switcher
│   │   ├── matches.js       # Discover feed, swiping & mutual match engine
│   │   ├── users.js         # Student profile & photo upload endpoints
│   │   └── chat.js          # Chat endpoints & view-once handler
│   └── socket/
│       └── index.js         # Socket.io chat room & WebRTC call signaling
└── frontend/
    ├── src/
    │   ├── context/
    │   │   ├── AuthContext.jsx    # Session & demo user management
    │   │   └── SocketContext.jsx  # WebRTC peer connection & call manager
    │   ├── services/
    │   │   └── crypto.js          # Web Crypto API AES-GCM 256-bit E2EE
    │   ├── components/
    │   │   ├── Navbar.jsx         # CU header, online count & panic shield
    │   │   ├── BottomNav.jsx      # Mobile tab navigation
    │   │   ├── DiscoverCard.jsx   # Tinder/Bumble card with photo carousel
    │   │   ├── MatchCelebrationModal.jsx # Confetti match popup
    │   │   ├── MatchesList.jsx    # Confirmed matches list
    │   │   ├── ChatView.jsx       # Zero-leakage chat, watermark & timer
    │   │   ├── CallModal.jsx      # WebRTC audio & video calling screen
    │   │   ├── MyProfile.jsx      # CU academic details & photo editor
    │   │   └── AuthModal.jsx      # Email OTP login & student picker
    │   ├── App.jsx
    │   └── index.css
    ├── vite.config.js
    └── package.json
```
