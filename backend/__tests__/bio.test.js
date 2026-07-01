jest.mock('../services/supabaseService', () => {
  const { createSupabaseMock } = require('./utils/supabaseMock');
  return createSupabaseMock();
});
jest.mock('../services/geminiService', () => ({
  generateBio: jest.fn(),
  generateIcebreakers: jest.fn(),
  extractBioFromImages: jest.fn(),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const supabase = require('../services/supabaseService');
const geminiService = require('../services/geminiService');

const authHeader = `Bearer ${jwt.sign({ userId: 'u1' }, process.env.JWT_SECRET)}`;

// Pro plan skips the free-tier quota lookup in planMiddleware, keeping these
// tests focused on bioController behavior rather than plan-limit bookkeeping.
function pushAuthenticatedUser() {
  supabase.__push({ data: { id: 'u1', email: 'a@b.com', plan: 'pro', bio_count: 0 }, error: null });
}

afterEach(() => {
  supabase.__reset();
  geminiService.generateBio.mockReset();
});

describe('POST /api/bio/generate', () => {
  const validBody = {
    platform: 'linkedin',
    role: 'a software engineer',
    interests: 'climbing, cooking',
    tone: 'Friendly',
    length: 'Medium',
  };

  it('rejects requests without a token', async () => {
    const res = await request(app).post('/api/bio/generate').send(validBody);
    expect(res.status).toBe(401);
  });

  it('rejects missing fields', async () => {
    pushAuthenticatedUser();
    const res = await request(app)
      .post('/api/bio/generate')
      .set('Authorization', authHeader)
      .send({ platform: 'linkedin' });
    expect(res.status).toBe(400);
  });

  it('returns a Gemini-generated bio when Gemini succeeds', async () => {
    pushAuthenticatedUser();
    geminiService.generateBio.mockResolvedValue('A great bio from Gemini.');
    supabase.__push({ data: { id: 'bio1', content: 'A great bio from Gemini.' }, error: null });

    const res = await request(app)
      .post('/api/bio/generate')
      .set('Authorization', authHeader)
      .send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.fallback).toBe(false);
  });

  it('falls back to the local template when Gemini fails', async () => {
    pushAuthenticatedUser();
    geminiService.generateBio.mockRejectedValue(new Error('gemini unavailable'));
    supabase.__push({ data: { id: 'bio2', content: 'template bio' }, error: null });

    const res = await request(app)
      .post('/api/bio/generate')
      .set('Authorization', authHeader)
      .send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.fallback).toBe(true);
  });
});
