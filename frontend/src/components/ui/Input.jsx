// ============================================================
// Input — Styled form input with label and error support
// ============================================================

import styles from './Input.module.css';

const Input = ({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  hint,
  icon: Icon,
  required = false,
  disabled = false,
  className = '',
  ...rest
}) => {
  return (
    <div className={`${styles.field} ${className}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div className={styles.inputWrap}>
        {Icon && (
          <span className={styles.iconLeft}>
            <Icon size={16} />
          </span>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`${styles.input} ${Icon ? styles.hasIcon : ''} ${error ? styles.inputError : ''}`}
          {...rest}
        />
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
      {hint && !error && <p className={styles.hint}>{hint}</p>}
    </div>
  );
};

export default Input;
