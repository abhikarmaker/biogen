const supabase = require('../services/supabaseService');

const RESET_HOURS = 12;
const RESET_MS = RESET_HOURS * 60 * 60 * 1000;

async function getFreeLimit() {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'free_bio_limit')
    .single();
  return parseInt(data?.value || '3', 10);
}

async function planMiddleware(req, res, next) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthenticated' });

  if (user.plan === 'pro') return next();

  const now = Date.now();
  const resetAt = user.bio_count_reset_at ? new Date(user.bio_count_reset_at).getTime() : null;
  const windowExpired = !resetAt || (now - resetAt) >= RESET_MS;

  // Reset counter if 12-hour window has passed
  if (windowExpired && (user.bio_count || 0) > 0) {
    await supabase
      .from('users')
      .update({ bio_count: 0, bio_count_reset_at: new Date().toISOString() })
      .eq('id', user.id);
    user.bio_count = 0;
    user.bio_count_reset_at = new Date().toISOString();
  }

  // Start the window on first bio
  if (!resetAt) {
    user.bio_count_reset_at = new Date().toISOString();
  }

  const limit = await getFreeLimit();

  if ((user.bio_count || 0) >= limit) {
    const resetsAt = new Date((resetAt || now) + RESET_MS);
    return res.status(403).json({
      error: 'Free bio limit reached. Upgrade to Pro or wait for your quota to reset.',
      code: 'FREE_LIMIT_REACHED',
      limit,
      used: user.bio_count,
      resetsAt: resetsAt.toISOString(),
    });
  }

  next();
}

module.exports = { planMiddleware };
