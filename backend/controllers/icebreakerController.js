const supabase = require('../services/supabaseService');
const { generateIcebreakers: callGemini, extractBioFromImages } = require('../services/geminiService');

const TONES = ['Playful', 'Witty', 'Direct', 'Charming', 'Curious'];
const MAX_BIO_LENGTH = 1000;
const MAX_IMAGES = 5;

// Template fallback — used when Gemini is unavailable
function buildTemplateIcebreakers({ matchBio, tone, reference }) {
  const topic = (reference || matchBio.split(/[,.\n!?]+/).map((s) => s.trim()).filter(Boolean)[0] || 'your bio').slice(0, 80);

  const templates = {
    Playful: [
      `Okay I have to ask — what's the story behind "${topic}"? I have a feeling it's a good one.`,
      `"${topic}" just earned you a swipe right and a follow-up question. Explain yourself.`,
      `Plot twist: I'm now mildly obsessed with "${topic}". Tell me everything.`,
    ],
    Witty: [
      `"${topic}" — bold choice to put in a dating bio. I respect it. Tell me more.`,
      `I was going to open with something clever, but "${topic}" already did the work for me.`,
      `Unpopular opinion: anyone who mentions "${topic}" deserves a real conversation, not a "hey".`,
    ],
    Direct: [
      `"${topic}" caught my attention — what got you into that?`,
      `I don't usually message first, but "${topic}" changed my mind. What's the story there?`,
      `Skipping the small talk: tell me about "${topic}".`,
    ],
    Charming: [
      `There's something about "${topic}" that made me smile — I'd love to hear more about it.`,
      `Your mention of "${topic}" stood out to me. What drew you to it?`,
      `I have a feeling "${topic}" says a lot about you — care to elaborate?`,
    ],
    Curious: [
      `What's the story behind "${topic}"? I'm genuinely curious.`,
      `I want to know more about "${topic}" — how did that come about?`,
      `"${topic}" raised a few questions for me. Mind if I ask?`,
    ],
  };

  return (templates[tone] || templates.Playful).slice(0, 3);
}

function gateOpeners(openers, isPro) {
  return openers.map((text, i) => {
    if (i === 2 && !isPro) {
      return { text: null, locked: true };
    }
    return { text, locked: false };
  });
}

async function generate(req, res) {
  const { matchBio, tone, reference } = req.body;

  if (!matchBio || !tone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!TONES.includes(tone)) {
    return res.status(400).json({ error: 'Invalid tone' });
  }
  if (matchBio.length > MAX_BIO_LENGTH) {
    return res.status(400).json({ error: `Bio must be under ${MAX_BIO_LENGTH} characters` });
  }

  let openers;
  let usedFallback = false;

  try {
    openers = await callGemini({ matchBio, tone, reference });
  } catch (err) {
    console.error('[gemini-icebreaker]', err.message);
    await supabase.from('error_logs').insert({
      user_id: req.user.id,
      type: 'gemini_error',
      message: err.message,
      endpoint: '/api/icebreaker/generate',
    }).catch(() => {});

    openers = buildTemplateIcebreakers({ matchBio, tone, reference });
    usedFallback = true;
  }

  const isPro = req.user.plan === 'pro';

  const { data: saved, error: saveError } = await supabase
    .from('icebreakers')
    .insert({ user_id: req.user.id, match_bio: matchBio, tone, reference: reference || null, openers })
    .select()
    .single();

  // Don't block the core feature on persistence — e.g. if the icebreakers
  // table hasn't been created yet in an older deployment.
  const record = saveError
    ? {
        id: 'local-' + Date.now(),
        user_id: req.user.id,
        match_bio: matchBio,
        tone,
        reference: reference || null,
        openers,
        created_at: new Date().toISOString(),
      }
    : saved;

  if (saveError) console.error('[save icebreaker]', saveError.message);

  return res.json({
    icebreaker: { ...record, openers: gateOpeners(record.openers, isPro) },
    fallback: usedFallback,
  });
}

async function getHistory(req, res) {
  const { data, error } = await supabase
    .from('icebreakers')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    // 42P01 = relation (table) does not exist — degrade gracefully
    if (error.code === '42P01') return res.json({ icebreakers: [] });
    return res.status(500).json({ error: 'Failed to fetch icebreakers' });
  }

  const isPro = req.user.plan === 'pro';
  const icebreakers = (data || []).map((row) => ({ ...row, openers: gateOpeners(row.openers, isPro) }));
  return res.json({ icebreakers });
}

async function extractBio(req, res) {
  const { images } = req.body;

  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: 'At least one screenshot is required' });
  }
  if (images.length > MAX_IMAGES) {
    return res.status(400).json({ error: `Upload up to ${MAX_IMAGES} screenshots at a time` });
  }
  if (images.some((img) => !img?.base64 || !img?.mimeType)) {
    return res.status(400).json({ error: 'Each image needs base64 data and a mime type' });
  }

  try {
    const bio = await extractBioFromImages(images);
    if (!bio) {
      return res.status(502).json({ error: "Couldn't find any bio text in those screenshots. Try clearer images or paste it manually." });
    }
    return res.json({ bio: bio.slice(0, MAX_BIO_LENGTH) });
  } catch (err) {
    console.error('[extract-bio]', err.message);
    await supabase.from('error_logs').insert({
      user_id: req.user.id,
      type: 'gemini_error',
      message: err.message,
      endpoint: '/api/icebreaker/extract-bio',
    }).catch(() => {});
    return res.status(502).json({ error: "Couldn't read those screenshots. Try again or paste the bio manually." });
  }
}

async function deleteIcebreaker(req, res) {
  const { id } = req.params;
  const { error } = await supabase
    .from('icebreakers')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: 'Failed to delete icebreaker' });
  return res.json({ success: true });
}

module.exports = { generate, getHistory, deleteIcebreaker, extractBio };
