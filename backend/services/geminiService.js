const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const CHAR_LIMITS = {
  linkedin: 2600,
  instagram: 150,
  twitter: 160,
  threads: 150,
  hinge: 300,
  bumble: 300,
  tinder: 500,
  tiktok: 80,
  youtube: 1000,
  github: 160,
  discord: 190,
  reddit: 200,
  substack: 280,
  medium: 160,
  patreon: 250,
  fiverr: 600,
  facebook: 101,
  snapchat: 150,
  pinterest: 160,
  telegram: 255,
  whatsapp: 139,
  mastodon: 500,
  bereal: 100,
  spotify: 1500,
  twitch: 300,
};

const LENGTH_GUIDANCE = {
  Short: 'Keep it very concise — one or two sentences.',
  Medium: 'Aim for 3–5 sentences with good flow.',
  Long: 'Write a fuller bio with personality and detail.',
};

async function generateBio({ platform, role, interests, tone, length }) {
  const charLimit = CHAR_LIMITS[platform] || 300;
  const lengthGuide = LENGTH_GUIDANCE[length] || LENGTH_GUIDANCE.Medium;

  const prompt = `Write a ${length.toLowerCase()}, ${tone.toLowerCase()} bio for ${platform} for someone who ${role}. They love ${interests}. ${lengthGuide} The bio should feel natural, human, and authentic. No hashtags. No filler phrases like "passionate about" or "I am a". Max ${charLimit} characters. Return only the bio text, nothing else.`;

  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
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
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
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
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  });

  const imageParts = images.map((img) => ({
    inlineData: { data: img.base64, mimeType: img.mimeType },
  }));

  const result = await model.generateContent([prompt, ...imageParts]);
  return result.response.text().trim();
}

module.exports = { generateBio, generateIcebreakers, extractBioFromImages };
