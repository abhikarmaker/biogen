const { Router } = require('express');
const { register, login, loginWithGoogle, loginWithApple } = require('../controllers/authController');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', loginWithGoogle);
router.post('/apple', loginWithApple);

module.exports = router;
