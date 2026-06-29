const { Router } = require('express');
const { register, login, googleOAuthStart, googleOAuthCallback, loginWithApple } = require('../controllers/authController');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/google/start', googleOAuthStart);
router.get('/google/callback', googleOAuthCallback);
router.post('/apple', loginWithApple);

module.exports = router;
