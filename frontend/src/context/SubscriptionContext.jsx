// ============================================================
// Subscription Context — Global Subscription State
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
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
  const { showSuccess, showError } = useToast();
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
      Promise.resolve().then(() => { loadData(); });
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
    try {
      const newSub = await addSubscription(data);
      const withStatus = { ...newSub, computedStatus: getStatus(newSub.expiryDate, newSub.reminderDays) };
      setSubscriptions((prev) => [...prev, withStatus]);
      showSuccess(`${newSub.serviceName} added successfully!`, 'Subscription Added');
      return withStatus;
    } catch (err) {
      showError(err.message || 'Failed to add subscription.', 'Add Failed');
      throw err;
    }
  };

  const updateSub = async (id, data) => {
    try {
      const updated = await updateSubscription(id, data);
      const withStatus = { ...updated, computedStatus: getStatus(updated.expiryDate, updated.reminderDays) };
      setSubscriptions((prev) => prev.map((s) => (s.id === id ? withStatus : s)));
      showSuccess(`${updated.serviceName} updated successfully!`, 'Subscription Updated');
      return withStatus;
    } catch (err) {
      showError(err.message || 'Failed to update subscription.', 'Update Failed');
      throw err;
    }
  };

  const deleteSub = async (id) => {
    const sub = subscriptions.find(s => s.id === id);
    try {
      await deleteSubscription(id);
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      showSuccess(`${sub?.serviceName || 'Subscription'} deleted.`, 'Deleted');
    } catch (err) {
      showError(err.message || 'Failed to delete subscription.', 'Delete Failed');
      throw err;
    }
  };

  const renewSub = async (id, newExpiryDate, newCost, renewFromPreviousExpiry) => {
    try {
      const updated = await renewSubscription(id, newExpiryDate, newCost, renewFromPreviousExpiry);
      await loadData();
      const withStatus = { ...updated, computedStatus: getStatus(updated.expiryDate, updated.reminderDays) };
      showSuccess(`${updated.serviceName} renewed successfully!`, 'Renewed');
      return withStatus;
    } catch (err) {
      showError(err.message || 'Failed to renew subscription.', 'Renewal Failed');
      throw err;
    }
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

  // Notifications: expiring within custom reminderDays + expired within 7 days
  const notifications = subscriptions
    .filter((s) => {
      const days = daysUntilExpiry(s.expiryDate);
      const reminderDays = s.reminderDays || 7;
      return days >= -7 && days <= reminderDays;
    })
    .sort((a, b) => Math.abs(daysUntilExpiry(a.expiryDate)) - Math.abs(daysUntilExpiry(b.expiryDate)));

  const [notificationsDismissed, setNotificationsDismissed] = useState(false);
  const totalActiveCost = calcTotalCost(activeSubscriptions);
  const dismissNotifications = () => setNotificationsDismissed(true);

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
