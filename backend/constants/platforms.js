// Single source of truth for platform char limits and display names on the
// backend — previously duplicated separately in geminiService.js and
// bioController.js, which could drift out of sync as platforms were added.
const CHAR_LIMITS = {
  linkedin: 2600,
  instagram: 150,
  twitter: 160,
  threads: 150,
  hinge: 300,
  bumble: 300,
  tinder: 500,
  okcupid: 500,
  cmb: 280,
  pof: 500,
  happn: 150,
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

const PLATFORM_NAMES = {
  linkedin: 'LinkedIn', instagram: 'Instagram', twitter: 'X (Twitter)', threads: 'Threads',
  hinge: 'Hinge', bumble: 'Bumble', tinder: 'Tinder', okcupid: 'OkCupid',
  cmb: 'Coffee Meets Bagel', pof: 'Plenty of Fish', happn: 'Happn',
  tiktok: 'TikTok', youtube: 'YouTube', github: 'GitHub', discord: 'Discord',
  reddit: 'Reddit', substack: 'Substack', medium: 'Medium', patreon: 'Patreon',
  fiverr: 'Fiverr', facebook: 'Facebook', snapchat: 'Snapchat', pinterest: 'Pinterest',
  telegram: 'Telegram', whatsapp: 'WhatsApp', mastodon: 'Mastodon', bereal: 'BeReal',
  spotify: 'Spotify', twitch: 'Twitch',
};

module.exports = { CHAR_LIMITS, PLATFORM_NAMES };
