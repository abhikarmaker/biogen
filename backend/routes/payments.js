const { Router } = require('express');
const { subscribe, oneTime, webhook } = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = Router();

// webhook must come before express.json — raw body already set in server.js
router.post('/webhook', webhook);

router.post('/subscribe', authMiddleware, subscribe);
router.post('/one-time', authMiddleware, oneTime);

module.exports = router;
