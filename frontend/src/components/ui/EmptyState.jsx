// ============================================================
// EmptyState — Reusable empty state component
// ============================================================

import { Link } from 'react-router-dom';
import styles from './EmptyState.module.css';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  className = '',
}) => {
  return (
    <div className={`${styles.wrap} ${className}`}>
      {Icon && (
        <div className={styles.iconWrap}>
          <Icon size={36} strokeWidth={1.5} />
        </div>
      )}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className={styles.actionBtn}>
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction} className={styles.actionBtn}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
