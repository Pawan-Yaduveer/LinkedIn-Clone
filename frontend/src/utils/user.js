import { getProfile } from '../api';

// Refresh current user profile from server, update localStorage, and dispatch profileUpdated.
export async function refreshCurrentUser(currentUser) {
  try {
    const meId = currentUser?.id || currentUser?._id;
    if (!meId) return null;
    const rsp = await getProfile(meId);
    const me = rsp.data.user;
    localStorage.setItem('user', JSON.stringify(me));
    try { window.dispatchEvent(new CustomEvent('profileUpdated', { detail: me })); } catch {}
    return me;
  } catch (e) {
    console.error('Failed to refresh current user', e);
    return null;
  }
}
