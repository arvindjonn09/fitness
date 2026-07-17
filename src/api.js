const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'teamready_token';

export const authStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export async function api(path, options = {}) {
  const token = authStore.get();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.details = payload;
    throw error;
  }
  return payload;
}

export const teamReadyApi = {
  registerOrganisation: (body) => api('/api/auth/register-organisation', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => api('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => api('/api/me'),
  createTeam: (organisationId, body) => api(`/api/organisations/${organisationId}/teams`, { method: 'POST', body: JSON.stringify(body) }),
  createInvitation: (teamId, body) => api(`/api/teams/${teamId}/invitations`, { method: 'POST', body: JSON.stringify(body) }),
  getInvitation: (token) => api(`/api/invitations/${token}`),
  acceptInvitation: (token, body) => api(`/api/invitations/${token}/accept`, { method: 'POST', body: JSON.stringify(body) }),
  submitCheckIn: (teamId, body) => api(`/api/teams/${teamId}/check-ins`, { method: 'POST', body: JSON.stringify(body) }),
  dashboard: (teamId, date) => api(`/api/teams/${teamId}/dashboard${date ? `?date=${date}` : ''}`),
  playerTrend: (teamId, playerId) => api(`/api/teams/${teamId}/players/${playerId}/trend`),
};
