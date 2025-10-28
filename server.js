const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const admin = require('firebase-admin');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Firebase Admin - Uses Environment Variables
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.STORAGE_BUCKET,
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const users = new Map();

io.on('connection', (socket) => {
  socket.on('register', (data) => {
    const { uid, name, phone, photoURL } = data;
    users.set(socket.id, { uid, name, phone, photoURL, peerId: socket.id });

    socket.emit('registered', { peerId: socket.id });
    socket.broadcast.emit('user-joined', { name, photoURL, peerId: socket.id });
    socket.emit('user-list', Array.from(users.values()).filter(u => u.peerId !== socket.id));
  });

  socket.on('chat', (msg) => {
    const sender = users.get(socket.id);
    const message = { ...msg, name: sender.name, photoURL: sender.photoURL };
    socket.emit('message-sent', message);
    socket.broadcast.emit('chat', message);
  });

  socket.on('disconnect', () => {
    if (users.has(socket.id)) {
      const { name } = users.get(socket.id);
      socket.broadcast.emit('user-left', { name });
      users.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`TalkShak running on port ${PORT}`));