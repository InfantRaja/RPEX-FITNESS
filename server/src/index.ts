import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import { connectDB } from './config/database';
import { configurePassport } from './config/passport';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import workoutRoutes from './routes/workouts';
import nutritionRoutes from './routes/nutrition';
import progressRoutes from './routes/progress';
import aiRoutes from './routes/ai';
import analyticsRoutes from './routes/analytics';
import splitRoutes from './routes/splits';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// CORS
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'repx_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
}));

// Passport
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Root & Favicon
app.get('/', (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  if (req.accepts('html')) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>REPX Tracker API</title>
        <meta http-equiv="refresh" content="2;url=${clientUrl}" />
        <style>
          body {
            background: #0B0D0F;
            color: #F5F7FA;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 1.5rem;
            box-sizing: border-box;
            text-align: center;
          }
          .card {
            background: #15191D;
            border: 1px solid #2A3038;
            padding: 2.5rem;
            border-radius: 1.25rem;
            max-width: 460px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
          }
          h1 { color: #B8FF3B; margin-top: 0; font-size: 1.75rem; }
          p { color: #9AA4AF; line-height: 1.6; font-size: 0.95rem; }
          a {
            display: inline-block;
            margin-top: 1.25rem;
            padding: 0.75rem 1.75rem;
            background: #B8FF3B;
            color: #0B0D0F;
            text-decoration: none;
            font-weight: 700;
            border-radius: 0.75rem;
            transition: opacity 0.2s;
          }
          a:hover { opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>⚡ REPX Tracker API</h1>
          <p>Port 5000 is the backend API server.</p>
          <p>Redirecting you to the frontend app in 2 seconds...</p>
          <a href="${clientUrl}">Open Frontend App Now &rarr;</a>
        </div>
      </body>
      </html>
    `);
  }
  res.json({
    success: true,
    message: 'REPX Tracker Backend API is running',
    frontendUrl: clientUrl,
    healthCheck: '/api/health',
  });
});

app.get('/favicon.ico', (_req, res) => {
  res.status(204).end();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'REPX Tracker API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/splits', splitRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 REPX Tracker Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Client URL: ${process.env.CLIENT_URL}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
