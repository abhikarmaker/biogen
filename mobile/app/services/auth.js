import axios from 'axios';
import { saveToken, saveUser, clearAll } from './storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const authApi = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

const DUMMY_USER = {
  id: 'dummy-001',
  email: 'demo@biogen.app',
  plan: 'pro',
  bio_count: 0,
  free_limit: 3,
};

// Token used when backend is unreachable — signals "local session only"
const LOCAL_TOKEN = 'local-session';

function mockUser(email) {
  if (email === DUMMY_USER.email) return DUMMY_USER;
  return {
    id: 'local-' + Date.now(),
    email,
    plan: 'free',
    bio_count: 0,
    free_limit: 3,
  };
}

export const register = async (email, password) => {
  try {
    const res = await authApi.post('/api/auth/register', { email, password });
    const { token, user } = res.data;
    await saveToken(token);
    await saveUser(user);
    return user;
  } catch (err) {
    // Re-throw server errors (4xx) — only fall back on network/timeout errors
    if (err.response) throw err;
    const user = mockUser(email);
    await saveToken(LOCAL_TOKEN);
    await saveUser(user);
    return user;
  }
};

export const login = async (email, password) => {
  try {
    const res = await authApi.post('/api/auth/login', { email, password });
    const { token, user } = res.data;
    await saveToken(token);
    await saveUser(user);
    return user;
  } catch (err) {
    // Re-throw server errors (4xx) — only fall back on network/timeout errors
    if (err.response) throw err;
    const user = mockUser(email);
    await saveToken(LOCAL_TOKEN);
    await saveUser(user);
    return user;
  }
};

export const logout = async () => {
  await clearAll();
};
