const { Router } = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const supabase = require('../services/supabaseService');
const { adminMiddleware } = require('../middleware/authMiddleware');

const router = Router();

// ── Helpers ────────────────────────────────────────────
function groupByDay(records, field = 'created_at', daysBack = 30) {
  const map = {};
  for (const r of records) {
    const day = r[field].slice(0, 10);
    map[day] = (map[day] || 0) + 1;
  }
  const result = [];
  const now = new Date();
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: map[key] || 0 });
  }
  return result;
}

function groupByField(records, field) {
  const map = {};
  for (const r of records) {
    const v = r[field];
    if (v) map[v] = (map[v] || 0) + 1;
  }
  return Object.entries(map)
    .map(([k, count]) => ({ [field]: k, count }))
    .sort((a, b) => b.count - a.count);
}

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

  const token = jwt.sign({ role: 'admin', email }, process.env.JWT_SECRET, { expiresIn: '12h' });
  return res.json({ token });
});

// ── Overview (enriched) ────────────────────────────────
router.get('/overview', adminMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date(now); monthAgo.setDate(now.getDate() - 30);
    const todayISO = todayStart.toISOString();
    const weekISO = weekAgo.toISOString();
    const monthISO = monthAgo.toISOString();

    const settled = await Promise.allSettled([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('plan', 'free'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('plan', 'pro'),
      supabase.from('bios').select('id', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('bios').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
      supabase.from('bios').select('id', { count: 'exact', head: true }).gte('created_at', weekISO),
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', weekISO),
      supabase.from('users').select('id, email, plan, created_at').order('created_at', { ascending: false }).limit(6),
      supabase.from('bios').select('id, platform, tone, created_at, users(email)').order('created_at', { ascending: false }).limit(6),
      supabase.from('bios').select('platform').gte('created_at', monthISO),
      supabase.from('bios').select('tone').gte('created_at', monthISO),
      supabase.from('users').select('created_at').gte('created_at', monthISO),
      supabase.from('bios').select('created_at').gte('created_at', monthISO),
      supabase.from('subscriptions').select('id, status, created_at, expires_at, users(email)').order('created_at', { ascending: false }).limit(20),
    ]);

    // Safely extract each result — a failed query (e.g. table doesn't exist yet) returns a fallback
    const val = (i, fallback) =>
      settled[i].status === 'fulfilled' ? settled[i].value : fallback;

    const [
      totalUsersRes, freeUsersRes, proUsersRes,
      totalBiosRes, activeSubsRes,
      biosTodayRes, biosWeekRes,
      newUsersTodayRes, newUsersWeekRes,
      recentUsersRes, recentBiosRes,
      platformBiosRes, toneBiosRes,
      signupTrendRes, bioTrendRes,
      subsRes,
    ] = [
      val(0,  { count: 0 }),
      val(1,  { count: 0 }),
      val(2,  { count: 0 }),
      val(3,  { count: 0 }),
      val(4,  { count: 0 }),
      val(5,  { count: 0 }),
      val(6,  { count: 0 }),
      val(7,  { count: 0 }),
      val(8,  { count: 0 }),
      val(9,  { data: [] }),
      val(10, { data: [] }),
      val(11, { data: [] }),
      val(12, { data: [] }),
      val(13, { data: [] }),
      val(14, { data: [] }),
      val(15, { data: [] }),
    ];

    const totalUsers = totalUsersRes.count || 0;
    const proUsers = proUsersRes.count || 0;
    const totalBios = totalBiosRes.count || 0;

    return res.json({
      // Core counts
      totalUsers,
      freeUsers: freeUsersRes.count || 0,
      proUsers,
      totalBios,
      activeSubscribers: activeSubsRes.count || 0,
      biosToday: biosTodayRes.count || 0,
      biosThisWeek: biosWeekRes.count || 0,
      newUsersToday: newUsersTodayRes.count || 0,
      newUsersThisWeek: newUsersWeekRes.count || 0,
      // Computed
      avgBiosPerUser: totalUsers > 0 ? (totalBios / totalUsers).toFixed(1) : '0',
      conversionRate: totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : '0',
      // Breakdowns (last 30 days)
      platformBreakdown: groupByField(platformBiosRes.data || [], 'platform').slice(0, 10),
      toneBreakdown: groupByField(toneBiosRes.data || [], 'tone'),
      // Daily trends (last 30 days)
      signupsTrend: groupByDay(signupTrendRes.data || []),
      biosTrend: groupByDay(bioTrendRes.data || []),
      // Recent activity
      recentUsers: recentUsersRes.data || [],
      recentBios: recentBiosRes.data || [],
      // Subscriptions
      recentSubscriptions: subsRes.data || [],
    });
  } catch (err) {
    console.error('[admin-overview]', err);
    return res.status(500).json({ error: err.message });
  }
});

// ── Users ──────────────────────────────────────────────
router.get('/users', adminMiddleware, async (req, res) => {
  const { search, plan, limit = 50, offset = 0 } = req.query;

  let query = supabase
    .from('users')
    .select('id, email, plan, bio_count, created_at', { count: 'exact' })
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
  const { error } = await supabase.from('users').update({ plan }).eq('id', req.params.id);
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
  const rows = Object.entries(req.body).map(([key, value]) => ({ key, value: String(value) }));
  const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' });
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
  // error_logs table may not exist yet — return empty array rather than 500
  if (error) return res.json({ errors: [] });
  return res.json({ errors: data || [] });
});

module.exports = router;
