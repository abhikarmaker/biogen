// Single source of truth for platform labels in the admin dashboard —
// previously duplicated separately in Bios.jsx and Overview.jsx, which had
// drifted (Overview used a shorter "X" label instead of "X (Twitter)").
export const PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'twitter', label: 'X (Twitter)' },
  { id: 'threads', label: 'Threads' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'snapchat', label: 'Snapchat' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'discord', label: 'Discord' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'mastodon', label: 'Mastodon' },
  { id: 'bereal', label: 'BeReal' },
  { id: 'spotify', label: 'Spotify' },
  { id: 'twitch', label: 'Twitch' },
  { id: 'hinge', label: 'Hinge' },
  { id: 'bumble', label: 'Bumble' },
  { id: 'tinder', label: 'Tinder' },
  { id: 'okcupid', label: 'OkCupid' },
  { id: 'cmb', label: 'Coffee Meets Bagel' },
  { id: 'pof', label: 'Plenty of Fish' },
  { id: 'happn', label: 'Happn' },
  { id: 'github', label: 'GitHub' },
  { id: 'substack', label: 'Substack' },
  { id: 'medium', label: 'Medium' },
  { id: 'patreon', label: 'Patreon' },
  { id: 'fiverr', label: 'Fiverr' },
];

export const PLATFORM_LABEL = Object.fromEntries(PLATFORMS.map((p) => [p.id, p.label]));
