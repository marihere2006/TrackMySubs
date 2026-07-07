// ============================================================
// Subscription History Page — Timeline UI (TrackMySubs)
// Labels: "Current" (expiryDate >= today) | "Previous Period"
// Service header shows Active / Expired status badge
// ============================================================

import { useMemo } from 'react';
import { History as HistoryIcon, ArrowRight } from 'lucide-react';
import { useSubscriptions } from '../context/SubscriptionContext';
import { formatDate } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatUtils';
import HeroHeader from '../components/layout/HeroHeader';
import ServiceLogo from '../components/ui/ServiceLogo';
import styles from './HistoryPage.module.css';

// Today's date string YYYY-MM-DD for comparison
const todayISO = () => new Date().toISOString().split('T')[0];

const HistoryPage = () => {
  const { history, subscriptions } = useSubscriptions();
  const today = todayISO();

  // Group history records by service name
  const grouped = useMemo(() => {
    const map = {};

    // Add historical (past) periods from history context
    history.forEach((h) => {
      if (!map[h.serviceName]) {
        map[h.serviceName] = {
          serviceName: h.serviceName,
          category: h.category,
          records: [],
        };
      }
      map[h.serviceName].records.push({
        id: h.id,
        subscriptionId: h.subscriptionId,
        serviceName: h.serviceName,
        category: h.category,
        cost: h.cost,
        currency: h.currency,
        startDate: h.startDate,
        endDate: h.expiryDate,
        // Mark as "current" if this past record's endDate is still in the future
        isCurrent: h.expiryDate >= today,
      });
    });

    // Also inject current subscription periods
    subscriptions.forEach((sub) => {
      const key = sub.serviceName;
      if (!map[key]) {
        map[key] = { serviceName: sub.serviceName, category: sub.category, records: [] };
      }
      map[key].records.push({
        id: `current-${sub.id}`,
        subscriptionId: sub.id,
        serviceName: sub.serviceName,
        category: sub.category,
        cost: sub.cost,
        currency: sub.currency,
        startDate: sub.startDate,
        endDate: sub.expiryDate,
        isCurrent: sub.expiryDate >= today,
      });
    });

    // Sort records within each group: latest first
    Object.values(map).forEach((g) => {
      g.records.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

      // Deduplicate: if a history record and a subscription record share the same
      // startDate+endDate, keep only the one from subscriptions (isCurrent)
      const seen = new Set();
      g.records = g.records.filter((r) => {
        const key = `${r.startDate}|${r.endDate}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Determine if this service has any active (current) period
      g.hasActive = g.records.some((r) => r.isCurrent);
    });

    return Object.values(map).sort((a, b) =>
      a.serviceName.localeCompare(b.serviceName)
    );
  }, [history, subscriptions, today]);

  if (grouped.length === 0) {
    return (
      <div className={styles.page}>
        <HeroHeader
          breadcrumb="History"
          title="Subscription History"
          subtitle="Timeline of all your past and current subscription periods."
        />
        <div className={styles.emptyState}>
          <HistoryIcon size={48} />
          <p>No history yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <HeroHeader
        breadcrumb="History"
        title="Subscription History"
        subtitle="Timeline of all your past and current subscription periods."
      />

      <div className={styles.groups}>
        {grouped.map((group, gi) => (
          <div
            key={group.serviceName}
            className={`${styles.group} animate-fade-in`}
            style={{ animationDelay: `${gi * 80}ms` }}
          >
            {/* ── Group header */}
            <div className={styles.groupHeader}>
              <div className={styles.groupInfo} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <ServiceLogo serviceName={group.serviceName} size={40} />
                <div>
                  <h2 className={styles.groupName}>{group.serviceName}</h2>
                  <p className={styles.groupCat}>{group.category}</p>
                </div>
              </div>

              {/* Status badge — Active or Expired at service level */}
              <span
                className={`${styles.serviceStatus} ${
                  group.hasActive ? styles.statusActive : styles.statusExpired
                }`}
              >
                <span className={styles.statusDot} />
                {group.hasActive ? 'Active' : 'Expired'}
              </span>

              <span className={styles.periodCount}>
                {group.records.length} period{group.records.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* ── Timeline */}
            <div className={styles.timeline}>
              {group.records.map((record, ri) => {
                // Determine label: only ONE "Current" badge per service (for the
                // most-recent record that has isCurrent = true)
                const isCurrentEntry = record.isCurrent;
                const label = isCurrentEntry ? 'Current' : 'Previous Period';

                return (
                  <div key={record.id} className={styles.timelineItem}>
                    {/* Left rail — dot + connecting line */}
                    <div className={styles.timelineLeft}>
                      <div
                        className={`${styles.dot} ${
                          isCurrentEntry ? styles.dotActive : styles.dotPast
                        }`}
                      />
                      {ri < group.records.length - 1 && (
                        <div className={styles.line} />
                      )}
                    </div>

                    {/* Card content */}
                    <div
                      className={`${styles.timelineCard} ${
                        isCurrentEntry ? styles.cardCurrent : styles.cardPast
                      }`}
                    >
                      {/* Period label */}
                      <span
                        className={`${styles.periodLabel} ${
                          isCurrentEntry
                            ? styles.periodLabelCurrent
                            : styles.periodLabelPast
                        }`}
                      >
                        {label}
                      </span>

                      {/* Date range */}
                      <div className={styles.periodRow}>
                        <span className={styles.periodDate}>
                          {formatDate(record.startDate)}
                        </span>
                        <ArrowRight size={13} className={styles.periodArrow} />
                        <span className={styles.periodDate}>
                          {formatDate(record.endDate)}
                        </span>
                      </div>

                      {/* Cost */}
                      <div className={styles.periodMeta}>
                        <span className={styles.periodCost}>
                          {formatCurrency(record.cost, record.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryPage;
