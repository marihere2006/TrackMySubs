// ============================================================
// Auth Service — Spring Boot Connected
// ============================================================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const STORAGE_KEY = 'sms_user';
const TOKEN_KEY = 'sms_token';

/**
 * Login — validates email/password with the backend and returns user & token.
 */
export const login = async (email, password) => {
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!loginRes.ok) {
    const err = await loginRes.json();
    throw new Error(err.message || 'Invalid credentials.');
  }

  const loginData = await loginRes.json();
  const token = loginData.data.token;
  localStorage.setItem(TOKEN_KEY, token);

  // Retrieve user details from profile endpoint using the new token
  const profileRes = await fetch(`${BASE_URL}/profile`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!profileRes.ok) {
    throw new Error('Failed to retrieve user profile.');
  }

  const profileData = await profileRes.json();
  const user = profileData.data;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

  return { user, token };
};

/**
 * Register — creates a new user via Spring Boot.
 */
export const register = async ({ name, email, password }) => {
  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  if (!registerRes.ok) {
    const err = await registerRes.json();
    throw new Error(err.message || 'Registration failed.');
  }

  // Auto-login after successful registration
  return login(email, password);
};

/**
 * Logout — clears local storage keys.
 */
export const logout = async () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(STORAGE_KEY);
  return true;
};

/**
 * Get current user from local storage.
 */
export const getCurrentUser = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * Update user profile via Spring Boot.
 */
export const updateProfile = async (updates) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${BASE_URL}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Profile update failed.');
  }

  const data = await res.json();
  const updatedUser = data.data;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
  return updatedUser;
};

/**
 * Delete user account via Spring Boot.
 */
export const deleteAccount = async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${BASE_URL}/profile`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Account deletion failed.');
  }

  return logout();
};

/**
 * Send OTP verification code to email
 */
export const sendOtp = async (email) => {
  const res = await fetch(`${BASE_URL}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to send verification code.');
  }

  return res.json();
};

/**
 * Verify email OTP code
 */
export const verifyOtp = async (email, otp) => {
  const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Incorrect or expired verification code.');
  }

  return res.json();
};

