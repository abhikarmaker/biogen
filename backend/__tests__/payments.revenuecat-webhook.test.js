jest.mock('../services/supabaseService', () => {
  const { createSupabaseMock } = require('./utils/supabaseMock');
  return createSupabaseMock();
});

const request = require('supertest');
const app = require('../server');
const supabase = require('../services/supabaseService');

const AUTH_HEADER = 'test-revenuecat-secret';

beforeAll(() => {
  process.env.REVENUECAT_WEBHOOK_AUTH_HEADER = AUTH_HEADER;
});

afterEach(() => supabase.__reset());

describe('POST /api/payments/revenuecat-webhook', () => {
  it('rejects a missing Authorization header', async () => {
    const res = await request(app)
      .post('/api/payments/revenuecat-webhook')
      .send({ event: { type: 'INITIAL_PURCHASE', app_user_id: 'u1' } });

    expect(res.status).toBe(401);
  });

  it('rejects a wrong Authorization header', async () => {
    const res = await request(app)
      .post('/api/payments/revenuecat-webhook')
      .set('Authorization', 'wrong-secret')
      .send({ event: { type: 'INITIAL_PURCHASE', app_user_id: 'u1' } });

    expect(res.status).toBe(401);
  });

  it('upgrades the user to pro on INITIAL_PURCHASE', async () => {
    const res = await request(app)
      .post('/api/payments/revenuecat-webhook')
      .set('Authorization', AUTH_HEADER)
      .send({ event: { type: 'INITIAL_PURCHASE', app_user_id: 'u1' } });

    expect(res.status).toBe(200);
    expect(supabase.update).toHaveBeenCalledWith({ plan: 'pro' });
    expect(supabase.eq).toHaveBeenCalledWith('id', 'u1');
  });

  it('downgrades the user to free on EXPIRATION', async () => {
    const res = await request(app)
      .post('/api/payments/revenuecat-webhook')
      .set('Authorization', AUTH_HEADER)
      .send({ event: { type: 'EXPIRATION', app_user_id: 'u1' } });

    expect(res.status).toBe(200);
    expect(supabase.update).toHaveBeenCalledWith({ plan: 'free' });
  });

  it('does not downgrade on CANCELLATION alone', async () => {
    const res = await request(app)
      .post('/api/payments/revenuecat-webhook')
      .set('Authorization', AUTH_HEADER)
      .send({ event: { type: 'CANCELLATION', app_user_id: 'u1' } });

    expect(res.status).toBe(200);
    expect(supabase.update).not.toHaveBeenCalled();
  });

  it('rejects a malformed payload', async () => {
    const res = await request(app)
      .post('/api/payments/revenuecat-webhook')
      .set('Authorization', AUTH_HEADER)
      .send({ event: {} });

    expect(res.status).toBe(400);
  });
});
