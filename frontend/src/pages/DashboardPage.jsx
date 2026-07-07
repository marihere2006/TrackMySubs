// ============================================================
// Dashboard Page - Daily Control Center
// ============================================================

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard, CheckCircle, AlertTriangle, TrendingUp,
  ArrowRight, Calendar, AlertCircle, RefreshCw, PlusCircle
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
          color: '#10b981'
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
          color: '#3b82f6'
        });
      }
    });
    return acts.sort((a, b) => b.date - a.date).slice(0, 5);
  }, [subscriptions, history]);

  // Auto Renewal counts
  const autoRenewEnabled = subscriptions.filter(s => s.autoRenewal).length;
  const autoRenewDisabled = subscriptions.length - autoRenewEnabled;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return <div className={styles.page} style={{ padding: 40 }}><Skeleton width="100%" height={200} /><Skeleton width="100%" height={400} /></div>;
  }

  return (
    <div className={styles.page}>
      {/* Section 1: Welcome Banner */}
      <HeroHeader
        breadcrumb="Dashboard"
        title={`${greeting}, ${user?.name?.split(' ')[0] || 'there'} 👋`}
        subtitle="Here's what you need to do today."
        action={
          <Link to="/add-subscription" className={styles.addBtn}>
            + Add Subscription
          </Link>
        }
      />

      {/* Section 2: Summary Cards (Exactly 4) */}
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
          title="Active Subscriptions"
          value={activeSubscriptions.length}
          icon={CheckCircle}
          color="green"
          to="/subscriptions?status=Active"
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
          title="Monthly Expense"
          value={formatCurrency(Math.round(monthlyTotal))}
          icon={TrendingUp}
          color="purple"
          to="/subscriptions?sort=cost-desc"
          className="delay-4"
        />
      </div>

      {/* Row 2: Priority Renewals & Upcoming Payments */}
      <div className={styles.rowGrid2}>
        {/* Section 3: Priority Renewals */}
        <div className={`${styles.sectionCard} animate-fade-in delay-5`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Priority Renewals</h2>
            <Link to="/subscriptions?priority=true" className={styles.viewAllLink}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          
          {priorityRenewals.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>🎉</div>
              <p className={styles.emptyStateText}>No subscriptions require attention today.</p>
            </div>
          ) : (
            <ul className={styles.list}>
              {priorityRenewals.map(sub => (
                <div key={sub.id} onClick={() => setSelectedSubscription(sub)} className={styles.listItem} style={{ cursor: 'pointer' }}>
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
                      Renew <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              ))}
            </ul>
          )}
        </div>

        {/* Section 4: Upcoming Payments */}
        <div className={`${styles.sectionCard} animate-fade-in delay-6`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Upcoming Payments</h2>
            <Link to="/subscriptions?sort=expiryDate-asc" className={styles.viewAllLink}>
              View All <ArrowRight size={14} />
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
                <div key={sub.id} onClick={() => setSelectedSubscription(sub)} className={styles.listItem} style={{ cursor: 'pointer' }}>
                  <div className={styles.itemLeft}>
                    <ServiceLogo serviceName={sub.serviceName} size={32} />
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

      {/* Row 3: Insights & Activity */}
      <div className={styles.rowGrid3}>
        {/* Section 5: Subscription Categories */}
        <div className={`${styles.sectionCard} animate-fade-in delay-7`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Subscription Categories</h2>
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

        {/* Section 7: Auto Renewal */}
        <div className={`${styles.sectionCard} animate-fade-in delay-8`} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Auto Renewal</h2>
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

        {/* Section 6: Recent Activity */}
        <div className={`${styles.sectionCard} animate-fade-in delay-9`} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            <Link to="/history" className={styles.viewAllLink}>
              View History <ArrowRight size={14} />
            </Link>
          </div>
          
          {recentActivities.length === 0 ? (
            <div className={styles.emptyState} style={{ padding: '20px 0' }}>
              <div className={styles.emptyStateIcon} style={{ fontSize: '2rem' }}>🕒</div>
              <p className={styles.emptyStateText}>No activity in the last 30 days.</p>
            </div>
          ) : (
            <div className={styles.timeline}>
              {recentActivities.map(act => (
                <div 
                  key={act.id} 
                  onClick={() => setSelectedSubscription(subscriptions.find(s => s.id === act.subId))} 
                  className={styles.timelineItem} 
                  style={{ cursor: 'pointer', display: 'block' }}
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
  );
};

export default DashboardPage;
