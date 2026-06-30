// Tracks when the admin last viewed the Errors page, so the sidebar can
// show an unread badge for errors logged since then. Stored client-side
// (per browser) since there's a single admin account, not per-user state.
const ERRORS_SEEN_KEY = 'biogen_admin_errors_last_seen';
const ERRORS_SEEN_EVENT = 'biogen:errors-seen';

export function getErrorsLastSeen() {
  let seen = localStorage.getItem(ERRORS_SEEN_KEY);
  if (!seen) {
    // First time loading the dashboard — don't flood the badge with
    // pre-existing errors, only count ones logged from now on.
    seen = new Date().toISOString();
    localStorage.setItem(ERRORS_SEEN_KEY, seen);
  }
  return seen;
}

export function markErrorsSeen() {
  localStorage.setItem(ERRORS_SEEN_KEY, new Date().toISOString());
  window.dispatchEvent(new Event(ERRORS_SEEN_EVENT));
}

export function onErrorsSeen(handler) {
  window.addEventListener(ERRORS_SEEN_EVENT, handler);
  return () => window.removeEventListener(ERRORS_SEEN_EVENT, handler);
}
