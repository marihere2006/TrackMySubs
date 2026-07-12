// ============================================================
// Skeleton — Wave shimmer loading placeholders
// ============================================================

import styles from './Skeleton.module.css';

const Skeleton = ({
  width = '100%',
  height = 20,
  borderRadius,
  className = '',
  variant = 'default',
  count = 1,
}) => {
  if (variant === 'stat-card') {
    return (
      <div className={`${styles.statCard} ${className}`}>
        <div className={styles.statHeader}>
          <div className={`${styles.bone} ${styles.iconBox}`} />
        </div>
        <div className={`${styles.bone} ${styles.statValue}`} />
        <div className={`${styles.bone} ${styles.statTitle}`} />
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`${styles.card} ${className}`}>
        <div className={`${styles.bone} ${styles.cardTitle}`} />
        <div className={`${styles.bone} ${styles.cardSubtitle}`} />
        <div className={`${styles.bone} ${styles.cardBody}`} />
      </div>
    );
  }

  if (variant === 'list-item') {
    return Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`${styles.listItem} ${className}`}>
        <div className={`${styles.bone} ${styles.avatar}`} />
        <div className={styles.listContent}>
          <div className={`${styles.bone} ${styles.listTitle}`} />
          <div className={`${styles.bone} ${styles.listSubtitle}`} />
        </div>
        <div className={`${styles.bone} ${styles.listValue}`} />
      </div>
    ));
  }

  if (variant === 'table-row') {
    return Array.from({ length: count }).map((_, i) => (
      <tr key={i}>
        <td style={{ padding: '14px 16px' }}>
          <div className={styles.tableCell}>
            <div className={`${styles.bone} ${styles.tableAvatar}`} />
            <div className={`${styles.bone} ${styles.tableName}`} />
          </div>
        </td>
        <td style={{ padding: '14px 16px' }}><div className={`${styles.bone} ${styles.tableChip}`} /></td>
        <td style={{ padding: '14px 16px' }}><div className={`${styles.bone} ${styles.tableNum}`} /></td>
        <td style={{ padding: '14px 16px' }}><div className={`${styles.bone} ${styles.tableDate}`} /></td>
        <td style={{ padding: '14px 16px' }}><div className={`${styles.bone} ${styles.tableDate}`} /></td>
        <td style={{ padding: '14px 16px' }}><div className={`${styles.bone} ${styles.tableChip}`} /></td>
        <td style={{ padding: '14px 16px' }}><div className={`${styles.bone} ${styles.tableAction}`} /></td>
      </tr>
    ));
  }

  if (variant === 'chart') {
    return (
      <div className={`${styles.chart} ${className}`}>
        <div className={`${styles.bone} ${styles.chartTitle}`} />
        <div className={`${styles.bone} ${styles.chartArea}`} />
      </div>
    );
  }

  // Default — raw bone
  return Array.from({ length: count }).map((_, i) => (
    <div
      key={i}
      className={`${styles.bone} ${className}`}
      style={{
        width,
        height,
        borderRadius: borderRadius ?? 'var(--radius-sm)',
        marginBottom: count > 1 ? 8 : 0,
      }}
    />
  ));
};

export default Skeleton;
