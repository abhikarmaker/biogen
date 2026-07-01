jest.mock('../services/supabaseService', () => {
  const { createSupabaseMock } = require('./utils/supabaseMock');
  return createSupabaseMock();
});
jest.mock('../services/stripeService', () => ({
  stripe: {},
  getOrCreateCustomer: jest.fn(),
  createSubscription: jest.fn(),
  createOneTimePaymentIntent: jest.fn(),
  cancelSubscription: jest.fn(),
  constructWebhookEvent: jest.fn(),
}));

const request = require('supertest');
const app = require('../server');
const supabase = require('../services/supabaseService');
const { constructWebhookEvent } = require('../services/stripeService');

afterEach(() => {
  supabase.__reset();
  constructWebhookEvent.mockReset();
});

describe('POST /api/payments/webhook', () => {
  it('rejects an invalid Stripe signature', async () => {
    constructWebhookEvent.mockImplementation(() => {
      throw new Error('signature mismatch');
    });

    const res = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 'bad-sig')
      .send({});

    expect(res.status).toBe(400);
  });

  it('upgrades the user to pro on an active subscription event', async () => {
    constructWebhookEvent.mockReturnValue({
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_1',
          status: 'active',
          customer: 'cus_1',
          current_period_end: 1893456000,
        },
      },
    });
    supabase.__push({ data: { id: 'u1' }, error: null }); // getUserByCustomer lookup

    const res = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 'sig')
      .send({});

    expect(res.status).toBe(200);
    expect(supabase.update).toHaveBeenCalledWith({ plan: 'pro' });
  });

  it('downgrades the user to free when the subscription is deleted', async () => {
    constructWebhookEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { customer: 'cus_1' } },
    });

    const res = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 'sig')
      .send({});

    expect(res.status).toBe(200);
    expect(supabase.update).toHaveBeenCalledWith({ plan: 'free' });
  });
});
