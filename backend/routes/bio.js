const { Router } = require('express');
const { generate, getHistory, deleteBio } = require('../controllers/bioController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { planMiddleware } = require('../middleware/planMiddleware');

const router = Router();

router.post('/generate', authMiddleware, planMiddleware, generate);
router.get('/history', authMiddleware, getHistory);
router.delete('/:id', authMiddleware, deleteBio);

module.exports = router;
