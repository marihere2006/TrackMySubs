// ============================================================
// Analytics Page — Real Data from Analytics Snapshots API
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Treemap
} from 'recharts';
import { BarChart2, TrendingUp, PieChartIcon, Calendar, Clock } from 'lucide-react';
import { getAnalyticsSnapshots, getAnalyticsSummary } from '../services/aiService';
import { useSubscriptions } from '../context/SubscriptionContext';
import HeroHeader from '../components/layout/HeroHeader';
import Skeleton from '../components/ui/Skeleton';
import { formatCurrency } from '../utils/formatUtils';
import styles from './AnalyticsPage.module.css';

const COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#0ea5e9','#f97316','#06b6d4'];

const MIN_SNAPSHOTS_FOR_TREND = 3;

// ── Custom Tooltip ─────────────────────────────────────
const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} className={styles.tooltipRow}>
          <span style={{ color: p.color }}>{p.name}: </span>
          <strong>{currency ? formatCurrency(p.value) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// ── No Data State ──────────────────────────────────────
const NoDataState = ({ title, message }) => (
  <div className={styles.noData}>
    <Clock size={28} color="var(--text-muted)" />
    <p className={styles.noDataTitle}>{title}</p>
    <p className={styles.noDataText}>{message || 'Historical data is being collected. Trends will appear as you use the application.'}</p>
  </div>
);

// ── Chart Card ─────────────────────────────────────────
const ChartCard = ({ title, subtitle, children, className = '', index }) => (
  <motion.div
    className={`${styles.chartCard} ${className}`}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.05 }}
  >
    <div className={styles.chartHeader}>
      <h3 className={styles.chartTitle}>{title}</h3>
      {subtitle && <p className={styles.chartSubtitle}>{subtitle}</p>}
    </div>
    <div className={styles.chartBody}>
      {children}
    </div>
  </motion.div>
);

// ── Renewal Calendar Heatmap ───────────────────────────
const RenewalHeatmap = ({ subscriptions }) => {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() + i);
    return d;
  });

  const renewalsByMonth = useMemo(() => {
    const map = {};
    months.forEach(m => {
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
      map[key] = [];
    });
    subscriptions.forEach(s => {
      const exp = new Date(s.expiryDate);
      const key = `${exp.getFullYear()}-${String(exp.getMonth() + 1).padStart(2, '0')}`;
      if (map[key]) map[key].push(s);
    });
    return map;
  }, [subscriptions, months]);

  return (
    <div className={styles.heatmap}>
      {months.map((m, i) => {
        const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
        const items = renewalsByMonth[key] || [];
        const intensity = Math.min(items.length / 5, 1);
        return (
          <div
            key={i}
            className={styles.heatmapCell}
            style={{ '--intensity': intensity }}
            title={`${m.toLocaleString('default', { month: 'short', year: 'numeric' })}: ${items.length} renewals`}
          >
            <span className={styles.heatmapMonth}>
              {m.toLocaleString('default', { month: 'short' })}
            </span>
            <span className={styles.heatmapCount}>{items.length}</span>
          </div>
        );
      })}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────
const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState([]);
  const [summary, setSummary] = useState(null);
  const { subscriptions, activeSubscriptions, history, monthlyTotal } = useSubscriptions();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [snaps, sum] = await Promise.all([
          getAnalyticsSnapshots().catch(() => []),
          getAnalyticsSummary().catch(() => null),
        ]);
        setSnapshots(snaps || []);
        setSummary(sum);
      } catch (err) {
        console.error('Analytics fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Derived data from snapshots ─────────────────────
  const hasHistory = snapshots.length >= MIN_SNAPSHOTS_FOR_TREND;

  // Monthly spending trend
  const spendingTrend = useMemo(() => {
    if (!hasHistory) return [];
    return snapshots.slice(-12).map(s => ({
      month: new Date(s.snapshotDate).toLocaleString('default', { month: 'short', year: '2-digit' }),
      spending: Number(s.totalMonthlySpend?.toFixed(2) || 0),
      active: s.activeCount || 0,
    }));
  }, [snapshots, hasHistory]);

  // Category distribution (current)
  const categoryData = useMemo(() => {
    const map = {};
    activeSubscriptions.forEach(s => {
      const cat = s.category || 'Other';
      map[cat] = (map[cat] || 0) + Number(s.cost);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [activeSubscriptions]);

  // Top 10 expensive (current)
  const top10 = useMemo(() => {
    return [...activeSubscriptions]
      .sort((a, b) => Number(b.cost) - Number(a.cost))
      .slice(0, 10)
      .map(s => ({ name: s.serviceName, cost: Number(s.cost) }));
  }, [activeSubscriptions]);

  // Subscription count trend
  const countTrend = useMemo(() => {
    if (!hasHistory) return [];
    return snapshots.slice(-12).map(s => ({
      month: new Date(s.snapshotDate).toLocaleString('default', { month: 'short', year: '2-digit' }),
      total: s.totalCount || 0,
      active: s.activeCount || 0,
      expired: s.expiredCount || 0,
    }));
  }, [snapshots, hasHistory]);

  // Payment method distribution (current)
  const paymentMethodData = useMemo(() => {
    const map = {};
    activeSubscriptions.forEach(s => {
      const pm = s.paymentMethod || 'Other';
      map[pm] = (map[pm] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [activeSubscriptions]);

  // Monthly renewals from history
  const monthlyRenewals = useMemo(() => {
    const map = {};
    history.forEach(h => {
      const d = new Date(h.renewedOn || h.startDate);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .slice(-8)
      .map(([month, count]) => ({ month, count }));
  }, [history]);

  // Status distribution
  const statusData = useMemo(() => {
    const counts = subscriptions.reduce((acc, s) => {
      const st = s.computedStatus || 'Unknown';
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [subscriptions]);

  // Category spending trend from snapshots
  const categoryTrend = useMemo(() => {
    if (!hasHistory) return [];
    return snapshots.slice(-8).map(s => {
      let breakdown = {};
      if (s.categoryBreakdown) {
        try {
          breakdown = typeof s.categoryBreakdown === 'string'
            ? JSON.parse(s.categoryBreakdown)
            : s.categoryBreakdown;
        } catch (e) {
          console.error("Failed to parse categoryBreakdown", e);
        }
      }
      return {
        month: new Date(s.snapshotDate).toLocaleString('default', { month: 'short', year: '2-digit' }),
        ...breakdown,
      };
    });
  }, [snapshots, hasHistory]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set();
    activeSubscriptions.forEach(s => cats.add(s.category || 'Other'));
    return [...cats];
  }, [activeSubscriptions]);

  // Auto renewal breakdown (current)
  const autoRenewalData = useMemo(() => [
    { name: 'Auto Renewal On', value: activeSubscriptions.filter(s => s.autoRenewal).length },
    { name: 'Manual Renewal', value: activeSubscriptions.filter(s => !s.autoRenewal).length },
  ], [activeSubscriptions]);

  // Yearly projection
  const yearlyProjection = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      return {
        month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        projected: Math.round(monthlyTotal),
        cumulative: Math.round(monthlyTotal * (i + 1)),
      };
    });
    return months;
  }, [monthlyTotal]);

  // Usage frequency breakdown
  const usageData = useMemo(() => {
    const map = {};
    activeSubscriptions.forEach(s => {
      const uf = s.usageFrequency || 'Monthly';
      map[uf] = (map[uf] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [activeSubscriptions]);

  // Treemap — expense by category
  const treemapData = useMemo(() => categoryData.map((d, i) => ({
    name: d.name,
    size: d.value,
    fill: COLORS[i % COLORS.length],
  })), [categoryData]);

  if (loading) {
    return (
      <div className={styles.page}>
        <HeroHeader breadcrumb="Analytics" title="Analytics" subtitle="Loading your subscription insights..." />
        <div className={styles.pageContent}>
          <div className={styles.grid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} variant="chart" height={280} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <HeroHeader
        breadcrumb="Analytics"
        title="Analytics Dashboard"
        subtitle="Deep insights into your subscription spending and trends."
      />

      <div className={styles.pageContent}>
        {/* Summary Stats */}
        <div className={styles.summaryRow}>
        {[
          { label: 'Current Month', value: formatCurrency(monthlyTotal), color: 'var(--primary-500)' },
          { label: 'Active Subs', value: activeSubscriptions.length, color: 'var(--success-500)' },
          { label: 'Yearly Projection', value: formatCurrency(monthlyTotal * 12), color: 'var(--violet-500)' },
          { label: 'Data Points', value: `${snapshots.length} snapshots`, color: 'var(--teal-500)' },
        ].map((s, i) => (
          <motion.div key={i} className={styles.summaryCard} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <span className={styles.summaryVal} style={{ color: s.color }}>{s.value}</span>
            <span className={styles.summaryLbl}>{s.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Collection Notice */}
      {!hasHistory && (
        <div className={styles.collectingNotice}>
          📊 <strong>Historical data is being collected.</strong> Trend charts will appear as you use the application.
          Currently showing current-state analytics from your {activeSubscriptions.length} running subscriptions.
        </div>
      )}

      {/* Charts Grid */}
      <div className={styles.grid}>

        {/* 1. Monthly Spending Trend */}
        <ChartCard title="📈 Running Spending Trend" subtitle="Your running subscription spend over time" index={0}>
          {hasHistory ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={spendingTrend}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tickFormatter={v => `₹${v}`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip content={<CustomTooltip currency />} />
                <Area type="monotone" dataKey="spending" name="Spending" stroke="#6366f1" strokeWidth={2} fill="url(#spendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <NoDataState title="Trend data not yet available" />}
        </ChartCard>

        {/* 2. Category Distribution Donut */}
        <ChartCard title="🥧 Category Distribution" subtitle="Spending by active subscriptions" index={1}>
          {categoryData.length > 0 ? (
            <div className={styles.donutWrap}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.donutLegend}>
                {categoryData.map((d, i) => (
                  <div key={i} className={styles.legendRow}>
                    <span className={styles.legendDot} style={{ background: COLORS[i % COLORS.length] }} />
                    <span className={styles.legendName}>{d.name}</span>
                    <span className={styles.legendVal}>{formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <NoDataState title="No active subscriptions yet" />}
        </ChartCard>

        {/* 3. Top 10 Expensive */}
        <ChartCard title="💰 Top Expenses" subtitle="Most expensive running subscriptions" className={styles.wide} index={2}>
          {top10.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={top10} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" horizontal={false} />
                <XAxis type="number" tickFormatter={v => `₹${v}`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <Tooltip content={<CustomTooltip currency />} />
                <Bar dataKey="cost" name="Cost" fill="#6366f1" radius={[0, 4, 4, 0]}>
                  {top10.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <NoDataState title="No subscriptions yet" />}
        </ChartCard>

        {/* 4. Subscription Count Trend */}
        <ChartCard title="📊 Subscription Growth" subtitle="Total subscriptions over time" index={3}>
          {hasHistory ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={countTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="total" name="Total" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="active" name="Active" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <NoDataState title="Growth data not yet available" />}
        </ChartCard>

        {/* 5. Renewal Calendar Heatmap */}
        <ChartCard title="🗓 Renewal Calendar" subtitle="Upcoming renewals in next 6 months" index={4}>
          <RenewalHeatmap subscriptions={activeSubscriptions} />
        </ChartCard>

        {/* 6. Payment Methods */}
        <ChartCard title="💳 Payment Methods" subtitle="How you pay for subscriptions" index={5}>
          {paymentMethodData.length > 0 ? (
            <div className={styles.donutWrap}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={paymentMethodData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                    {paymentMethodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.donutLegend}>
                {paymentMethodData.map((d, i) => (
                  <div key={i} className={styles.legendRow}>
                    <span className={styles.legendDot} style={{ background: COLORS[i % COLORS.length] }} />
                    <span className={styles.legendName}>{d.name}</span>
                    <span className={styles.legendVal}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <NoDataState title="No data yet" />}
        </ChartCard>

        {/* 7. Monthly Renewals from History */}
        <ChartCard title="🔄 Renewal History" subtitle="Renewals performed each month" index={6}>
          {monthlyRenewals.length >= 2 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyRenewals}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Renewals" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoDataState title="No renewal history yet" message="Renewal activity will appear here as you renew subscriptions." />}
        </ChartCard>

        {/* 8. Yearly Spending Projection */}
        <ChartCard title="📅 Yearly Projection" subtitle="Projected cumulative spending (next 12 months)" className={styles.wide} index={7}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={yearlyProjection}>
              <defs>
                <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip content={<CustomTooltip currency />} />
              <Area type="monotone" dataKey="cumulative" name="Cumulative" stroke="#8b5cf6" strokeWidth={2} fill="url(#projGrad)" />
              <Area type="monotone" dataKey="projected" name="Monthly" stroke="#6366f1" strokeWidth={2} fill="none" strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 9. Status Distribution */}
        <ChartCard title="🔵 Subscription Status" subtitle="Active vs expiring vs expired" index={8}>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                  {statusData.map((d, i) => {
                    const color = d.name === 'Active' ? '#22c55e' : d.name === 'Expiring Soon' ? '#f59e0b' : '#ef4444';
                    return <Cell key={i} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <NoDataState title="No subscription data" />}
        </ChartCard>

        {/* 10. Category Spending Trend */}
        <ChartCard title="📈 Category Trend" subtitle="Spending by category over time" className={styles.wide} index={9}>
          {hasHistory && categoryTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={categoryTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip content={<CustomTooltip currency />} />
                <Legend />
                {uniqueCategories.slice(0, 5).map((cat, i) => (
                  <Area key={cat} type="monotone" dataKey={cat} name={cat} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.1} stackId="1" />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          ) : <NoDataState title="Category trends not yet available" />}
        </ChartCard>

        {/* 11. Expense Treemap */}
        <ChartCard title="🟪 Expense Distribution" subtitle="Size = relative spending weight" className={styles.wide} index={10}>
          {treemapData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <Treemap data={treemapData} dataKey="size" aspectRatio={4/3} stroke="var(--bg-surface)" fill="#6366f1">
                {treemapData.map((item, i) => (
                  <Cell key={i} fill={item.fill} />
                ))}
              </Treemap>
            </ResponsiveContainer>
          ) : <NoDataState title="No expense data" />}
        </ChartCard>

        {/* 12. Auto-Renewal Analysis */}
        <ChartCard title="🔁 Auto-Renewal" subtitle="Subscriptions with auto-renewal" index={11}>
          {autoRenewalData.some(d => d.value > 0) ? (
            <div className={styles.donutWrap}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={autoRenewalData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4}>
                    <Cell fill="#22c55e" />
                    <Cell fill="#94a3b8" />
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.donutLegend}>
                {autoRenewalData.map((d, i) => (
                  <div key={i} className={styles.legendRow}>
                    <span className={styles.legendDot} style={{ background: i === 0 ? '#22c55e' : '#94a3b8' }} />
                    <span className={styles.legendName}>{d.name}</span>
                    <span className={styles.legendVal}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <NoDataState title="No data" />}
        </ChartCard>

        {/* 13. Usage Frequency */}
        <ChartCard title="📡 Usage Frequency" subtitle="How often you use each subscription" index={12}>
          {usageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                  {usageData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <NoDataState title="No data yet" />}
        </ChartCard>

        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
