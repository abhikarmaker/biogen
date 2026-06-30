// Shared corner-radius scale for controls, cards, and modals.
// One-off/derived radii (circular avatars, tiny badges sized to their own
// box) are intentionally left as inline literals — they aren't part of
// this scale, they're half of some other element's width/height.
export const radii = {
  sm: 12, // inputs, secondary buttons, small chips
  md: 14, // primary CTA buttons
  lg: 16, // cards
  xl: 20, // hero sections, modals
  pill: 999, // fully rounded pills
};
