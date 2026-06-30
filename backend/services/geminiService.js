const { GoogleGenerativeAI } = require('@google/generative-ai');
const { CHAR_LIMITS, PLATFORM_NAMES } = require('../constants/platforms');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const LENGTH_GUIDANCE = {
  Short: 'Keep it very concise — one or two sentences.',
  Medium: 'Aim for 3–5 sentences with good flow.',
  Long: 'Write a fuller bio with personality and detail.',
};

// Per-app cultural guidance so dating bios don't all read the same way.
const DATING_VIBE = {
  hinge: 'Hinge bios are often built around a prompt-style format — conversational and a little vulnerable, designed to spark a specific question rather than just list traits.',
  bumble: 'Bumble bios tend to be confident and a bit playful, since women message first — give the reader something specific and easy to open with.',
  tinder: 'Tinder bios are casual, punchy, and a little flirty — a quick hook over a detailed self-summary.',
  okcupid: 'OkCupid bios reward personality and specificity — slightly longer, witty, opinionated, almost a conversation starter in itself.',
  cmb: 'Coffee Meets Bagel bios should feel intentional and low-key, written for someone looking for something real rather than a highlight reel.',
  pof: 'Plenty of Fish bios are straightforward and down-to-earth — plainspoken and friendly, no gimmicks.',
  happn: 'Happn bios should feel grounded in everyday life and place — casual and approachable, like running into someone interesting nearby.',
};

// Picked randomly per request so regenerating with identical inputs doesn't
// converge on the same structure every time.
const ANGLE_HINTS = [
  'Open with a question.',
  'Open with a quick, specific scene or moment.',
  'Open with a playful or bold claim about yourself.',
  'Lead with your interests, then circle back to who you are.',
  'Open with a one-line observation about yourself.',
];

async function generateBio({ platform, role, interests, tone, length }) {
  const charLimit = CHAR_LIMITS[platform] || 300;
  const lengthGuide = LENGTH_GUIDANCE[length] || LENGTH_GUIDANCE.Medium;
  const platformName = PLATFORM_NAMES[platform] || platform;
  const vibe = DATING_VIBE[platform];
  const angle = ANGLE_HINTS[Math.floor(Math.random() * ANGLE_HINTS.length)];

  const prompt = `Write a ${length.toLowerCase()}, ${tone.toLowerCase()} bio for ${platformName} for someone who ${role}. They love ${interests}. ${lengthGuide}${vibe ? ` ${vibe}` : ''} ${angle} The bio should feel natural, human, and authentic. No hashtags. No filler phrases like "passionate about" or "I am a". Max ${charLimit} characters. Return only the bio text, nothing else.`;

  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Enforce hard character limit
  if (text.length > charLimit) {
    return text.slice(0, charLimit).trimEnd();
  }
  return text;
}

async function generateIcebreakers({ matchBio, tone, reference }) {
  const referenceLine = reference
    ? `Specifically reference this detail from their bio: "${reference}".`
    : 'Pick the most interesting, specific detail from their bio to reference — avoid anything generic.';

  const prompt = `Someone's dating app bio is: "${matchBio}". Write exactly 3 short, ${tone.toLowerCase()} opening messages to send them on a dating app. ${referenceLine} Each opener should be a single message, 1-2 sentences, no emojis unless ${tone.toLowerCase() === 'playful' ? 'it fits naturally' : 'never'}, no generic lines like "hey" or "how's your day going". Make each of the 3 openers distinct from each other in angle or phrasing. Return only the 3 openers, one per line, with no numbering, labels, or extra commentary.`;

  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const openers = text
    .split('\n')
    .map((line) => line.replace(/^[\d.\-)\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 3);

  if (openers.length < 3) {
    throw new Error('Gemini returned fewer than 3 openers');
  }

  return openers;
}

async function extractBioFromImages(images) {
  const prompt = `These are screenshot(s) of someone's dating app profile. Extract and return only the bio text they wrote about themselves — their prompts/answers, captions, and written details. Ignore UI elements like buttons, percentages, distances, icons, and navigation chrome. If there are multiple screenshots, combine the text in natural reading order. Return only the extracted text, no commentary, no markdown, no surrounding quotes.`;

  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
  });

  const imageParts = images.map((img) => ({
    inlineData: { data: img.base64, mimeType: img.mimeType },
  }));

  const result = await model.generateContent([prompt, ...imageParts]);
  return result.response.text().trim();
}

module.exports = { generateBio, generateIcebreakers, extractBioFromImages };
