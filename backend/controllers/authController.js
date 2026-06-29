const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../services/supabaseService');

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '90d' });
}

async function register(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (existing) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      plan: 'free',
      bio_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('[register]', error);
    return res.status(500).json({ error: 'Failed to create account' });
  }

  const token = signToken(user.id);
  return res.status(201).json({ token, user: sanitizeUser(user) });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken(user.id);
  return res.json({ token, user: sanitizeUser(user) });
}

async function loginWithGoogle(req, res) {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ error: 'accessToken is required' });

  try {
    const gRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const info = await gRes.json();

    if (info.error || !info.email) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const email = info.email.toLowerCase();
    const user = await findOrCreateOAuthUser(email, 'google', info.sub);
    const token = signToken(user.id);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('[google-auth]', err);
    return res.status(500).json({ error: 'Google authentication failed' });
  }
}

async function loginWithApple(req, res) {
  const { identityToken, email: credentialEmail, fullName } = req.body;
  if (!identityToken) return res.status(400).json({ error: 'identityToken is required' });

  try {
    // Decode Apple JWT to extract claims (sub = stable Apple user ID, email)
    const payload = JSON.parse(Buffer.from(identityToken.split('.')[1], 'base64url').toString());
    const sub = payload.sub;
    const email = (credentialEmail || payload.email)?.toLowerCase();

    if (!email) return res.status(400).json({ error: 'Email is required for first Apple sign-in' });

    const user = await findOrCreateOAuthUser(email, 'apple', sub);
    const token = signToken(user.id);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('[apple-auth]', err);
    return res.status(500).json({ error: 'Apple authentication failed' });
  }
}

async function findOrCreateOAuthUser(email, provider, oauthId) {
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (existing) return existing;

  const { data: newUser, error } = await supabase
    .from('users')
    .insert({ email, plan: 'free', bio_count: 0 })
    .select()
    .single();

  if (error) throw new Error('Failed to create account');
  return newUser;
}

function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

module.exports = { register, login, loginWithGoogle, loginWithApple };
