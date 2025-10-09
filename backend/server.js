import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import session from 'express-session';
import passport from 'passport';
import MongoStore from 'connect-mongo';
import authRoutes from './src/routes/auth.js';
import protectedRoutes from './src/routes/protected.js';
import serviceRoutes from './src/routes/service.js';
import bookingRoutes from './src/routes/booking.js';
import adminRoutes from './src/routes/admin.js';
import providerRoutes from './src/routes/provider.js';
import connectDB from './src/config/db.js';
import errorHandler from './src/middleware/errorHandler.js';

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment variables
dotenv.config();
process.env.SERVER_START_TIME = Date.now();

// MongoDB connection
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL || "http://localhost:3000", "https://hyperlocal-ai-project.vercel.app"],
  credentials: true
}));

// Parse JSON
app.use(express.json());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api', protectedRoutes);

// Serve frontend build (React) if build folder exists
const frontendPath = path.join(__dirname, '../frontend/build');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));

  // Catch-all route to serve index.html for non-API routes
  app.get('*', (req, res) => {
    // If the request starts with /api, return 404
    if (req.path.startsWith('/api')) {
      return res.status(404).send('Not Found');
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Error handling
app.use(errorHandler);

// Socket.IO setup
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: [process.env.FRONTEND_URL || "http://localhost:3000", "https://hyperlocal-ai-project.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.set('io', io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
