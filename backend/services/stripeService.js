const Stripe = require('stripe');

let _stripe = null;
function getStripe() {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) return null;
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-09-30.acacia' });
  }
  return _stripe;
}
// Keep `stripe` as a getter-backed proxy so existing callers still work
const stripe = new Proxy({}, { get: (_, prop) => getStripe()?.[prop] });

const PRICES = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID,  // $4.99/mo with 3-day trial
  lifetime: process.env.STRIPE_LIFETIME_PRICE_ID, // $9.99 one-time
};

async function getOrCreateCustomer(email, userId) {
  const existing = await stripe.customers.search({
    query: `email:'${email}' AND metadata['userId']:'${userId}'`,
    limit: 1,
  });

  if (existing.data.length > 0) return existing.data[0];

  return stripe.customers.create({
    email,
    metadata: { userId },
  });
}

async function createSubscription(customerId) {
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: PRICES.monthly }],
    trial_period_days: 3,
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  });
}

async function createOneTimePaymentIntent(customerId) {
  return stripe.paymentIntents.create({
    amount: 999, // $9.99
    currency: 'usd',
    customer: customerId,
    metadata: { product: 'lifetime' },
  });
}

async function cancelSubscription(stripeSubId) {
  return stripe.subscriptions.cancel(stripeSubId);
}

function constructWebhookEvent(rawBody, sig) {
  return stripe.webhooks.constructEvent(
    rawBody,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}

module.exports = {
  stripe,
  getOrCreateCustomer,
  createSubscription,
  createOneTimePaymentIntent,
  cancelSubscription,
  constructWebhookEvent,
};
