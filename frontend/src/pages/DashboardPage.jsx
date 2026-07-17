// ============================================================
// Dashboard Page - Daily Control Center
// ============================================================

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard, CheckCircle, AlertTriangle, TrendingUp,
  ArrowRight, AlertCircle, RefreshCw, PlusCircle, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscriptions } from '../context/SubscriptionContext';
import StatCard from '../components/ui/StatCard';
import HeroHeader from '../components/layout/HeroHeader';
import Skeleton from '../components/ui/Skeleton';
import ServiceLogo from '../components/ui/ServiceLogo';
import CategoryCard from '../components/ui/CategoryCard';
import SubscriptionDetailModal from '../components/ui/SubscriptionDetailModal';
import { formatCurrency } from '../utils/formatUtils';
import { formatDate, expiryLabel, sortByExpiry, formatDistanceToNow } from '../utils/dateUtils';

import styles from './DashboardPage.module.css';

const DashboardPage = () => {
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const { user } = useAuth();
  const {
    subscriptions,
    activeSubscriptions,
    expiringSoon,
    monthlyTotal,
    notifications,
    history,
    loading,
  } = useSubscriptions();

  // Priority Renewals
  const priorityRenewals = useMemo(() => notifications.slice(0, 5), [notifications]);

  // Upcoming Payments
  const upcomingPayments = useMemo(
    () => sortByExpiry(activeSubscriptions).filter(s => new Date(s.expiryDate) >= new Date()).slice(0, 5),
    [activeSubscriptions]
  );

  // Categories Summary
  const categoriesList = useMemo(() => {
    const counts = activeSubscriptions.reduce((acc, sub) => {
      acc[sub.category] = (acc[sub.category] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [activeSubscriptions]);

  // Recent Activity
  const recentActivities = useMemo(() => {
    const acts = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    subscriptions.forEach(sub => {
      const date = new Date(sub.startDate);
      if (date >= thirtyDaysAgo) {
        acts.push({
          id: `add-${sub.id}`,
          subId: sub.id,
          type: 'Add',
          text: `Added ${sub.serviceName}`,
          date: date,
          icon: PlusCircle,
          color: '#22c55e'
        });
      }
    });
    history.forEach(h => {
      const date = new Date(h.renewedOn || h.startDate);
      if (date >= thirtyDaysAgo) {
        acts.push({
          id: `renew-${h.id}`,
          subId: h.subscriptionId,
          type: 'Renew',
          text: `Renewed ${h.serviceName}`,
          date: date,
          icon: RefreshCw,
          color: '#6366f1'
        });
      }
    });
    return acts.sort((a, b) => b.date - a.date).slice(0, 6);
  }, [subscriptions, history]);

  // Auto Renewal counts
  const autoRenewEnabled  = subscriptions.filter(s => s.autoRenewal).length;
  const autoRenewDisabled = subscriptions.length - autoRenewEnabled;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="stats-grid">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="stat-card" />)}
        </div>
        <div className={styles.rowGrid2}>
          <Skeleton variant="card" height={320} />
          <Skeleton variant="card" height={320} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Section 1: Welcome Banner */}
      <HeroHeader
        breadcrumb="Dashboard"
        title={`${greeting}, ${user?.name?.split(' ')[0] || 'there'} 👋`}
        subtitle="Here's your subscription overview for today."
        action={
          <Link to="/add-subscription" className={styles.addBtn}>
            <Sparkles size={15} />
            Add Subscription
          </Link>
        }
      />

      <div className={styles.pageContent}>
        {/* Section 2: Summary Cards */}
        <div className="stats-grid">
        <StatCard
          title="Total Subscriptions"
          value={subscriptions.length}
          icon={CreditCard}
          color="blue"
          to="/subscriptions"
          className="delay-1"
        />
        <StatCard
          title="Active"
          value={activeSubscriptions.length}
          icon={CheckCircle}
          color="green"
          to="/subscriptions?status=Active_All"
          className="delay-2"
        />
        <StatCard
          title="Expiring Soon"
          value={expiringSoon.length}
          icon={AlertTriangle}
          color="orange"
          to="/subscriptions?status=Expiring Soon"
          className="delay-3"
        />
        <StatCard
          title="Current Month Spend"
          value={formatCurrency(Math.round(monthlyTotal))}
          icon={TrendingUp}
          color="purple"
          to="/subscriptions?sort=cost-desc"
          className="delay-4"
        />
      </div>

      {/* Row 2: Priority Renewals & Upcoming Payments */}
      <div className={`${styles.rowGrid2} animate-fade-in delay-5`}>
        {/* Priority Renewals */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>🔔 Priority Renewals</h2>
            <Link to="/subscriptions?priority=true" className={styles.viewAllLink}>
              View All <ArrowRight size={13} />
            </Link>
          </div>

          {priorityRenewals.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>🎉</div>
              <p className={styles.emptyStateText}>No renewals require attention today.</p>
            </div>
          ) : (
            <ul className={styles.list}>
              {priorityRenewals.map(sub => (
                <div key={sub.id} onClick={() => setSelectedSubscription(sub)} className={styles.listItem}>
                  <div className={styles.itemLeft}>
                    <ServiceLogo serviceName={sub.serviceName} size={36} />
                    <div className={styles.itemInfo}>
                      <p className={styles.itemName}>{sub.serviceName}</p>
                      <p className={styles.itemMeta}>
                        {sub.category} · {expiryLabel(sub.expiryDate)}
                      </p>
                    </div>
                  </div>
                  <div className={styles.itemRight}>
                    <p className={styles.itemCost}>{formatCurrency(sub.cost)}</p>
                    <span className={styles.renewBtn}>
                      Renew <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              ))}
            </ul>
          )}
        </div>

        {/* Upcoming Payments */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>📅 Upcoming Payments</h2>
            <Link to="/subscriptions?sort=expiryDate-asc" className={styles.viewAllLink}>
              View All <ArrowRight size={13} />
            </Link>
          </div>

          {upcomingPayments.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>📅</div>
              <p className={styles.emptyStateText}>No upcoming payments.</p>
            </div>
          ) : (
            <ul className={styles.list}>
              {upcomingPayments.map(sub => (
                <div key={sub.id} onClick={() => setSelectedSubscription(sub)} className={styles.listItem}>
                  <div className={styles.itemLeft}>
                    <ServiceLogo serviceName={sub.serviceName} website={sub.website} size={32} />
                    <div className={styles.itemInfo}>
                      <h4 className={styles.itemName}>{sub.serviceName}</h4>
                      <p className={styles.itemMeta}>{formatDate(sub.expiryDate)}</p>
                    </div>
                  </div>
                  <div className={styles.itemRight}>
                    <span className={styles.itemCost}>{formatCurrency(sub.cost)}</span>
                  </div>
                </div>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Row 3: Categories, Auto Renewal, Recent Activity */}
      <div className={`${styles.rowGrid3} animate-fade-in delay-7`}>
        {/* Subscription Categories */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>📁 Categories</h2>
          </div>
          {categoriesList.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>📁</div>
              <p className={styles.emptyStateText}>No active categories found.</p>
            </div>
          ) : (
            <div className={styles.categoriesGrid}>
              {categoriesList.map((cat, i) => (
                <CategoryCard key={cat.category} category={cat.category} count={cat.count} delay={i * 50} />
              ))}
            </div>
          )}
        </div>

        {/* Auto Renewal */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>🔄 Auto Renewal</h2>
          </div>
          <div className={styles.autoRenewFlex}>
            <Link to="/subscriptions?autoRenew=true" className={`${styles.autoRenewRow} ${styles.enabled}`}>
              <span className={styles.autoRenewLabel}>
                <CheckCircle size={16} color="var(--success-500)" /> Enabled
              </span>
              <span className={styles.autoRenewCount}>{autoRenewEnabled}</span>
            </Link>
            <Link to="/subscriptions?autoRenew=false" className={`${styles.autoRenewRow} ${styles.disabled}`}>
              <span className={styles.autoRenewLabel}>
                <AlertCircle size={16} color="var(--text-muted)" /> Disabled
              </span>
              <span className={styles.autoRenewCount}>{autoRenewDisabled}</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>🕒 Recent Activity</h2>
            <Link to="/history" className={styles.viewAllLink}>
              History <ArrowRight size={13} />
            </Link>
          </div>
          {recentActivities.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>🕒</div>
              <p className={styles.emptyStateText}>No activity in the last 30 days.</p>
            </div>
          ) : (
            <div className={styles.timeline}>
              {recentActivities.map(act => (
                <div
                  key={act.id}
                  onClick={() => setSelectedSubscription(subscriptions.find(s => s.id === act.subId))}
                  className={styles.timelineItem}
                >
                  <div className={styles.timelineDot} style={{ borderColor: act.color }} />
                  <p className={styles.activityText}>{act.text}</p>
                  <p className={styles.activityTime}>{formatDistanceToNow(act.date)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <SubscriptionDetailModal
        isOpen={Boolean(selectedSubscription)}
        onClose={() => setSelectedSubscription(null)}
        subscription={selectedSubscription}
      />
      </div>
    </div>
  );
};

export default DashboardPage;
