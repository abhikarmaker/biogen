const { Router } = require('express');
const { subscribe, oneTime, webhook } = require('../controllers/paymentController');
const { webhook: revenuecatWebhook } = require('../controllers/revenuecatController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = Router();

// webhook must come before express.json — raw body already set in server.js
router.post('/webhook', webhook);

// RevenueCat webhooks are plain JSON (static Authorization-header auth, not
// signed like Stripe's), so this one doesn't need the raw-body treatment above.
router.post('/revenuecat-webhook', revenuecatWebhook);

router.post('/subscribe', authMiddleware, subscribe);
router.post('/one-time', authMiddleware, oneTime);

module.exports = router;
