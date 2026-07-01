const supabase = require('../services/supabaseService');
const { verifyWebhookAuth } = require('../services/revenuecatService');

const GRANTS_ENTITLEMENT = ['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION'];
// CANCELLATION alone does NOT revoke access — the user keeps their entitlement
// until the current period ends, which is when EXPIRATION actually fires.
const REVOKES_ENTITLEMENT = ['EXPIRATION'];

async function webhook(req, res) {
  if (!verifyWebhookAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const event = req.body?.event;
  if (!event?.app_user_id) {
    return res.status(400).json({ error: 'Malformed payload' });
  }

  // app_user_id is our own users.id — mobile configures RevenueCat with the
  // real backend user id directly, so no separate mapping is needed.
  if (GRANTS_ENTITLEMENT.includes(event.type)) {
    await supabase.from('users').update({ plan: 'pro' }).eq('id', event.app_user_id);
  } else if (REVOKES_ENTITLEMENT.includes(event.type)) {
    await supabase.from('users').update({ plan: 'free' }).eq('id', event.app_user_id);
  }

  return res.json({ received: true });
}

module.exports = { webhook };
