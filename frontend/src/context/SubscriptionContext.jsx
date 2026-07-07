// ============================================================
// Subscription Context — Global Subscription State
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  getSubscriptions,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  renewSubscription,
  getHistory,
} from '../services/subscriptionService';
import { getStatus, daysUntilExpiry } from '../utils/dateUtils';
import { calcTotalCost } from '../utils/formatUtils';

const SubscriptionContext = createContext(null);

export const SubscriptionProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Load initial data ──────────────────────────────────
  const loadData = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const [subs, hist] = await Promise.all([getSubscriptions(), getHistory()]);
      // Derive live status from current date — never trust stored status alone
      const withLiveStatus = subs.map((s) => ({
        ...s,
        computedStatus: getStatus(s.expiryDate, s.reminderDays),
      }));
      setSubscriptions(withLiveStatus);
      setHistory(hist);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      Promise.resolve().then(() => {
        loadData();
      });
    } else {
      Promise.resolve().then(() => {
        setSubscriptions([]);
        setHistory([]);
        setLoading(false);
      });
    }
  }, [isAuthenticated, loadData]);

  // ── CRUD Operations ───────────────────────────────────
  const addSub = async (data) => {
    const newSub = await addSubscription(data);
    const withStatus = { ...newSub, computedStatus: getStatus(newSub.expiryDate, newSub.reminderDays) };
    setSubscriptions((prev) => [...prev, withStatus]);
    return withStatus;
  };

  const updateSub = async (id, data) => {
    const updated = await updateSubscription(id, data);
    const withStatus = { ...updated, computedStatus: getStatus(updated.expiryDate, updated.reminderDays) };
    setSubscriptions((prev) => prev.map((s) => (s.id === id ? withStatus : s)));
    return withStatus;
  };

  const deleteSub = async (id) => {
    await deleteSubscription(id);
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  };

  /**
   * Renew a subscription with a user-provided new expiry date and cost.
   * @param {string} id - Subscription ID
   * @param {string} newExpiryDate - User-entered date "YYYY-MM-DD"
   * @param {number} newCost - User-entered cost
   */
  const renewSub = async (id, newExpiryDate, newCost) => {
    const updated = await renewSubscription(id, newExpiryDate, newCost);
    await loadData();
    const withStatus = { ...updated, computedStatus: getStatus(updated.expiryDate, updated.reminderDays) };
    return withStatus;
  };

  // ── Derived Data ──────────────────────────────────────
  const activeSubscriptions = subscriptions.filter(
    (s) => s.computedStatus === 'Active' || s.computedStatus === 'Expiring Soon'
  );
  const expiredSubscriptions = subscriptions.filter(
    (s) => s.computedStatus === 'Expired'
  );
  const expiringSoon = subscriptions.filter(
    (s) => s.computedStatus === 'Expiring Soon'
  );

  // Notifications: expiring within custom reminderDays (future) + expired within 7 days (past)
  const notifications = subscriptions
    .filter((s) => {
      const days = daysUntilExpiry(s.expiryDate);
      const reminderDays = s.reminderDays || 7;
      return days >= -7 && days <= reminderDays;
    })
    .sort((a, b) => Math.abs(daysUntilExpiry(a.expiryDate)) - Math.abs(daysUntilExpiry(b.expiryDate)));

  const [notificationsDismissed, setNotificationsDismissed] = useState(false);

  // Total cost of active subscriptions (raw sum — no billing cycle normalization)
  const totalActiveCost = calcTotalCost(activeSubscriptions);

  const dismissNotifications = () => setNotificationsDismissed(true);

  // If notifications are dismissed, we return an empty array for UI purposes.
  // Wait, if we return an empty array, it might clear the list in the notification panel too.
  // The user asked for "the noti indicator should off". So the count/badge should go away.
  // It's better to pass notificationsDismissed down and let components handle hiding the badge,
  // or we can return empty notifications but we probably want to see them in the panel.
  // Actually, let's just pass dismissNotifications and notificationsDismissed to the context.

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptions,
        history,
        loading,
        error,
        activeSubscriptions,
        expiredSubscriptions,
        expiringSoon,
        notifications,
        notificationsDismissed,
        totalActiveCost,
        // Keep monthlyTotal as alias for backward compat with Dashboard
        monthlyTotal: totalActiveCost,
        addSub,
        updateSub,
        deleteSub,
        renewSub,
        reload: loadData,
        dismissNotifications,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptions = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscriptions must be used within SubscriptionProvider');
  return ctx;
};
