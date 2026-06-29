const supabase = require('../services/supabaseService');
const {
  getOrCreateCustomer,
  createSubscription,
  createOneTimePaymentIntent,
  constructWebhookEvent,
} = require('../services/stripeService');

async function subscribe(req, res) {
  const user = req.user;

  try {
    const customer = await getOrCreateCustomer(user.email, user.id);

    // Save customer ID if new
    if (!user.stripe_customer_id) {
      await supabase
        .from('users')
        .update({ stripe_customer_id: customer.id })
        .eq('id', user.id);
    }

    const subscription = await createSubscription(customer.id);
    const paymentIntent = subscription.latest_invoice?.payment_intent;

    return res.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret,
      status: subscription.status,
    });
  } catch (err) {
    console.error('[subscribe]', err.message);
    return res.status(500).json({ error: err.message });
  }
}

async function oneTime(req, res) {
  const user = req.user;

  try {
    const customer = await getOrCreateCustomer(user.email, user.id);
    const intent = await createOneTimePaymentIntent(customer.id);

    return res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error('[oneTime]', err.message);
    return res.status(500).json({ error: err.message });
  }
}

async function webhook(req, res) {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = constructWebhookEvent(req.body, sig);
  } catch (err) {
    console.error('[webhook] signature error:', err.message);
    await supabase.from('error_logs').insert({
      type: 'stripe_webhook_error',
      message: err.message,
    }).catch(() => {});
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const isActive = ['active', 'trialing'].includes(sub.status);
      await supabase
        .from('users')
        .update({ plan: isActive ? 'pro' : 'free' })
        .eq('stripe_customer_id', sub.customer);

      await supabase.from('subscriptions').upsert({
        stripe_sub_id: sub.id,
        user_id: (await getUserByCustomer(sub.customer))?.id,
        status: sub.status,
        expires_at: new Date(sub.current_period_end * 1000).toISOString(),
      }, { onConflict: 'stripe_sub_id' });
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      await supabase
        .from('users')
        .update({ plan: 'free' })
        .eq('stripe_customer_id', sub.customer);
      break;
    }

    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      if (pi.metadata?.product === 'lifetime') {
        await supabase
          .from('users')
          .update({ plan: 'pro' })
          .eq('stripe_customer_id', pi.customer);
      }
      break;
    }
  }

  return res.json({ received: true });
}

async function getUserByCustomer(customerId) {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();
  return data;
}

module.exports = { subscribe, oneTime, webhook };
