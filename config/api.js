import { Platform } from 'react-native';

// Use device-friendly localhost by default
const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${DEFAULT_HOST}:5000`;

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const isFormData = options && options.body && typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(options.headers || {}),
  };
  if (!isFormData) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  // Auto stringify body if it's a plain object and content-type is json
  let body = options.body;
  if (!isFormData && body && typeof body === 'object' && headers['Content-Type']?.includes('application/json')) {
    body = JSON.stringify(body);
  }

  const resp = await fetch(url, {
    ...options,
    headers,
    body,
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Request failed ${resp.status}: ${text || resp.statusText}`);
  }
  // Attempt JSON parse; allow empty bodies
  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return resp.json();
  }
  return null;
}
