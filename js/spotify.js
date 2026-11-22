// Spotify integration.
//
// Two ways to have music in the app:
//  1. Playlist embed: paste a playlist/album link in Settings. No setup, plays in the app.
//     (Full tracks when you're logged into Spotify in this browser, otherwise previews.)
//  2. Remote control: connect your Spotify account (needs a free Spotify developer Client ID
//     and Spotify Premium). Shows what's playing in the Spotify app on your phone and gives
//     you play / pause / skip buttons right inside the workout screen.
import { state, save } from './store.js';

const TOKEN_KEY = 'repup.spotify.token';
const VERIFIER_KEY = 'repup.spotify.verifier';
const SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing';

export const redirectUri = () => location.origin + location.pathname;

export function embedUrl(link) {
  const m = String(link || '').match(/(playlist|album|artist|track|show|episode)[/:]([A-Za-z0-9]+)/);
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0` : null;
}
export const contextUri = (link) => {
  const m = String(link || '').match(/(playlist|album|artist)[/:]([A-Za-z0-9]+)/);
  return m ? `spotify:${m[1]}:${m[2]}` : null;
};

function getToken() {
  try { return JSON.parse(localStorage.getItem(TOKEN_KEY)); } catch { return null; }
}
function setToken(t) {
  try { t ? localStorage.setItem(TOKEN_KEY, JSON.stringify(t)) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}
export const isConnected = () => !!getToken()?.refresh_token;

const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export async function connect() {
  const clientId = state.settings.spotify.clientId.trim();
  if (!clientId) throw new Error('Add your Spotify Client ID first.');
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(48)));
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  localStorage.setItem(VERIFIER_KEY, verifier);
  const q = new URLSearchParams({
    response_type: 'code', client_id: clientId, scope: SCOPES,
    code_challenge_method: 'S256', code_challenge: challenge, redirect_uri: redirectUri(),
  });
  location.href = 'https://accounts.spotify.com/authorize?' + q;
}

export function disconnect() { setToken(null); }

async function tokenRequest(params) {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: state.settings.spotify.clientId.trim(), ...params }),
  });
  if (!res.ok) throw new Error('Spotify sign-in failed (' + res.status + ')');
  const t = await res.json();
  const prev = getToken() || {};
  setToken({ ...prev, ...t, expires_at: Date.now() + (t.expires_in - 60) * 1000 });
}

// Call on startup: finishes the sign-in when Spotify redirects back with ?code=
export async function handleRedirect() {
  const p = new URLSearchParams(location.search);
  const code = p.get('code');
  const err = p.get('error');
  if (!code && !err) return null;
  history.replaceState(null, '', location.pathname + (location.hash || '#/settings'));
  if (err) return 'Spotify connection cancelled.';
  try {
    await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri(), code_verifier: localStorage.getItem(VERIFIER_KEY) || '' });
    return 'Spotify connected!';
  } catch (e) {
    return e.message;
  }
}

async function access() {
  const t = getToken();
  if (!t) return null;
  if (Date.now() > t.expires_at) await tokenRequest({ grant_type: 'refresh_token', refresh_token: t.refresh_token });
  return getToken().access_token;
}

async function api(path, method = 'GET', body) {
  const tok = await access();
  if (!tok) throw new Error('not-connected');
  const res = await fetch('https://api.spotify.com/v1' + path, {
    method,
    headers: { Authorization: 'Bearer ' + tok, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204 || res.status === 202) return null;
  if (res.status === 404) throw new Error('no-device');
  if (res.status === 403) throw new Error('premium');
  if (!res.ok) throw new Error('http-' + res.status);
  const txt = await res.text();
  return txt ? JSON.parse(txt) : null;
}

export async function nowPlaying() {
  const p = await api('/me/player');
  if (!p || !p.item) return { idle: true };
  return {
    playing: p.is_playing,
    title: p.item.name,
    artist: (p.item.artists || p.item.show && [p.item.show] || []).map((a) => a.name).join(', '),
    art: (p.item.album?.images || p.item.images || []).at(-1)?.url || '',
    device: p.device?.name,
  };
}

export const control = {
  play: () => api('/me/player/play', 'PUT'),
  pause: () => api('/me/player/pause', 'PUT'),
  next: () => api('/me/player/next', 'POST'),
  prev: () => api('/me/player/previous', 'POST'),
  async startPlaylist() {
    const uri = contextUri(state.settings.spotify.playlist);
    const { devices = [] } = (await api('/me/player/devices')) || {};
    const dev = devices.find((d) => d.is_active) || devices.find((d) => d.type === 'Smartphone') || devices[0];
    if (!dev) throw new Error('no-device');
    return api('/me/player/play?device_id=' + dev.id, 'PUT', uri ? { context_uri: uri } : undefined);
  },
};

export function friendlyError(e) {
  switch (e.message) {
    case 'no-device': return 'Open Spotify on your phone and play something, then control it from here.';
    case 'premium': return 'Spotify only allows remote control with a Premium account.';
    case 'not-connected': return 'Connect Spotify in Settings.';
    default: return 'Spotify: ' + e.message;
  }
}

export function saveSpotify(patch) { Object.assign(state.settings.spotify, patch); save(); }
