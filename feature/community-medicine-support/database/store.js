import { Platform } from 'react-native';

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL || process.env.API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000';
  return 'http://localhost:5000';
};

const apiFetch = async (path, options = {}) => {
  const base = getBaseUrl();
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = typeof j === 'object' ? JSON.stringify(j) : String(j);
    } catch (_) {}
    throw new Error(`API ${res.status} ${res.statusText}${detail ? ` - ${detail}` : ''}`);
  }
  try {
    return await res.json();
  } catch (_) {
    return null;
  }
};

// No seeding needed; groups served from backend
export const initCommunityStore = async () => {
  // optional: prefetch groups
  try { await getGroups(); } catch (_) {}
};

export const getGroups = async () => {
  return await apiFetch('/api/community/groups');
};

export const getRequests = async () => {
  const list = await apiFetch('/api/community/requests');
  // keep newest first
  return (list || []).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
};

export const addRequest = async (req) => {
  const created = await apiFetch('/api/community/requests', {
    method: 'POST',
    body: JSON.stringify(req),
  });
  return created;
};

export const addResponse = async (requestId, response) => {
  const updated = await apiFetch(`/api/community/requests/${requestId}/responses`, {
    method: 'POST',
    body: JSON.stringify(response),
  });
  return updated;
};

export const toggleVerify = async (requestId) => {
  await apiFetch(`/api/community/requests/${requestId}/toggle-verify`, { method: 'POST' });
};

export const removeRequest = async (requestId) => {
  await apiFetch(`/api/community/requests/${requestId}`, { method: 'DELETE' });
};
