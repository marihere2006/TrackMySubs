
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  PlusCircle,
  Clock,
  History,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { useAuth } from '../../context/AuthContext';
import { useSubscriptions } from '../../context/SubscriptionContext';
import { getInitials } from '../../utils/formatUtils';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/add-subscription', label: 'Add Subscription', icon: PlusCircle },
  { to: '/expired', label: 'Expired Plans', icon: Clock },
  { to: '/history', label: 'History', icon: History },
  { to: '/profile', label: 'Profile', icon: User },
];

const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const { user, logout } = useAuth();
  const { notifications, notificationsDismissed, dismissNotifications } = useSubscriptions();

  const handleLogout = async () => {
    await logout();
  };

  const hasNotifs = !notificationsDismissed && notifications.length > 0;

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className={styles.backdrop} onClick={onMobileClose} aria-hidden="true" />
      )}

      <aside
        className={[
          styles.sidebar,
          collapsed ? styles.collapsed : '',
          mobileOpen ? styles.mobileOpen : '',
        ].filter(Boolean).join(' ')}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Zap size={20} color="#fff" fill="#fff" />
          </div>
          {!collapsed && (
            <div className={styles.logoText}>
              <span className={styles.logoMain}>TrackMySubs</span>
            </div>
          )}
        </div>

        {/* Toggle button — desktop only */}
        <button
          className={styles.toggleBtn}
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Navigation */}
        <nav className={styles.nav} role="navigation">
          {!collapsed && (
            <p className={styles.navLabel}>MENU</p>
          )}
          <ul className={styles.navList}>
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={() => {
                    onMobileClose?.();
                    if (to === '/dashboard') dismissNotifications();
                  }}
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.active : ''}`
                  }
                  title={collapsed ? label : undefined}
                >
                  <span className={styles.navIcon}>
                    <Icon size={18} />
                    {/* Notification dot on dashboard if alerts exist */}
                    {to === '/dashboard' && hasNotifs && (
                      <span className={styles.notifDot} />
                    )}
                  </span>
                  {!collapsed && <span className={styles.navLabel2}>{label}</span>}
                  {!collapsed && to === '/dashboard' && hasNotifs && (
                    <span className={styles.badge}>{notifications.length}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {getInitials(user?.name || 'U')}
            </div>
            {!collapsed && (
              <div className={styles.userMeta}>
                <p className={styles.userName}>{user?.name || 'User'}</p>
                <p className={styles.userEmail}>{user?.email || ''}</p>
              </div>    
            )}
          </div>
          <button
            className={styles.logoutBtn}
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={16} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
