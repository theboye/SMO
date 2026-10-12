import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initRedis } from './config/redis.js';
import redirectRoutes from './routes/redirect.js';

dotenv.config();

import { connectDB } from './config/db.js';
import shortenRoutes from './routes/shorten.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "error", message: "Too many requests, please try again later." }
});

const redirectLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,                    // Higher for redirects
  keyGenerator: (req) => req.params.code || req.ip
});
app.use('/api/shorten', apiLimiter);
app.use('/:code', redirectLimiter);   // apply only to redirect route

// Test route
app.get('/test', (req, res) => {
  res.json({ status: "ok", message: "Backend is working!" });
});

// Main routes
app.use('/api', shortenRoutes);

// The Redirect Route (Catch-all for short codes)
app.use('/', redirectRoutes);

const PORT = process.env.PORT || 3000;

async function start() {

  setInterval(async () => {
    try {
        const linkDelete = await pool.query('DELETE FROM short_links WHERE         expires_at < NOW()');
        const contentDelete = await pool.query('DELETE FROM non_link_content         WHERE expires_at < NOW()');
        console.log(`🧹 Cleanup: Removed ${linkDelete.rowCount +         contentDelete.rowCount} expired items`);
    } catch (err) {
        console.error('❌ Cleanup Worker Error:', err);
    }
}, 24 * 60 * 60 * 1000);

  try {
    await connectDB();
    // Start Redis right after PostgreSQL
    await initRedis(); 

    app.listen(PORT, () => {
      console.log(`✅ Server successfully started on http://localhost:${PORT}`);
      console.log(`Test endpoint: http://localhost:${PORT}/test`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
  }
}

start();