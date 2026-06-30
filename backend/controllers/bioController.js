const supabase = require('../services/supabaseService');
const { generateBio: callGemini } = require('../services/geminiService');

// Template fallback — mirrors mobile mock, used when Gemini is unavailable
function buildTemplateBio({ platform, role, interests, tone, length }) {
  const CHAR_LIMITS = {
    linkedin: 2600, instagram: 150, twitter: 160, threads: 150, hinge: 300, bumble: 300, tinder: 500,
    okcupid: 500, cmb: 280, pof: 500, happn: 150,
    tiktok: 80, youtube: 1000, github: 160, discord: 190, reddit: 200, substack: 280,
    medium: 160, patreon: 250, fiverr: 600, facebook: 101, snapchat: 150, pinterest: 160,
    telegram: 255, whatsapp: 139, mastodon: 500, bereal: 100, spotify: 1500, twitch: 300,
  };
  const limit = CHAR_LIMITS[platform] || 300;

  const interestList = interests.split(/[,.\n]+/).map((s) => s.trim()).filter(Boolean);
  const first = interestList[0] || interests;
  const others = interestList.slice(1, 3).join(' and ');

  const templates = {
    linkedin: {
      Friendly: `${role} who genuinely loves what I do. Outside of work you'll find me ${first}${others ? ` and ${others}` : ''}. I believe the best work happens when people actually care.`,
      Professional: `${role}. I bring focus and clarity to complex challenges. Passionate about ${first}${others ? ` and ${others}` : ''}. Open to connecting with people doing interesting work.`,
      Witty: `${role} by day — ${first} enthusiast by night. I take my work seriously but not myself.${others ? ` Also into ${others}.` : ''}`,
      Bold: `${role}. I don't do average. Driven by ${first}${others ? ` and ${others}` : ''}. If you're building something ambitious, let's talk.`,
      Minimal: `${role}. Into ${interestList.slice(0, 2).join(', ')}. Always learning.`,
    },
    instagram: {
      Friendly: `${role} ✨ Obsessed with ${first}${others ? ` + ${others}` : ''} 🌿`,
      Professional: `${role} | ${first}${others ? ` | ${others}` : ''}`,
      Witty: `${role} 🤙 ${first} fanatic${others ? ` & occasional ${others} person` : ''}`,
      Bold: `${role}. ${first.toUpperCase()}.${others ? ` Also ${others}.` : ''}`,
      Minimal: `${role} · ${first}`,
    },
    twitter: {
      Friendly: `${role}. Big fan of ${first}${others ? ` and ${others}` : ''}. Tweeting about things I find interesting.`,
      Professional: `${role} | Thoughts on ${first}${others ? ` & ${others}` : ''} | Views my own`,
      Witty: `${role}. Professionally into ${first}${others ? `, accidentally into ${others}` : ''}. Tweets are chaotic good.`,
      Bold: `${role}. ${first} obsessive.${others ? ` ${others} too.` : ''} Unfiltered takes daily.`,
      Minimal: `${role}. ${first}.`,
    },
    hinge: {
      Friendly: `${role} who also happens to love ${first}${others ? ` and ${others}` : ''}. I'm better in person than on paper — ask me anything.`,
      Professional: `${role} with a soft spot for ${first}.${others ? ` Also really into ${others}.` : ''} Looking for someone curious about the world.`,
      Witty: `${role} by day, ${first} enthusiast by night.${others ? ` Deeply committed to ${others} as well.` : ''} Fluent in sarcasm, terrible at goodbyes.`,
      Bold: `${role}. I'm into ${first}${others ? ` and ${others}` : ''}. I know what I want — do you?`,
      Minimal: `${role}. Love ${first}. Let's skip the small talk.`,
    },
    bumble: {
      Friendly: `${role} with a love for ${first}${others ? ` and ${others}` : ''}. I always have a restaurant recommendation ready. Let's find out if we vibe.`,
      Professional: `${role}. Passionate about ${first}${others ? ` and ${others}` : ''}. Looking for someone who matches my energy.`,
      Witty: `${role} who takes ${first} way too seriously.${others ? ` Also weirdly good at ${others}.` : ''} Swipe right if you can keep up.`,
      Bold: `${role}. ${first} is my love language.${others ? ` So is ${others}.` : ''} Make the first move worth it.`,
      Minimal: `${role}. ${first}. Good vibes only.`,
    },
    tiktok: {
      Friendly: `${role} | ${first} lover 🎉`,
      Professional: `${role} · ${first}`,
      Witty: `${role} obsessed with ${first} 😅`,
      Bold: `${role}. ${first}. No filter.`,
      Minimal: `${role} · ${first}`,
    },
  };

  const tpl = (templates[platform] || templates.instagram)[tone] || Object.values(templates[platform] || templates.instagram)[0];
  return tpl.length > limit ? tpl.slice(0, limit).trimEnd() : tpl;
}

async function generate(req, res) {
  const { platform, role, interests, tone, length } = req.body;

  if (!platform || !role || !interests || !tone || !length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let bioContent;
  let usedFallback = false;

  try {
    bioContent = await callGemini({ platform, role, interests, tone, length });
  } catch (err) {
    console.error('[gemini]', err.message);
    // Log error but continue with template fallback — don't fail the request
    await supabase.from('error_logs').insert({
      user_id: req.user.id,
      type: 'gemini_error',
      message: err.message,
      endpoint: '/api/bio/generate',
    }).catch(() => {});

    bioContent = buildTemplateBio({ platform, role, interests, tone, length });
    usedFallback = true;
  }

  const { data: savedBio, error: saveError } = await supabase
    .from('bios')
    .insert({ user_id: req.user.id, platform, content: bioContent, tone, length, role, interests })
    .select()
    .single();

  if (saveError) {
    console.error('[save bio]', saveError);
    return res.status(500).json({ error: 'Failed to save bio' });
  }

  await supabase.rpc('increment_bio_count', { user_id: req.user.id });

  return res.json({ bio: savedBio, fallback: usedFallback });
}

async function getHistory(req, res) {
  const { data: bios, error } = await supabase
    .from('bios')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Failed to fetch bios' });
  return res.json({ bios });
}

async function deleteBio(req, res) {
  const { id } = req.params;
  const { error } = await supabase
    .from('bios')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: 'Failed to delete bio' });
  return res.json({ success: true });
}

module.exports = { generate, getHistory, deleteBio };
