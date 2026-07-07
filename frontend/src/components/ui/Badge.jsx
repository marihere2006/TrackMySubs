// ============================================================
// Badge — Status indicator component
// ============================================================

import styles from './Badge.module.css';

const variantMap = {
  'Active': 'success',
  'Expired': 'danger',
  'Expiring Soon': 'warning',
  'success': 'success',
  'danger': 'danger',
  'warning': 'warning',
  'info': 'info',
  'purple': 'purple',
  'default': 'default',
};

const Badge = ({ label, variant, dot = false, className = '' }) => {
  const v = variant || variantMap[label] || 'default';
  return (
    <span className={`${styles.badge} ${styles[`badge-${v}`]} ${className}`}>
      {dot && <span className={styles.dot} />}
      {label}
    </span>
  );
};

export default Badge;
