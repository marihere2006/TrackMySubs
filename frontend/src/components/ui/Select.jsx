// ============================================================
// Select — Styled dropdown component
// ============================================================

import styles from './Input.module.css';

const Select = ({
  label,
  id,
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  error,
  hint,
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
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) =>
          typeof opt === 'string' ? (
            <option key={opt} value={opt}>{opt}</option>
          ) : (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          )
        )}
      </select>
      {error && <p className={styles.errorText}>{error}</p>}
      {hint && !error && <p className={styles.hint}>{hint}</p>}
    </div>
  );
};

export default Select;
