require('dotenv').config(); // ← MUST BE FIRST LINE

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const admin = require('firebase-admin');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// === FIREBASE ADMIN SETUP (FIXED) ===
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// Critical check
if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
  console.error('ERROR: Missing Firebase credentials in environment!');
  console.error('Check: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.STORAGE_BUCKET,
  });
  console.log('Firebase Admin initialized successfully!');
} catch (error) {
  console.error('Firebase init failed:', error.message);
  process.exit(1);
}

// === SERVE STATIC FILES ===
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// === SOCKET.IO REAL-TIME LOGIC ===
const users = new Map();

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('register', (data) => {
    const { uid, name, phone, photoURL } = data;
    users.set(socket.id, { uid, name, phone, photoURL, peerId: socket.id });
    
    socket.emit('registered', { peerId: socket.id });
    socket.broadcast.emit('user-joined', { name, photoURL, peerId: socket.id });
    
    // Send existing users to new user
    const existingUsers = Array.from(users.values()).filter(u => u.peerId !== socket.id);
    socket.emit('user-list', existingUsers);
  });

  socket.on('chat', (msg) => {
    const sender = users.get(socket.id);
    if (!sender) return;

    const message = {
      ...msg,
      name: sender.name,
      photoURL: sender.photoURL
    };

    // Send to sender (with "sent" style)
    socket.emit('message-sent', message);
    // Send to others
    socket.broadcast.emit('chat', message);
  });

  socket.on('disconnect', () => {
    if (users.has(socket.id)) {
      const { name } = users.get(socket.id);
      socket.broadcast.emit('user-left', { name });
      users.delete(socket.id);
      console.log('User disconnected:', name);
    }
  });
});

// === START SERVER ===
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`TalkShak is LIVE on http://localhost:${PORT}`);
  console.log(`Open in browser to test!`);
});
