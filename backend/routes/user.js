const { Router } = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const supabase = require('../services/supabaseService');

const router = Router();

router.get('/profile', authMiddleware, async (req, res) => {
  const { password_hash, ...user } = req.user;

  // Attach active subscription info
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, expires_at')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .order('expires_at', { ascending: false })
    .limit(1)
    .single();

  return res.json({ ...user, subscription: sub || null });
});

router.post('/restore', authMiddleware, async (req, res) => {
  const { stripe_customer_id } = req.user;

  if (!stripe_customer_id) {
    return res.status(404).json({ error: 'No purchases found for this account' });
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', req.user.id)
    .in('status', ['active', 'trialing'])
    .limit(1)
    .single();

  if (!sub) {
    return res.status(404).json({ error: 'No active subscription found' });
  }

  await supabase
    .from('users')
    .update({ plan: 'pro' })
    .eq('id', req.user.id);

  return res.json({ success: true, plan: 'pro' });
});

module.exports = router;
