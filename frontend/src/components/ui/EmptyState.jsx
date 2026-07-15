// ============================================================
// EmptyState — Reusable empty state component
// ============================================================

import { Link, useNavigate } from 'react-router-dom';
import styles from './EmptyState.module.css';
import Button from './Button';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  className = '',
}) => {
  const navigate = useNavigate();

  return (
    <div className={`${styles.wrap} ${className}`}>
      {Icon && (
        <div className={styles.iconWrap}>
          <Icon size={36} strokeWidth={1.5} />
        </div>
      )}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {actionLabel && (actionTo || onAction) && (
        <div className={styles.actionWrap}>
          <Button
            onClick={actionTo ? () => navigate(actionTo) : onAction}
            variant="primary"
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
