// ============================================================
// Advanced SOC Lab — auth.js
// Authentication state management for the SOC UI.
// In production this would integrate with Wazuh's JWT API
// or an SSO provider. Here it manages local session state.
// ============================================================

const SESSION_KEY = 'soc_lab_session';

// ── Session shape ─────────────────────────────────────────
// {
//   userId:    string,
//   username:  string,
//   role:      'admin' | 'analyst' | 'viewer',
//   token:     string,
//   expiresAt: number (unix ms),
//   mfa:       boolean,
// }

export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function setSession(session) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      ...session,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15-minute session
    }));
  } catch {
    // sessionStorage not available
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated() {
  return getSession() !== null;
}

// ── Mock login (replace with real Wazuh JWT call) ─────────
export async function login(username, password) {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 600));

  const users = {
    'admin-kim':     { role:'admin',    mfa:true  },
    'analyst-chen':  { role:'analyst',  mfa:true  },
    'analyst-patel': { role:'analyst',  mfa:false },
    'viewer':        { role:'viewer',   mfa:false },
  };

  const user = users[username];
  if (!user || password.length < 6) {
    throw new Error('Invalid username or password');
  }

  const session = {
    userId:   username,
    username,
    role:     user.role,
    mfa:      user.mfa,
    token:    `mock-jwt-${username}-${Date.now()}`,
  };
  setSession(session);
  return session;
}

export async function logout() {
  clearSession();
  window.location.href = '/';
}

// ── Token refresh ─────────────────────────────────────────
export async function refreshToken() {
  const session = getSession();
  if (!session) return null;
  // Extend session by another 15 minutes
  setSession(session);
  return session;
}

// ── Audit helper ──────────────────────────────────────────
export function currentUser() {
  return getSession()?.username || 'anonymous';
}

export function currentRole() {
  return getSession()?.role || 'viewer';
}