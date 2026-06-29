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

// Google OAuth uses a backend-mediated redirect flow because Expo Go's
// redirect URI (exp://...) is rejected by Google for web-application clients.
// Mobile opens googleOAuthStart in a browser; Google redirects to
// googleOAuthCallback on our server, which then redirects back into the app.
function googleOAuthStart(req, res) {
  const { redirect_uri } = req.query;
  if (!redirect_uri) return res.status(400).send('Missing redirect_uri');
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.BACKEND_URL) {
    return res.status(500).send('Google sign-in is not configured on the server');
  }

  const callbackUrl = `${process.env.BACKEND_URL}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    state: redirect_uri,
    prompt: 'select_account',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

async function googleOAuthCallback(req, res) {
  const { code, state, error: googleError } = req.query;
  if (!state) return res.status(400).send('Missing state');
  if (googleError) return res.redirect(`${state}?error=${encodeURIComponent(googleError)}`);
  if (!code) return res.redirect(`${state}?error=missing_code`);

  try {
    const callbackUrl = `${process.env.BACKEND_URL}/api/auth/google/callback`;
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      return res.redirect(`${state}?error=${encodeURIComponent(tokenData.error)}`);
    }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const info = await userRes.json();
    if (!info.email) return res.redirect(`${state}?error=no_email`);

    const user = await findOrCreateOAuthUser(info.email.toLowerCase(), 'google', info.sub);
    const token = signToken(user.id);
    return res.redirect(`${state}?token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error('[google-oauth-callback]', err);
    return res.redirect(`${state}?error=server_error`);
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

module.exports = { register, login, googleOAuthStart, googleOAuthCallback, loginWithApple };
