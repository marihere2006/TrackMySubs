// ============================================================
// StatCard — Dashboard statistics card
// ============================================================

import { Link } from 'react-router-dom';
import styles from './StatCard.module.css';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend, className = '', to }) => {
  const colorMap = {
    blue: { bg: 'rgba(59,130,246,0.1)', icon: '#3b82f6', border: 'rgba(59,130,246,0.2)' },
    green: { bg: 'rgba(34,197,94,0.1)', icon: '#22c55e', border: 'rgba(34,197,94,0.2)' },
    red: { bg: 'rgba(239,68,68,0.1)', icon: '#ef4444', border: 'rgba(239,68,68,0.2)' },
    orange: { bg: 'rgba(245,158,11,0.1)', icon: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
    purple: { bg: 'rgba(139,92,246,0.1)', icon: '#8b5cf6', border: 'rgba(139,92,246,0.2)' },
    teal: { bg: 'rgba(20,184,166,0.1)', icon: '#14b8a6', border: 'rgba(20,184,166,0.2)' },
  };
  const c = colorMap[color] || colorMap.blue;

  const content = (
    <>
      <div className={styles.header}>
        <div className={styles.iconWrap} style={{ background: c.bg, border: `1px solid ${c.border}` }}>
          {Icon && <Icon size={20} color={c.icon} strokeWidth={2} />}
        </div>
        {trend !== undefined && (
          <span className={`${styles.trend} ${trend >= 0 ? styles.trendUp : styles.trendDown}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className={styles.value}>{value}</div>
      <div className={styles.title}>{title}</div>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
    </>
  );

  const containerClasses = `${styles.card} animate-fade-in ${to ? styles.clickable : ''} ${className}`;

  if (to) {
    return (
      <Link to={to} className={containerClasses}>
        {content}
      </Link>
    );
  }

  return (
    <div className={containerClasses}>
      {content}
    </div>
  );
};

export default StatCard;
