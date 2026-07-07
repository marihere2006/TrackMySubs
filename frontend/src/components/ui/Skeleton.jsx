// ============================================================
// Skeleton — Animated shimmer loader component
// ============================================================

import styles from './Skeleton.module.css';

/**
 * Skeleton variants:
 *  - text: single line shimmer (default)
 *  - rect: block area (cards, table rows)
 *  - circle: circular avatar/icon
 *  - stat-card: full stat card skeleton
 */
const Skeleton = ({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
}) => {
  const items = Array.from({ length: count });

  if (variant === 'stat-card') {
    return (
      <div className={`${styles.statCard} ${className}`}>
        <div className={styles.statCardTop}>
          <div className={`${styles.shimmer} ${styles.circle}`} style={{ width: 44, height: 44 }} />
        </div>
        <div className={`${styles.shimmer} ${styles.text}`} style={{ width: '60%', height: 32, marginBottom: 8 }} />
        <div className={`${styles.shimmer} ${styles.text}`} style={{ width: '80%', height: 14 }} />
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <>
        {items.map((_, i) => (
          <tr key={i} className={styles.tableRow}>
            <td style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div className={`${styles.shimmer} ${styles.circle}`} style={{ width: 32, height: 32 }} />
                <div className={`${styles.shimmer} ${styles.text}`} style={{ width: 120, height: 14 }} />
              </div>
            </td>
            {[80, 60, 90, 90, 70, 60].map((w, j) => (
              <td key={j} style={{ padding: '14px 16px' }}>
                <div className={`${styles.shimmer} ${styles.text}`} style={{ width: w, height: 14 }} />
              </td>
            ))}
          </tr>
        ))}
      </>
    );
  }

  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          className={`${styles.shimmer} ${styles[variant]} ${className}`}
          style={{ width, height }}
        />
      ))}
    </>
  );
};

export default Skeleton;
