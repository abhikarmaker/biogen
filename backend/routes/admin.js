const { Router } = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const supabase = require('../services/supabaseService');
const { adminMiddleware } = require('../middleware/authMiddleware');

const router = Router();

// ── Auth ──────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const isEmail = email.trim().toLowerCase() === process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const isPass = process.env.ADMIN_PASSWORD_HASH
    ? await bcrypt.compare(password.trim(), process.env.ADMIN_PASSWORD_HASH).catch(() => false)
    : password.trim() === process.env.ADMIN_PASSWORD?.trim();

  if (!isEmail || !isPass) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  const token = jwt.sign({ role: 'admin', email }, process.env.JWT_SECRET, {
    expiresIn: '12h',
  });
  return res.json({ token });
});

// ── Overview metrics ───────────────────────────────────
router.get('/overview', adminMiddleware, async (req, res) => {
  const [users, bios, subs, todayBios] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('bios').select('id', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase
      .from('bios')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  ]);

  return res.json({
    totalUsers: users.count || 0,
    totalBios: bios.count || 0,
    activeSubscribers: subs.count || 0,
    biosToday: todayBios.count || 0,
  });
});

// ── Users ──────────────────────────────────────────────
router.get('/users', adminMiddleware, async (req, res) => {
  const { search, plan, limit = 50, offset = 0 } = req.query;

  let query = supabase
    .from('users')
    .select('id, email, plan, bio_count, created_at, last_active_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (search) query = query.ilike('email', `%${search}%`);
  if (plan) query = query.eq('plan', plan);

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ users: data, total: count });
});

router.put('/users/:id/plan', adminMiddleware, async (req, res) => {
  const { plan } = req.body;
  if (!['free', 'pro'].includes(plan)) {
    return res.status(400).json({ error: 'Plan must be free or pro' });
  }

  const { error } = await supabase
    .from('users')
    .update({ plan })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

router.delete('/users/:id', adminMiddleware, async (req, res) => {
  const { error } = await supabase.from('users').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

// ── Bios ───────────────────────────────────────────────
router.get('/bios', adminMiddleware, async (req, res) => {
  const { platform, from, to, limit = 50, offset = 0 } = req.query;

  let query = supabase
    .from('bios')
    .select('id, user_id, platform, tone, length, content, created_at, users(email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (platform) query = query.eq('platform', platform);
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ bios: data, total: count });
});

router.delete('/bios/:id', adminMiddleware, async (req, res) => {
  const { error } = await supabase.from('bios').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

// ── Settings ───────────────────────────────────────────
router.get('/settings', adminMiddleware, async (req, res) => {
  const { data } = await supabase.from('settings').select('*');
  const map = Object.fromEntries((data || []).map((s) => [s.key, s.value]));
  return res.json(map);
});

router.put('/settings', adminMiddleware, async (req, res) => {
  const updates = req.body; // { key: value }

  const rows = Object.entries(updates).map(([key, value]) => ({ key, value: String(value) }));
  const { error } = await supabase
    .from('settings')
    .upsert(rows, { onConflict: 'key' });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

// ── Error logs ─────────────────────────────────────────
router.get('/errors', adminMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('error_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ errors: data });
});

module.exports = router;
