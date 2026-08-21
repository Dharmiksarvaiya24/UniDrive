require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { db } = require('./src/config/firebase');
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const filesRoutes = require('./src/routes/files.routes');
const accountsRoutes = require('./src/routes/accounts.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable trust proxy for reverse proxies (Render, Cloudflare, Heroku)
app.set('trust proxy', 1);

// CORS: only allow the real frontend origins — never a wildcard.
// credentials: true is required so the session cookie is sent cross-origin.
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://unidrive.dharmik.live',
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (no Origin header, e.g. curl/server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const rateLimit = require('express-rate-limit');

// Rate limiter for authentication routes: max 30 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for general API routes: max 120 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Status : OK' });
});

app.use('/auth', authLimiter, authRoutes);
app.use('/api/user', apiLimiter, userRoutes);
app.use('/api/files', apiLimiter, filesRoutes);
app.use('/api/accounts', apiLimiter, accountsRoutes);

// 404 for unknown API routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Central error handler — never leak stack traces to clients
app.use((err, req, res, next) => {
  const isCorsError = err && err.message === 'Not allowed by CORS';
  if (!isCorsError) console.error('Unhandled error:', err.message);
  res.status(isCorsError ? 403 : 500).json({ error: isCorsError ? 'Not allowed by CORS' : 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});