import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { fileURLToPath } from 'url';
import { initRedis } from './config/redis.js';
import { connectDB } from './config/db.js';

import shortenRoutes from './routes/shorten.js';
import redirectRoutes from './routes/redirect.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ====================== MIDDLEWARE ======================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        "img-src": ["'self'", "data:", "https://cdn.jsdelivr.net"],
      },
    },
  })
);
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// This lets you open http://localhost:3000/testers/graph.html
app.use('/testers', express.static(path.join(__dirname, '../testers')));

// ====================== RATE LIMITERS ======================
// 1. For API (shorten)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,     // 1 minute
  max: 10000,                // 300 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "error", message: "Too many requests from this IP" }
});

// 2. For Redirects (much higher limit)
const redirectLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50000,               // 1200 redirects per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  message: { status: "error", message: "Too many redirects" }
});

// Apply limiters
//app.use('/api/shorten', apiLimiter);
//app.use('/:code', redirectLimiter);   // Important: before redirectRoutes

// ====================== ROUTES ======================
app.get('/test', (req, res) => {
  res.json({ status: "ok", message: "Backend is working!" });
});

app.use('/api', shortenRoutes);

// Catch-all for short codes (must be last)
app.use('/', redirectRoutes);

// ====================== START SERVER ======================
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connectDB();
    await initRedis();

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`Test: http://localhost:${PORT}/test`);
    });

  } catch (err) {
    console.error('❌ Failed to start server:', err);
  }
}

start();