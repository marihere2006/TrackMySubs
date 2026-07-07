// ============================================================
// Button — Reusable UI Component
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
      {...rest}
    >
      {loading ? (
        <span className={styles.spinner} aria-label="Loading" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={16} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={16} />}
        </>
      )}
    </button>
  );
};

export default Button;
