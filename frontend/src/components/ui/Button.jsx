// ============================================================
// Button — Premium Reusable UI Component
// ============================================================

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
    className,
  ]
    .filter(Boolean)
    .join(' ');

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
      {Icon && iconPosition === 'left' && !loading && <Icon size={15} />}
      <span className={loading ? styles.loadingText : undefined}>{children}</span>
      {Icon && iconPosition === 'right' && !loading && <Icon size={15} />}
    </button>
  );
};

export default Button;
