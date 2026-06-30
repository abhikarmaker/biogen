const { Router } = require('express');
const { generate, getHistory, deleteIcebreaker, extractBio } = require('../controllers/icebreakerController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = Router();

router.post('/generate', authMiddleware, generate);
router.post('/extract-bio', authMiddleware, extractBio);
router.get('/history', authMiddleware, getHistory);
router.delete('/:id', authMiddleware, deleteIcebreaker);

module.exports = router;
