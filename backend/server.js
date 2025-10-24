// server.js
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
import contactRoutes from './src/routes/contact.js';
import connectDB from './src/config/db.js';
import errorHandler from './src/middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';
// Import queue system to initialize workers
import './src/utils/queue.js';

dotenv.config();
process.env.SERVER_START_TIME = Date.now();

// MongoDB connection
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Determine allowed origins based on environment
const allowedOrigins = [
  "http://localhost:5173",
  "https://hyperlocal-ai-project.vercel.app"
];

// CORS middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Parse JSON
app.use(express.json());

// Add middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
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
app.use('/api/contact', contactRoutes);
app.use('/api', protectedRoutes);

// Add a catch-all route to handle unmatched routes (before error handler)
app.use('*', (req, res) => {
  console.log(`Unmatched route: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Route not found' });
});

// Error handling
app.use(errorHandler);

// ---------------- Socket.IO setup ----------------
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Example: listen for messages from client
  socket.on('chatMessage', (msg) => {
    console.log('Message received:', msg);
    // Broadcast to all clients
    io.emit('chatMessage', msg);
  });
});

app.set('io', io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Queue system initialized and workers started');
});
