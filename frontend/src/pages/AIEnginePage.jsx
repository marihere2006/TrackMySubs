// ============================================================
// AI Engine Page — Premium Redesign
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Activity, AlertTriangle, Lightbulb, TrendingUp,
  CheckCircle, Zap, Clock, DollarSign, Shield, ChevronDown,
  ChevronUp, MessageSquare, BarChart2, RefreshCw, Info,
  ArrowRight, Sparkles
} from 'lucide-react';
import {
  getTimeline, getAiDashboard
} from '../services/aiService';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import AiChatWidget from '../components/AiChatWidget';
import SimulationPanel from '../components/SimulationPanel';
import { useSubscriptions } from '../context/SubscriptionContext';
import { formatCurrency } from '../utils/formatUtils';
import styles from './AIEnginePage.module.css';

// ── Chart colors ──────────────────────────────────────────
const CHART_COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#0ea5e9'];

// ── Animated Health Score Ring ────────────────────────────
const HealthRing = ({ score }) => {
  const [animated, setAnimated] = useState(false);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated ? (score / 100) * circumference : circumference);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, [score]);

  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Fair' : 'Needs Work';

  return (
    <div className={styles.ringContainer}>
      <svg width={130} height={130} viewBox="0 0 130 130" className={styles.ringSvg}>
        <circle cx={65} cy={65} r={radius} fill="none" stroke="var(--border-color)" strokeWidth={10} />
        <circle
          cx={65} cy={65} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 65 65)"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)', filter: `drop-shadow(0 0 8px ${color}88)` }}
        />
      </svg>
      <div className={styles.ringCenter}>
        <span className={styles.ringScore} style={{ color }}>{score}</span>
        <span className={styles.ringLabel} style={{ color }}>{label}</span>
      </div>
    </div>
  );
};

// ── Priority Badge ────────────────────────────────────────
const PriorityBadge = ({ text }) => {
  const lower = (text || '').toLowerCase();
  let cls = styles.badgeInfo;
  if (lower.includes('critical')) cls = styles.badgeCritical;
  else if (lower.includes('high'))   cls = styles.badgeHigh;
  else if (lower.includes('medium')) cls = styles.badgeMedium;
  else if (lower.includes('low'))    cls = styles.badgeLow;
  return <span className={`${styles.priorityBadge} ${cls}`}>{text}</span>;
};

// ── Confidence Meter ──────────────────────────────────────
const ConfidenceMeter = ({ value }) => (
  <div className={styles.confidenceMeter}>
    <div className={styles.confidenceBar}>
      <div
        className={styles.confidenceFill}
        style={{
          width: `${value}%`,
          background: value >= 80 ? 'var(--success-500)' : value >= 60 ? 'var(--warning-500)' : 'var(--danger-500)',
        }}
      />
    </div>
    <span className={styles.confidenceVal}>{value}%</span>
  </div>
);

// ── Section Card ──────────────────────────────────────────
const SectionCard = ({ title, icon: Icon, iconColor, children, className = '', badge }) => (
  <motion.div
    className={`${styles.card} ${className}`}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
  >
    <div className={styles.cardHeader}>
      <div className={styles.cardTitleRow}>
        <div className={styles.cardIconWrap} style={{ background: `${iconColor}18`, border: `1px solid ${iconColor}30` }}>
          <Icon size={17} color={iconColor} />
        </div>
        <h3 className={styles.cardTitle}>{title}</h3>
        {badge && <span className={styles.cardBadge}>{badge}</span>}
      </div>
    </div>
    {children}
  </motion.div>
);

// ── Loading shimmer ───────────────────────────────────────
const AILoadingScreen = () => (
  <div className={styles.loadingScreen}>
    <div className={styles.loadingOrb}>
      <Bot size={32} color="var(--primary-400)" />
    </div>
    <h3 className={styles.loadingTitle}>AI Copilot is analyzing…</h3>
    <p className={styles.loadingSubtitle}>Scanning your subscriptions and generating insights</p>
    <div className={styles.loadingDots}>
      {[0, 1, 2].map(i => (
        <div key={i} className={styles.loadingDot} style={{ animationDelay: `${i * 200}ms` }} />
      ))}
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────
const AIEnginePage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    copilot: null, insights: null, recommendations: [],
    forecast: null, healthScore: null, alerts: [], timeline: []
  });
  const [expandedRec, setExpandedRec] = useState(null);
  const { activeSubscriptions, subscriptions } = useSubscriptions();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardData, timeline] = await Promise.all([
          getAiDashboard().catch(() => null),
          getTimeline().catch(() => []),
        ]);
        if (dashboardData) {
          setData({
            copilot: dashboardData.copilotSummary,
            insights: dashboardData.insights,
            recommendations: dashboardData.recommendations || [],
            forecast: dashboardData.forecast,
            healthScore: dashboardData.healthScore,
            alerts: dashboardData.alerts || [],
            timeline
          });
        } else {
          setData(prev => ({ ...prev, timeline }));
        }
      } catch (err) {
        console.error('Failed to load AI data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <AILoadingScreen />;

  const { copilot, insights, recommendations, forecast, healthScore, alerts, timeline } = data;

  // Category pie data
  const pieData = insights?.categoryPercentages
    ? Object.entries(insights.categoryPercentages).map(([name, value]) => ({ name, value }))
    : [];

  // Forecast bar data
  const forecastData = forecast ? [
    { period: 'Next Month', amount: Number(forecast.nextMonth) || 0 },
    { period: '3 Months', amount: Number(forecast.next3Months) || 0 },
    { period: 'Yearly', amount: Number(forecast.nextYear) || 0 },
  ] : [];

  return (
    <div className={styles.page}>

      {/* ── AI Copilot Hero Banner ────────────────────── */}
      {copilot && (
        <motion.div
          className={styles.heroCard}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.heroGlow} />
          <div className={styles.heroContent}>
            <div className={styles.heroLeft}>
              <div className={styles.heroBotIcon}>
                <Sparkles size={22} />
              </div>
              <div>
                <div className={styles.heroGreeting}>{copilot.greeting}</div>
                <div className={styles.heroSummary}>{copilot.summaryText}</div>
                {copilot.bulletPoints && (
                  <ul className={styles.heroBullets}>
                    {copilot.bulletPoints.map((bp, i) => (
                      <li key={i} className={styles.heroBullet}>
                        <CheckCircle size={13} />
                        {bp}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className={styles.heroRight}>
              <div className={styles.heroStatBox}>
                <span className={styles.heroStatLabel}>Monthly Spend</span>
                <span className={styles.heroStatValue}>
                  {insights ? formatCurrency(insights.totalMonthlySpending) : '—'}
                </span>
              </div>
              <div className={styles.heroStatBox}>
                <span className={styles.heroStatLabel}>Subscriptions</span>
                <span className={styles.heroStatValue}>{activeSubscriptions.length}</span>
              </div>
              <div className={styles.heroStatBox}>
                <span className={styles.heroStatLabel}>Health Score</span>
                <span className={styles.heroStatValue} style={{ color: 'var(--success-400)' }}>
                  {healthScore?.healthScore ?? '—'}/100
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Main Grid ────────────────────────────────── */}
      <div className={styles.mainGrid}>

        {/* ── Health Score ──────────────────────────── */}
        {healthScore && (
          <SectionCard title="Health Score" icon={Activity} iconColor="var(--success-500)">
            <div className={styles.healthContent}>
              <HealthRing score={healthScore.healthScore} />
              <p className={styles.healthReason}>{healthScore.reason}</p>
              {healthScore.breakdown?.length > 0 && (
                <div className={styles.breakdownList}>
                  {healthScore.breakdown.map((item, i) => (
                    <div key={i} className={styles.breakdownItem}>
                      <span className={`${styles.breakdownPoints} ${String(item.points).startsWith('+') ? styles.bpPositive : styles.bpNegative}`}>
                        {item.points}
                      </span>
                      <span className={styles.breakdownDesc}>{item.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* ── Smart Alerts ──────────────────────────── */}
        <SectionCard
          title="Smart Alerts"
          icon={AlertTriangle}
          iconColor="var(--warning-500)"
          badge={alerts?.length ? alerts.length : undefined}
        >
          <div className={styles.alertList}>
            {alerts?.length > 0 ? alerts.map((alert, i) => {
              const lower = (alert.priority || '').toLowerCase();
              let accent = '#6366f1';
              if (lower.includes('critical')) accent = '#ef4444';
              else if (lower.includes('high'))   accent = '#f97316';
              else if (lower.includes('medium')) accent = '#f59e0b';
              else if (lower.includes('low'))    accent = '#22c55e';
              return (
                <div key={i} className={styles.alertItem} style={{ borderLeftColor: accent }}>
                  <div className={styles.alertTop}>
                    <PriorityBadge text={alert.priority} />
                    <span className={styles.alertTarget}>{alert.target}</span>
                    {alert.price && <span className={styles.alertPrice}>{alert.price}</span>}
                  </div>
                  <p className={styles.alertMessage}>{alert.message}</p>
                </div>
              );
            }) : (
              <div className={styles.emptyCard}>
                <CheckCircle size={28} color="var(--success-500)" />
                <p>No active alerts. You're all caught up!</p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── AI Timeline ───────────────────────────── */}
        {timeline?.length > 0 && (
          <SectionCard title="AI Activity" icon={Clock} iconColor="var(--primary-400)">
            <div className={styles.timeline}>
              {timeline.map((event, i) => (
                <div key={i} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineBody}>
                    <p className={styles.timelineAction}>{event.action}</p>
                    <span className={styles.timelineTime}>{event.timeframe}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* ── Spending Forecast ─────────────────────── */}
        {forecast && (
          <SectionCard title="Spending Forecast" icon={TrendingUp} iconColor="var(--violet-500)">
            <div className={styles.forecastMeta}>
              <span>Confidence: <strong>{forecast.confidence}%</strong></span>
            </div>
            <div className={styles.forecastBars}>
              {forecastData.map((d, i) => (
                <div key={i} className={styles.forecastRow}>
                  <span className={styles.forecastPeriod}>{d.period}</span>
                  <div className={styles.forecastBarWrap}>
                    <div
                      className={styles.forecastBar}
                      style={{ width: `${Math.min((d.amount / (forecastData[2]?.amount || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className={styles.forecastAmt}>{formatCurrency(d.amount)}</span>
                </div>
              ))}
            </div>
            {forecast.reasons?.length > 0 && (
              <ul className={styles.forecastReasons}>
                {forecast.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}
          </SectionCard>
        )}

        {/* ── Category Distribution Chart ───────────── */}
        {pieData.length > 0 && (
          <SectionCard title="Category Distribution" icon={BarChart2} iconColor="var(--info-500)">
            <div className={styles.pieWrap}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.pieLegend}>
                {pieData.map((d, i) => (
                  <div key={i} className={styles.pieLegendItem}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0, display: 'inline-block' }} />
                    <span className={styles.pieLegendName}>{d.name}</span>
                    <span className={styles.pieLegendVal}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        )}

      </div>

      {/* ── Recommendations ──────────────────────────── */}
      <SectionCard
        title="AI Recommendations"
        icon={Lightbulb}
        iconColor="var(--amber-500)"
        badge={recommendations?.length || undefined}
        className={styles.fullWidth}
      >
        {recommendations?.length > 0 ? (
          <div className={styles.recGrid}>
            {recommendations.map((rec, i) => (
              <div key={i} className={styles.recCard}>
                <div className={styles.recTop}>
                  <span className={styles.recPriority}>Priority {rec.priority}</span>
                  {rec.estimatedSavings && (
                    <span className={styles.recSavings}>{rec.estimatedSavings}</span>
                  )}
                </div>
                <div className={styles.recAction}>{rec.action}: <strong>{rec.targetSubscription}</strong></div>
                <p className={styles.recDesc}>{rec.description}</p>
                <ConfidenceMeter value={rec.confidence || 0} />
                <button
                  className={styles.recToggle}
                  onClick={() => setExpandedRec(expandedRec === i ? null : i)}
                >
                  {expandedRec === i ? 'Hide reason' : 'Why?'}
                  {expandedRec === i ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                <AnimatePresence>
                  {expandedRec === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className={styles.recReason}
                    >
                      {rec.reason}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyCard}>
            <CheckCircle size={28} color="var(--success-500)" />
            <p>Your subscriptions look optimal right now.</p>
          </div>
        )}
      </SectionCard>

      {/* ── AI Insights ──────────────────────────────── */}
      {insights?.suggestions?.length > 0 && (
        <SectionCard
          title="Financial Insights"
          icon={Info}
          iconColor="var(--teal-500)"
          className={styles.fullWidth}
        >
          <div className={styles.insightGrid}>
            <div className={styles.insightStats}>
              <div className={styles.insightStat}>
                <DollarSign size={18} color="var(--primary-400)" />
                <div>
                  <span className={styles.insightStatVal}>{formatCurrency(insights.totalMonthlySpending)}</span>
                  <span className={styles.insightStatLbl}>Monthly</span>
                </div>
              </div>
              <div className={styles.insightStat}>
                <TrendingUp size={18} color="var(--success-400)" />
                <div>
                  <span className={styles.insightStatVal}>{formatCurrency(insights.totalYearlySpending)}</span>
                  <span className={styles.insightStatLbl}>Yearly</span>
                </div>
              </div>
              <div className={styles.insightStat}>
                <Shield size={18} color="var(--warning-400)" />
                <div>
                  <span className={styles.insightStatVal}>{insights.highestExpense}</span>
                  <span className={styles.insightStatLbl}>Highest</span>
                </div>
              </div>
            </div>
            <ul className={styles.insightList}>
              {insights.suggestions.map((s, i) => (
                <li key={i} className={styles.insightItem}>
                  <Zap size={13} color="var(--primary-400)" style={{ flexShrink: 0 }} />
                  {s.replace(/^[•\-\*]\s*/, '')}
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>
      )}

      {/* ── Simulation Panel ─────────────────────────── */}
      <SimulationPanel />

    </div>
  );
};

export default AIEnginePage;
