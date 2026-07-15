// AI Service - API calls to backend AI endpoints

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const TOKEN_KEY = 'sms_token';

const checkAuthError = (res) => {
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('sms_user');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }
};

const getHeaders = (includeJson = true) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {
    Accept: 'application/json',
  };

  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const getAiDashboard = async () => {
  const res = await fetch(`${BASE_URL}/ai/dashboard`, { headers: getHeaders() });
  checkAuthError(res);
  if (!res.ok) throw new Error('Failed to fetch AI dashboard data.');
  const data = await res.json();
  return data.data;
};

export const getInsights = async () => {
  const res = await fetch(`${BASE_URL}/ai/insights`, { headers: getHeaders() });
  checkAuthError(res);
  if (!res.ok) throw new Error('Failed to fetch AI insights.');
  const data = await res.json();
  return data.data;
};

export const getRecommendations = async () => {
  const res = await fetch(`${BASE_URL}/ai/recommendations`, { headers: getHeaders() });
  checkAuthError(res);
  if (!res.ok) throw new Error('Failed to fetch AI recommendations.');
  const data = await res.json();
  return data.data;
};

export const getForecast = async () => {
  const res = await fetch(`${BASE_URL}/ai/forecast`, { headers: getHeaders() });
  checkAuthError(res);
  if (!res.ok) throw new Error('Failed to fetch AI forecast.');
  const data = await res.json();
  return data.data;
};

export const getHealthScore = async () => {
  const res = await fetch(`${BASE_URL}/ai/health`, { headers: getHeaders() });
  checkAuthError(res);
  if (!res.ok) throw new Error('Failed to fetch AI health score.');
  const data = await res.json();
  return data.data;
};

export const getAlerts = async () => {
  const res = await fetch(`${BASE_URL}/ai/alerts`, { headers: getHeaders() });
  checkAuthError(res);
  if (!res.ok) throw new Error('Failed to fetch AI alerts.');
  const data = await res.json();
  return data.data;
};

export const getCopilotSummary = async () => {
  const res = await fetch(`${BASE_URL}/ai/copilot`, { headers: getHeaders() });
  checkAuthError(res);
  if (!res.ok) throw new Error('Failed to fetch AI copilot summary.');
  const data = await res.json();
  return data.data;
};

export const getTimeline = async () => {
  const res = await fetch(`${BASE_URL}/ai/timeline`, { headers: getHeaders() });
  checkAuthError(res);
  if (!res.ok) throw new Error('Failed to fetch AI timeline.');
  const data = await res.json();
  return data.data;
};

export const sendChatMessage = async (message, options = {}) => {
  const payload = typeof message === 'object' && message !== null ? message : { message };
  const res = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: getHeaders(),
    signal: options.signal,
    body: JSON.stringify(payload),
  });
  checkAuthError(res);
  if (!res.ok) throw new Error('Failed to send chat message.');
  const data = await res.json();
  return data.data;
};

export const categorizeService = async (serviceName) => {
  const res = await fetch(`${BASE_URL}/ai/categorize?serviceName=${encodeURIComponent(serviceName)}`, { headers: getHeaders() });
  checkAuthError(res);
  if (!res.ok) throw new Error('Failed to categorize service.');
  const data = await res.json();
  return data.data.category;
};

export const smartAdd = async (text) => {
  const res = await fetch(`${BASE_URL}/ai/smart-add`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ text }),
  });
  checkAuthError(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to parse subscription.' }));
    throw new Error(err.message || 'Failed to parse subscription.');
  }
  const data = await res.json();
  return data.data;
};

export const uploadBankStatement = async (file) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/bank-statement/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  checkAuthError(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to process bank statement.' }));
    throw new Error(err.message || 'Failed to process bank statement.');
  }
  const data = await res.json();
  return data.data;
};

export const confirmDetectedSubscriptions = async (detectedList) => {
  const res = await fetch(`${BASE_URL}/bank-statement/confirm`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(detectedList),
  });
  checkAuthError(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to save subscriptions.' }));
    throw new Error(err.message || 'Failed to save subscriptions.');
  }
  const data = await res.json();
  return data.data;
};

export const getAnalyticsSnapshots = async () => {
  const res = await fetch(`${BASE_URL}/analytics/snapshots`, { headers: getHeaders() });
  checkAuthError(res);
  if (!res.ok) throw new Error('Failed to fetch analytics snapshots.');
  const data = await res.json();
  return data.data;
};

export const getAnalyticsSummary = async () => {
  const res = await fetch(`${BASE_URL}/analytics/summary`, { headers: getHeaders() });
  checkAuthError(res);
  if (!res.ok) throw new Error('Failed to fetch analytics summary.');
  const data = await res.json();
  return data.data;
};
