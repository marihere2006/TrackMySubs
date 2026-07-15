// ============================================================
// Format Utilities
// ============================================================

const INR_SYMBOL = '\u20B9';

/**
 * Format currency amount in Indian Rupees.
 */
export const formatCurrency = (amount, currency = INR_SYMBOL) => {
  if (amount === undefined || amount === null || amount === '') return '\u2014';

  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return '\u2014';

  const symbol = currency === 'INR' || currency === INR_SYMBOL ? INR_SYMBOL : String(currency);
  return `${symbol}${numeric.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(numeric) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Capitalize first letter.
 */
export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

/**
 * Generate a unique subscription ID.
 */
export const generateId = () =>
  `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Generate a unique history record ID.
 */
export const generateHistId = () =>
  `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Get initials from a name (up to 2 chars).
 */
export const getInitials = (name = '') =>
  name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

/**
 * Truncate long strings.
 */
export const truncate = (str, maxLen = 30) =>
  str && str.length > maxLen ? `${str.slice(0, maxLen)}\u2026` : str;

/**
 * Sum the cost of all active subscriptions directly.
 */
export const calcTotalCost = (subscriptions = []) =>
  subscriptions.reduce((sum, sub) => sum + Number(sub.cost || 0), 0);
