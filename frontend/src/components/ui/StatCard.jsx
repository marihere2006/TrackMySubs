// ============================================================
// StatCard — Premium Dashboard Statistics Card
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import styles from './StatCard.module.css';

// Animated number counter hook
const useCountUp = (target, duration = 800) => {
  const [count, setCount] = useState(null);
  const startRef = useRef(null);

  useEffect(() => {
    const numeric = typeof target === 'number' ? target : parseFloat(String(target).replace(/[^0-9.]/g, ''));
    if (isNaN(numeric)) { setCount(target); return; }

    const start = performance.now();
    startRef.current = start;

    const step = (now) => {
      if (startRef.current !== start) return;
      const progress = Math.min((now - start) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * numeric);
      setCount(current);
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };

    requestAnimationFrame(step);
    return () => { startRef.current = null; };
  }, [target, duration]);

  return count ?? target;
};

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend, trendLabel, className = '', to }) => {
  const colorMap = {
    blue:   { bg: 'rgba(99,102,241,0.1)',  icon: 'var(--primary-500)',  border: 'rgba(99,102,241,0.2)',  glow: 'rgba(99,102,241,0.15)'  },
    green:  { bg: 'rgba(34,197,94,0.1)',   icon: 'var(--success-500)',  border: 'rgba(34,197,94,0.2)',   glow: 'rgba(34,197,94,0.15)'   },
    red:    { bg: 'rgba(239,68,68,0.1)',   icon: 'var(--danger-500)',   border: 'rgba(239,68,68,0.2)',   glow: 'rgba(239,68,68,0.15)'   },
    orange: { bg: 'rgba(245,158,11,0.1)',  icon: 'var(--warning-500)',  border: 'rgba(245,158,11,0.2)',  glow: 'rgba(245,158,11,0.15)'  },
    purple: { bg: 'rgba(168,85,247,0.1)',  icon: 'var(--purple-500)',   border: 'rgba(168,85,247,0.2)',  glow: 'rgba(168,85,247,0.15)'  },
    teal:   { bg: 'rgba(20,184,166,0.1)',  icon: 'var(--teal-500)',     border: 'rgba(20,184,166,0.2)',  glow: 'rgba(20,184,166,0.15)'  },
    pink:   { bg: 'rgba(236,72,153,0.1)',  icon: 'var(--pink-500)',     border: 'rgba(236,72,153,0.2)',  glow: 'rgba(236,72,153,0.15)'  },
    sky:    { bg: 'rgba(14,165,233,0.1)',  icon: 'var(--info-500)',     border: 'rgba(14,165,233,0.2)',  glow: 'rgba(14,165,233,0.15)'  },
  };
  const c = colorMap[color] || colorMap.blue;

  const content = (
    <>
      <div className={styles.header}>
        <div
          className={styles.iconWrap}
          style={{ background: c.bg, border: `1px solid ${c.border}` }}
        >
          {Icon && <Icon size={20} color={c.icon} strokeWidth={2} />}
        </div>
        {trend !== undefined && (
          <span className={`${styles.trend} ${trend >= 0 ? styles.trendUp : styles.trendDown}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
            {trendLabel && <span className={styles.trendLabel}>{trendLabel}</span>}
          </span>
        )}
      </div>
      <div className={styles.value} style={{ color: c.icon }}>
        {value}
      </div>
      <div className={styles.title}>{title}</div>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
    </>
  );

  const containerClasses = `${styles.card} animate-fade-in ${to ? styles.clickable : ''} ${className}`;
  const hoverStyle = { '--card-glow': c.glow };

  if (to) {
    return (
      <Link to={to} className={containerClasses} style={hoverStyle}>
        {content}
      </Link>
    );
  }

  return (
    <div className={containerClasses} style={hoverStyle}>
      {content}
    </div>
  );
};

export default StatCard;
