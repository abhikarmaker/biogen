const crypto = require('crypto');

// RevenueCat webhooks authenticate via a static Authorization header value
// (configured in the RevenueCat dashboard), not HMAC signing like Stripe.
function verifyWebhookAuth(req) {
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH_HEADER;
  const received = req.headers['authorization'];
  if (!expected || !received) return false;

  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(received);
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

module.exports = { verifyWebhookAuth };
