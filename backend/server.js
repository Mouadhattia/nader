const path = require('path');

require('dotenv').config({
  path: path.join(
    __dirname,
    process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
  ),
});

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const recordingsRouter = require('./routes/recordings');
const eventsRouter = require('./routes/events');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/audio-guest-book';
const PI_SHARED_TOKEN = process.env.PI_SHARED_TOKEN || '';

// FRONTEND_URL accepts a comma-separated list so apex and www (or a staging
// domain) can be allowed at once, e.g.
// FRONTEND_URL=https://mouadhattia.xyz,https://www.mouadhattia.xyz
const frontendOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = new Set([
  ...frontendOrigins,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

function isPrivateNetworkOrigin(origin) {
  try {
    const { hostname, port, protocol } = new URL(origin);
    const isDevPort = !port || port === '3000' || port === '5173';
    const isHttp = protocol === 'http:' || protocol === 'https:';
    const isPrivateHost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);

    return isHttp && isDevPort && isPrivateHost;
  } catch {
    return false;
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || isPrivateNetworkOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Socket.IO (phone button <-> guest kiosk bridge) ──────────────────────────

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin) || isPrivateNetworkOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  },
});

function isAuthorizedButtonClient(socket) {
  if (!PI_SHARED_TOKEN) return true;
  return socket.handshake.auth?.token === PI_SHARED_TOKEN;
}

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Raspberry Pi phone button -> relay to guest kiosk browser(s).
  // Anyone may connect and listen (the kiosk browser needs no secret);
  // only a client presenting PI_SHARED_TOKEN may trigger start/stop.
  socket.on('start_recording', () => {
    if (!isAuthorizedButtonClient(socket)) {
      console.warn('⚠️  Rejected start_recording from unauthorized socket', socket.id);
      return;
    }
    console.log('▶️  Remote start_recording received from', socket.id);
    socket.broadcast.emit('remote:start_recording');
  });

  socket.on('stop_recording', () => {
    if (!isAuthorizedButtonClient(socket)) {
      console.warn('⚠️  Rejected stop_recording from unauthorized socket', socket.id);
      return;
    }
    console.log('⏹️  Remote stop_recording received from', socket.id);
    socket.broadcast.emit('remote:stop_recording');
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
  });
});

// Serve uploaded audio files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use('/api/recordings', recordingsRouter);
app.use('/api/events', eventsRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Serve the built Vite app in production/deploy environments.
const frontendDistPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/uploads') ||
      req.path === '/health'
    ) {
      next();
      return;
    }

    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ─── Database + Start ─────────────────────────────────────────────────────────

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected:', MONGO_URI);

    server.listen(PORT, () => {
      console.log(`🎙️  Audio Guest Book API running on http://localhost:${PORT}`);
      console.log(`📁  Uploads served at http://localhost:${PORT}/uploads`);
      console.log(`🔌  Socket.IO ready for phone button events`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

start();
