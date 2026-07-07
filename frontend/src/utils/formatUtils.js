// ============================================================
// Format Utilities
// billingCycle-specific helpers removed
// ============================================================

/**
 * Format currency amount in Indian Rupees
 */
export const formatCurrency = (amount, currency = '₹') => {
  if (amount === undefined || amount === null) return '—';
  return `${currency}${Number(amount).toLocaleString('en-IN')}`;
};

/**
 * Capitalize first letter
 */
export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

/**
 * Generate a unique subscription ID
 */
export const generateId = () =>
  `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Generate a unique history record ID
 */
export const generateHistId = () =>
  `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Get initials from a name (up to 2 chars)
 */
export const getInitials = (name = '') =>
  name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

/**
 * Truncate long strings
 */
export const truncate = (str, maxLen = 30) =>
  str && str.length > maxLen ? `${str.slice(0, maxLen)}…` : str;

/**
 * Sum the cost of all active subscriptions directly.
 * No billing-cycle normalization needed since costs are raw amounts.
 */
export const calcTotalCost = (subscriptions) =>
  subscriptions.reduce((sum, sub) => sum + (sub.cost || 0), 0);

