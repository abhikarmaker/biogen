require('dotenv').config();
const Sentry = require('@sentry/node');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
}

const authRoutes = require('./routes/auth');
const bioRoutes = require('./routes/bio');
const icebreakerRoutes = require('./routes/icebreaker');
const paymentsRoutes = require('./routes/payments');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

const app = express();

// Trust Render/reverse-proxy forwarded IPs (required for rate limiter)
app.set('trust proxy', 1);

// Stripe webhooks need raw body — must be before express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Screenshot uploads need a larger body limit than the rest of the API
app.use('/api/icebreaker/extract-bio', express.json({ limit: '15mb' }));

app.use(express.json());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  })
);

// Global rate limiter
app.use(
  '/api/',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Slow down.' },
  })
);

// Tight limit on AI generation endpoints
app.use(
  '/api/bio/generate',
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: { error: 'Generation limit reached. Try again in an hour.' },
  })
);
app.use(
  '/api/icebreaker/generate',
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 30,
    message: { error: 'Generation limit reached. Try again in an hour.' },
  })
);
app.use(
  '/api/icebreaker/extract-bio',
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: { error: 'Screenshot upload limit reached. Try again in an hour.' },
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bio', bioRoutes);
app.use('/api/icebreaker', icebreakerRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Health check (used by Render.com)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: require('./package.json').version,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 3000;
// Only bind a real port when run directly (`node server.js` / `npm start`) —
// requiring this module from tests (supertest) must not also start a listener.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`BioGen API running on port ${PORT}`);
  });
}

module.exports = app;
