// ============================================================
// Button - Premium Reusable UI Component
// ============================================================

import { Check, X } from 'lucide-react';
import styles from './Button.module.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  success = false,
  error = false,
  successText,
  errorText,
  onClick,
  type = 'button',
  className = '',
  ...rest
}) => {
  const classes = [
    styles.btn,
    styles[`btn-${variant}`],
    size !== 'md' && styles[`btn-${size}`],
    fullWidth && styles['btn-full'],
    loading && styles['btn-loading'],
    success && styles['btn-success-state'],
    error && styles['btn-error-state'],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  let content = children;
  if (loading) {
    content = <span className={styles.loadingText}>{children}</span>;
  } else if (success) {
    content = <span>{successText || 'Success'}</span>;
  } else if (error) {
    content = <span>{errorText || 'Error'}</span>;
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {success && <Check size={14} aria-hidden="true" />}
      {error && <X size={14} aria-hidden="true" />}
      {Icon && iconPosition === 'left' && !loading && !success && !error && <Icon size={15} />}
      {content}
      {Icon && iconPosition === 'right' && !loading && !success && !error && <Icon size={15} />}
    </button>
  );
};

export default Button;
