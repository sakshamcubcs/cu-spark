const fs = require('fs');
const path = require('path');

const DB_FILE = process.env.VERCEL
  ? path.join('/tmp', 'cu_spark_data.json')
  : path.join(__dirname, 'cu_spark_data.json');

// Default Chandigarh University seed profiles for instant discovery & testing
const DEFAULT_SEED_USERS = [
  {
    id: "cu_user_1",
    email: "rohit.22bcs1044@cuchd.in",
    name: "Rohit Sharma",
    age: 21,
    gender: "male",
    interestedIn: "female",
    rollNumber: "22BCS1044",
    department: "B.Tech Computer Science (CSE)",
    year: "3rd Year",
    block: "Academic Block 3 (North Campus)",
    bio: "Building cool tech by day, playing guitar at CU Amphitheatre by evening. Always up for chai at Gate 2 or road trips to Kasauli! ☕🎸",
    interests: ["Coding", "Guitar", "Kasauli Road Trips", "Hostel Maggi", "Gym & Fitness", "Anime"],
    photos: [
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80"
    ],
    verified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "cu_user_2",
    email: "ananya.22bba309@cumail.in",
    name: "Ananya Kapoor",
    age: 20,
    gender: "female",
    interestedIn: "male",
    rollNumber: "22BBA309",
    department: "BBA (Apex Institute)",
    year: "2nd Year",
    block: "Block B (South Campus)",
    bio: "Obsessed with Chandigarh cafe hunting, Bollywood dance society, and late night hostel talks. Let's debate who makes the best iced latte in Sector 17! 🍰✨",
    interests: ["Chandigarh Cafes", "Bhangra", "Bollywood", "Photography", "Travel", "Fashion"],
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80"
    ],
    verified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "cu_user_3",
    email: "arjun.21bai402@cuchd.in",
    name: "Arjun Verma",
    age: 22,
    gender: "male",
    interestedIn: "female",
    rollNumber: "21BAI402",
    department: "B.Tech AI & Data Science",
    year: "4th Year",
    block: "Academic Block 1",
    bio: "Training neural nets and training in the gym. Looking for someone to explore Sukhna Lake sunsets with or chill at the CU Food Court. 🤖🏋️‍♂️",
    interests: ["AI & Tech", "Gym & Fitness", "Sukhna Lake", "Gaming", "Sci-Fi", "Chandigarh Cafes"],
    photos: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80"
    ],
    verified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "cu_user_4",
    email: "simran.23blaw115@cumail.in",
    name: "Simran Kaur",
    age: 20,
    gender: "female",
    interestedIn: "male",
    rollNumber: "23BLAW115",
    department: "B.A. LL.B (Legal Studies)",
    year: "2nd Year",
    block: "Block C (Law Wing)",
    bio: "Moot court champion, amateur poet, and full-time tea lover. If you can make me laugh during exam week, you've already won! ⚖️📖☕",
    interests: ["Debate & Law", "Poetry", "Hostel Maggi", "Chandigarh Cafes", "Music", "Road Trips"],
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80"
    ],
    verified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "cu_user_5",
    email: "tanya.22bdes501@cuchd.in",
    name: "Tanya Malhotra",
    age: 21,
    gender: "female",
    interestedIn: "everyone",
    rollNumber: "22BDES501",
    department: "Bachelor of Design (UI/UX)",
    year: "3rd Year",
    block: "Design Block North",
    bio: "Always sketching UI concepts or taking polaroids around campus. Let's grab cold coffee from Nescafe and talk about design, music & life! 🎨☕",
    interests: ["Design & Art", "Photography", "Chandigarh Cafes", "Indie Music", "Gaming", "Coding"],
    photos: [
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&auto=format&fit=crop&q=80"
    ],
    verified: true,
    createdAt: new Date().toISOString()
  }
];

class Database {
  constructor() {
    this.data = {
      users: [],
      swipes: [],     // { id, fromUserId, toUserId, type: 'like' | 'pass' | 'superlike', createdAt }
      matches: [],    // { id, user1Id, user2Id, matchedAt, encryptionKeySeed }
      messages: [],   // { id, matchId, senderId, recipientId, encryptedPayload, iv, isViewOnce, opened, expiresAt, createdAt }
      otps: {}        // email -> { otp, expiresAt }
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        console.log(`[DB] Loaded data from disk. Users: ${this.data.users.length}, Matches: ${this.data.matches.length}`);
      } else {
        // Seed default Chandigarh University profiles
        this.data.users = [...DEFAULT_SEED_USERS];
        // Create an initial mutual match between user 1 and user 2 for testing
        this.data.swipes.push({ id: "sw_1", fromUserId: "cu_user_1", toUserId: "cu_user_2", type: "like", createdAt: new Date().toISOString() });
        this.data.swipes.push({ id: "sw_2", fromUserId: "cu_user_2", toUserId: "cu_user_1", type: "like", createdAt: new Date().toISOString() });
        this.data.matches.push({
          id: "match_cu1_cu2",
          user1Id: "cu_user_1",
          user2Id: "cu_user_2",
          matchedAt: new Date().toISOString(),
          encryptionKeySeed: "cu_e2ee_secret_key_seed_cu1_cu2"
        });
        this.save();
        console.log(`[DB] Initialized fresh database with Chandigarh University student profiles.`);
      }
    } catch (err) {
      console.error("[DB] Error loading database:", err);
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error("[DB] Error saving database:", err);
    }
  }

  // --- Users ---
  getUserById(id) {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user) {
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUser(id, updates) {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.data.users[index] = { ...this.data.users[index], ...updates };
      this.save();
      return this.data.users[index];
    }
    return null;
  }

  // --- OTP Verification ---
  setOtp(email, otp, expiryMinutes = 10) {
    this.data.otps[email.toLowerCase()] = {
      otp: String(otp),
      expiresAt: Date.now() + expiryMinutes * 60 * 1000
    };
  }

  verifyOtp(email, otp) {
    const record = this.data.otps[email.toLowerCase()];
    if (!record) return false;
    if (Date.now() > record.expiresAt) {
      delete this.data.otps[email.toLowerCase()];
      return false;
    }
    if (record.otp === String(otp)) {
      delete this.data.otps[email.toLowerCase()];
      return true;
    }
    return false;
  }

  // --- Swipes & Mutual Matches ---
  addSwipe(fromUserId, toUserId, type) {
    const existing = this.data.swipes.find(s => s.fromUserId === fromUserId && s.toUserId === toUserId);
    if (existing) {
      existing.type = type;
      existing.updatedAt = new Date().toISOString();
    } else {
      this.data.swipes.push({
        id: `sw_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        fromUserId,
        toUserId,
        type,
        createdAt: new Date().toISOString()
      });
    }

    let isMatch = false;
    let matchRecord = null;

    // Check if the other person also liked this user!
    if (type === 'like' || type === 'superlike') {
      const mutualSwipe = this.data.swipes.find(s => 
        s.fromUserId === toUserId && 
        s.toUserId === fromUserId && 
        (s.type === 'like' || s.type === 'superlike')
      );

      if (mutualSwipe) {
        // Check if match already exists
        const existingMatch = this.data.matches.find(m => 
          (m.user1Id === fromUserId && m.user2Id === toUserId) ||
          (m.user1Id === toUserId && m.user2Id === fromUserId)
        );

        if (!existingMatch) {
          isMatch = true;
          matchRecord = {
            id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            user1Id: fromUserId,
            user2Id: toUserId,
            matchedAt: new Date().toISOString(),
            encryptionKeySeed: `seed_${Math.random().toString(36).substring(2)}_${Date.now()}`
          };
          this.data.matches.push(matchRecord);
        } else {
          matchRecord = existingMatch;
          isMatch = true;
        }
      }
    }

    this.save();
    return { isMatch, matchRecord };
  }

  getDiscoveryUsers(currentUserId) {
    const currentUser = this.getUserById(currentUserId);
    if (!currentUser) return [];

    // Get all user IDs already swiped by current user
    const swipedIds = new Set(
      this.data.swipes
        .filter(s => s.fromUserId === currentUserId)
        .map(s => s.toUserId)
    );
    swipedIds.add(currentUserId);

    return this.data.users.filter(u => {
      if (swipedIds.has(u.id)) return false;
      // Filter by gender preference if specified
      if (currentUser.interestedIn && currentUser.interestedIn !== 'everyone') {
        if (u.gender !== currentUser.interestedIn) return false;
      }
      return true;
    });
  }

  getMatchesForUser(userId) {
    const userMatches = this.data.matches.filter(m => m.user1Id === userId || m.user2Id === userId);
    return userMatches.map(m => {
      const partnerId = m.user1Id === userId ? m.user2Id : m.user1Id;
      const partner = this.getUserById(partnerId);
      
      // Calculate mutual interests
      const currentUser = this.getUserById(userId);
      const mutualInterests = (currentUser?.interests && partner?.interests)
        ? currentUser.interests.filter(i => partner.interests.includes(i))
        : [];

      // Get last message
      const matchMessages = this.data.messages.filter(msg => msg.matchId === m.id);
      const lastMsg = matchMessages.length > 0 ? matchMessages[matchMessages.length - 1] : null;

      return {
        matchId: m.id,
        matchedAt: m.matchedAt,
        encryptionKeySeed: m.encryptionKeySeed,
        partner,
        mutualInterests,
        lastMessage: lastMsg ? {
          createdAt: lastMsg.createdAt,
          senderId: lastMsg.senderId,
          isViewOnce: lastMsg.isViewOnce
        } : null
      };
    }).filter(item => item.partner); // Ensure partner exists
  }

  getMatch(matchId, userId) {
    const match = this.data.matches.find(m => m.id === matchId);
    if (!match) return null;
    // Security check: only participants can view match
    if (match.user1Id !== userId && match.user2Id !== userId) {
      return null;
    }
    return match;
  }

  // --- Messages & Privacy / Disappearing Logic ---
  addMessage(msg) {
    this.data.messages.push(msg);
    this.save();
    return msg;
  }

  getMessages(matchId, userId) {
    const match = this.getMatch(matchId, userId);
    if (!match) return [];

    const now = Date.now();
    // Filter out expired ephemeral messages
    this.data.messages = this.data.messages.filter(m => {
      if (m.expiresAt && now > m.expiresAt) return false;
      return true;
    });

    return this.data.messages.filter(m => m.matchId === matchId);
  }

  markViewOnceOpened(messageId, userId) {
    const msg = this.data.messages.find(m => m.id === messageId);
    if (msg && msg.recipientId === userId && msg.isViewOnce) {
      msg.opened = true;
      msg.encryptedPayload = "[VIEWED_AND_DESTROYED]";
      this.save();
      return true;
    }
    return false;
  }

  purgeExpiredMessages() {
    const now = Date.now();
    const initialCount = this.data.messages.length;
    this.data.messages = this.data.messages.filter(m => !m.expiresAt || now <= m.expiresAt);
    if (this.data.messages.length !== initialCount) {
      this.save();
      console.log(`[Privacy Engine] Purged ${initialCount - this.data.messages.length} expired ephemeral messages.`);
    }
  }
}

const db = new Database();

// Run periodic cleanup of ephemeral messages every 15 seconds
setInterval(() => {
  db.purgeExpiredMessages();
}, 15000);

module.exports = db;
