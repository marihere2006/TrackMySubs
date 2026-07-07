// ============================================================
// HeroHeader — Unified SaaS Header
// Matches sidebar design language (dark navy, gradient)
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Sun, Moon, Bell, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSubscriptions } from '../../context/SubscriptionContext';
import { useLayout } from '../../context/LayoutContext';
import { expiryLabel, daysUntilExpiry } from '../../utils/dateUtils';
import styles from './HeroHeader.module.css';

const HeroHeader = ({ title, subtitle, action, breadcrumb }) => {
  const { toggleTheme, isDark } = useTheme();
  const { notifications, notificationsDismissed, dismissNotifications } = useSubscriptions();
  const { toggleMobileMenu } = useLayout();
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const hasNotifs = !notificationsDismissed && notifications.length > 0;
  const expiringSoon = notifications.filter((s) => daysUntilExpiry(s.expiryDate) >= 0);
  const recentlyExpired = notifications.filter((s) => daysUntilExpiry(s.expiryDate) < 0);

  const handleNotifClick = () => {
    setShowNotifPanel((v) => !v);
    if (!showNotifPanel) {
      dismissNotifications();
    }
  };

  return (
    <header className={styles.heroHeader}>
      <div className={styles.bgOverlay} />
      
      <div className={styles.container}>
        {/* Left Side: Breadcrumb, Title, Subtitle */}
        <div className={styles.leftSide}>
          <div className={styles.topLine}>
            <button
              className={styles.menuBtn}
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            
            {breadcrumb && (
              <div className={styles.breadcrumbWrapper}>
                <span className={styles.brand}>TrackMySubs</span>
                <span className={styles.separator}>/</span>
                <span className={styles.breadcrumb}>{breadcrumb}</span>
              </div>
            )}
          </div>

          <div className={styles.heroText}>
            {title && <h1 className={styles.title}>{title}</h1>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>

        {/* Right Side: Global Tools & Page Action */}
        <div className={styles.rightSide}>
          <div className={styles.globalActions}>
            <button
              className={styles.iconBtn}
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className={styles.notifWrapper}>
              <button
                className={`${styles.iconBtn} ${hasNotifs ? styles.hasNotif : ''}`}
                onClick={handleNotifClick}
                aria-label="Notifications"
                aria-expanded={showNotifPanel}
              >
                <Bell size={18} />
                {hasNotifs && (
                  <span className={styles.notifCount}>{notifications.length}</span>
                )}
              </button>

              {showNotifPanel && (
                <div className={styles.notifPanel}>
                  <div className={styles.notifHeader}>
                    <span>Notifications</span>
                    <button
                      className={styles.closeNotif}
                      onClick={() => setShowNotifPanel(false)}
                      aria-label="Close"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <p className={styles.noNotif}>All subscriptions are up to date ✓</p>
                  ) : (
                    <ul className={styles.notifList}>
                      {expiringSoon.length > 0 && (
                        <li className={styles.notifSection}>EXPIRING SOON</li>
                      )}
                      {expiringSoon.map((sub) => (
                        <li key={sub.id} className={styles.notifItem}>
                          <div className={styles.notifContent}>
                            <p className={styles.notifTitle}>{sub.serviceName}</p>
                            <p className={styles.notifSub} style={{ color: 'var(--warning-600)' }}>
                              {expiryLabel(sub.expiryDate)}
                            </p>
                          </div>
                        </li>
                      ))}
                      {recentlyExpired.length > 0 && (
                        <li className={styles.notifSection}>RECENTLY EXPIRED</li>
                      )}
                      {recentlyExpired.map((sub) => (
                        <li key={sub.id} className={styles.notifItem}>
                          <div className={styles.notifContent}>
                            <p className={styles.notifTitle}>{sub.serviceName}</p>
                            <p className={styles.notifSub} style={{ color: 'var(--danger-600)' }}>
                              {expiryLabel(sub.expiryDate)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className={styles.notifFooter}>
                    <Link
                      to="/dashboard"
                      onClick={() => setShowNotifPanel(false)}
                      className={styles.viewAll}
                    >
                      View all on Dashboard →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {action && (
            <div className={styles.pageAction}>
              {action}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeroHeader;
