// server.js
import express from 'express';
import dotenv from 'dotenv';
import router from './routes.js';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import logger from './helpers/logger.js';

// ─── Configure dotenv FIRST ─────────────────────────────────────────────────
dotenv.config();
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Create required directories ─────────────────────────────────────────────────
const logsDir = './logs';

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const app = express();




app.use(cors({
  origin: (origin, callback) => {
    // Allow local development and specific deployed URLs
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:3002",
      "https://attendencetask.onrender.com",
      "https://attendencetask-dbts.onrender.com",
    ];

    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app") || origin.endsWith(".netlify.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true
}));


// ─── Body / cookie parsers ───────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', router);

// ─── Serve Frontend (Production) ─────────────────────────────────────────────
// ─── Serve Frontend (Production) ─────────────────────────────────────────────
const possibleBuildPaths = [
  path.join(__dirname, 'public'),             // Shared folder within server/
  path.join(__dirname, '../admin/build'),     // Sibling admin/ folder
  path.join(process.cwd(), 'admin/build'),    // Current working dir admin/
  path.join(process.cwd(), 'public')          // Root level public/
];

let adminBuildPath = possibleBuildPaths.find(p => fs.existsSync(p));

if (adminBuildPath) {
  logger.info(`[SPA] Serving frontend from: ${adminBuildPath}`);
  app.use(express.static(adminBuildPath));

  app.use((req, res, next) => {
    // Explicitly skip API and files with extensions
    if (req.path.startsWith('/api') || req.path.includes('.')) {
      return next();
    }

    const indexPath = path.join(adminBuildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
} else {
  logger.warn('[SPA] No build folder found in any possible location!');
}

// ─── MongoDB ──────────────────────────────────────────────────────────────────
const mongodb = async () => {
  try {
    await mongoose.connect(process.env.DBPATH);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
  }
};
mongodb();

// ─── Start Server ─────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      logger.info(`Server started successfully on port ${PORT}`);
      // console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
    });
  } catch (error) {
    logger.error('Server start error:', error);
  }
};

startServer();