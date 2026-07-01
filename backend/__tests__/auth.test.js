jest.mock('../services/supabaseService', () => {
  const { createSupabaseMock } = require('./utils/supabaseMock');
  return createSupabaseMock();
});

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../server');
const supabase = require('../services/supabaseService');

afterEach(() => supabase.__reset());

describe('POST /api/auth/register', () => {
  it('rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  it('rejects passwords under 6 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: '123' });
    expect(res.status).toBe(400);
  });

  it('rejects a duplicate email', async () => {
    supabase.__push({ data: { id: 'existing-id' }, error: null });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: 'password1' });
    expect(res.status).toBe(409);
  });

  it('creates a user and returns a token without the password hash', async () => {
    supabase.__push({ data: null, error: null }); // no existing user
    supabase.__push({
      data: { id: 'new-id', email: 'a@b.com', plan: 'free', bio_count: 0, password_hash: 'hashed' },
      error: null,
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: 'password1' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.password_hash).toBeUndefined();
  });
});

describe('POST /api/auth/login', () => {
  it('rejects an unknown email', async () => {
    supabase.__push({ data: null, error: { message: 'not found' } });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nope@b.com', password: 'password1' });
    expect(res.status).toBe(401);
  });

  it('rejects the wrong password', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    supabase.__push({ data: { id: 'u1', email: 'a@b.com', password_hash: passwordHash }, error: null });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('logs in with correct credentials', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    supabase.__push({
      data: { id: 'u1', email: 'a@b.com', password_hash: passwordHash, plan: 'free' },
      error: null,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'correct-password' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });
});
