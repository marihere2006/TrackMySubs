// ============================================================
// Subscription Service — Spring Boot Connected
// ============================================================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const TOKEN_KEY = 'sms_token';

const getHeaders = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

/**
 * Fetch all subscriptions of the logged-in user.
 */
export const getSubscriptions = async () => {
  const res = await fetch(`${BASE_URL}/subscriptions`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to fetch subscriptions.');
  }

  const data = await res.json();
  return data.data;
};

/**
 * Fetch a single subscription by ID.
 */
export const getSubscriptionById = async (id) => {
  const res = await fetch(`${BASE_URL}/subscriptions/${id}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Subscription not found.');
  }

  const data = await res.json();
  return data.data;
};

/**
 * Add a new subscription.
 */
export const addSubscription = async (subData) => {
  const res = await fetch(`${BASE_URL}/subscriptions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(subData),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to create subscription.');
  }

  const data = await res.json();
  return data.data;
};

/**
 * Update an existing subscription.
 */
export const updateSubscription = async (id, subData) => {
  const res = await fetch(`${BASE_URL}/subscriptions/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(subData),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to update subscription.');
  }

  const data = await res.json();
  return data.data;
};

/**
 * Delete a subscription by ID.
 */
export const deleteSubscription = async (id) => {
  const res = await fetch(`${BASE_URL}/subscriptions/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to delete subscription.');
  }

  return true;
};

/**
 * Renew a subscription with a new expiry date.
 */
export const renewSubscription = async (id, newExpiryDate, newCost) => {
  const res = await fetch(`${BASE_URL}/subscriptions/${id}/renew`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ newExpiryDate, newCost }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to renew subscription.');
  }

  const data = await res.json();
  return data.data;
};

/**
 * Fetch all history records of the logged-in user.
 */
export const getHistory = async () => {
  const res = await fetch(`${BASE_URL}/history`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to fetch history.');
  }

  const data = await res.json();
  return data.data;
};
