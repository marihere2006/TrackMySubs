// ============================================================
// Date Utilities
// ============================================================

/**
 * Format a date string: "2026-06-17" → "17 Jun 2026"
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};



/**
 * Returns number of days until expiry (negative if already expired)
 */
export const daysUntilExpiry = (expiryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.round((expiry - today) / (1000 * 60 * 60 * 24));
};

/**
 * Determine computed subscription status based on expiry date and reminder settings
 */
export const getStatus = (expiryDate, reminderDays = 7) => {
  const days = daysUntilExpiry(expiryDate);
  if (days < 0) return 'Expired';
  if (days <= reminderDays) return 'Expiring Soon';
  return 'Active';
};

/**
 * Human-readable expiry label, including past expiry
 */
export const expiryLabel = (expiryDate) => {
  const days = daysUntilExpiry(expiryDate);
  if (days < -1) return `Expired ${Math.abs(days)} days ago`;
  if (days === -1) return 'Expired yesterday';
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  if (days <= 7) return `Expires in ${days} days`;
  return `Expires on ${formatDate(expiryDate)}`;
};

/**
 * Calculate duration between two dates in readable form
 * (derived at render time — not stored in the model)
 */
export const getDuration = (startDate, expiryDate) => {
  const start = new Date(startDate);
  const end = new Date(expiryDate);
  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return '—';
  if (diffDays < 30) return `${diffDays}d`;
  const months = Math.round(diffDays / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return remMonths > 0 ? `${years}y ${remMonths}mo` : `${years}yr`;
};

/**
 * Today's date as YYYY-MM-DD string (for date input min values)
 */
export const todayStr = () => new Date().toISOString().split('T')[0];

/**
 * Sort subscriptions by expiry date ascending
 */
export const sortByExpiry = (subscriptions) =>
  [...subscriptions].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

/**
 * Simple relative time formatter
 */
export const formatDistanceToNow = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now - d) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
};
