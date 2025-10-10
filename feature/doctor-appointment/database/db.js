import { Platform } from 'react-native';

// Resolve API base URL for different RN runtimes
const getBaseUrl = () => {
  // Allow override via env (Expo or RN config)
  const envUrl = process.env.EXPO_PUBLIC_API_URL || process.env.API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  // Defaults by platform/runtime
  if (Platform.OS === 'android') {
    // Android emulator maps host loopback to 10.0.2.2
    return 'http://10.0.2.2:5000';
  }
  // iOS simulator and web fallback
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
      const maybeJson = await res.json();
      detail = typeof maybeJson === 'object' ? JSON.stringify(maybeJson) : String(maybeJson);
    } catch (_) {
      // ignore
    }
    throw new Error(`API ${res.status} ${res.statusText}${detail ? ` - ${detail}` : ''}`);
  }
  // Attempt JSON parse, allow empty body
  try {
    return await res.json();
  } catch (_) {
    return null;
  }
};

// Initialize (noop but keeps call sites unchanged)
export const initDatabase = async () => {
  console.log('API base URL:', getBaseUrl());
};

// Save appointment -> POST /api/appointments
export const saveAppointment = async (appointmentData) => {
  try {
    const saved = await apiFetch('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
    return saved?.id;
  } catch (error) {
    console.error('Error saving appointment (API):', error);
    throw error;
  }
};

// Get all appointments -> GET /api/appointments
export const getAllAppointments = async () => {
  try {
    const appointments = await apiFetch('/api/appointments');
    // Sort by date and time descending (keep existing UX)
    return (appointments || []).sort((a, b) => {
      const dateCompare = (b.appointmentDate || '').localeCompare(a.appointmentDate || '');
      if (dateCompare !== 0) return dateCompare;
      return (b.appointmentTime || '').localeCompare(a.appointmentTime || '');
    });
  } catch (error) {
    console.error('Error fetching appointments (API):', error);
    return [];
  }
};

// Delete appointment -> DELETE /api/appointments/:id
export const deleteAppointment = async (id) => {
  try {
    await apiFetch(`/api/appointments/${id}`, { method: 'DELETE' });
  } catch (error) {
    console.error('Error deleting appointment (API):', error);
    throw error;
  }
};

// Get upcoming appointments (client-side filter)
export const getUpcomingAppointments = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const appointments = await getAllAppointments();
    return appointments
      .filter((apt) => (apt.appointmentDate || '') >= today)
      .sort((a, b) => {
        const dateCompare = (a.appointmentDate || '').localeCompare(b.appointmentDate || '');
        if (dateCompare !== 0) return dateCompare;
        return (a.appointmentTime || '').localeCompare(b.appointmentTime || '');
      });
  } catch (error) {
    console.error('Error fetching upcoming appointments (API):', error);
    return [];
  }
};

// Get doctors list -> GET /api/doctors
export const getDoctors = async () => {
  try {
    const doctors = await apiFetch('/api/doctors');
    return Array.isArray(doctors) ? doctors : [];
  } catch (error) {
    console.error('Error fetching doctors (API):', error);
    return [];
  }
};

// Get users (optionally filtered) -> GET /api/users?userType=doctor
export const getUsers = async (params = {}) => {
  try {
    const qs = new URLSearchParams();
    if (params.userType) qs.set('userType', params.userType);
    const path = `/api/users${qs.toString() ? `?${qs.toString()}` : ''}`;
    const users = await apiFetch(path);
    return Array.isArray(users) ? users : [];
  } catch (error) {
    console.error('Error fetching users (API):', error);
    return [];
  }
};

// Create doctor -> POST /api/doctors
export const createDoctor = async (doctor) => {
  try {
    const created = await apiFetch('/api/doctors', {
      method: 'POST',
      body: JSON.stringify(doctor),
    });
    return created;
  } catch (error) {
    console.error('Error creating doctor (API):', error);
    throw error;
  }
};
