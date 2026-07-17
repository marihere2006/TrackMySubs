// ============================================================
// SimulationPanel — What-If Analysis (Pure Java/Frontend Math)
// ============================================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Beaker, TrendingDown, DollarSign, Activity, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useSubscriptions } from '../context/SubscriptionContext';
import { formatCurrency } from '../utils/formatUtils';
import { getCurrentMonthContribution } from '../utils/spendingUtils';
import styles from './SimulationPanel.module.css';

const BILLING_MULTIPLIERS = {
  Monthly: 1,
  Yearly: 12,
  Quarterly: 3,
  Weekly: 0.25,
};

const SimulationPanel = () => {
  const { subscriptions, monthlyTotal } = useSubscriptions();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('cancel'); // 'cancel' | 'annual'
  const [selectedId, setSelectedId] = useState('');

  const selected = useMemo(
    () => subscriptions.find(s => s.id === selectedId),
    [subscriptions, selectedId]
  );

  const simulation = useMemo(() => {
    if (!selected) return null;
    const selectedContribution = getCurrentMonthContribution(selected);

    if (mode === 'cancel') {
      const newMonthly = Math.max(monthlyTotal - selectedContribution, 0);
      const savings = monthlyTotal - newMonthly;
      const yearlySavings = savings * 12;
      // Health score impact: removing a subscription slightly improves score
      const healthImpact = '+3';
      return {
        label: `Cancel ${selected.serviceName}`,
        newMonthly,
        savingsMonthly: savings,
        savingsYearly: yearlySavings,
        healthImpact,
        color: 'var(--success-500)',
        description: 'Removing this subscription will reduce your monthly expense.',
      };
    }

    if (mode === 'annual') {
      // Typically annual billing is 10-20% cheaper than 12x monthly
      const discountRate = 0.17; // 17% savings (2 months free model)
      const currentAnnual = Number(selected.cost) * 12;
      const discountedAnnual = currentAnnual * (1 - discountRate);
      const savings = currentAnnual - discountedAnnual;
      const newMonthly = selectedContribution > 0
        ? Math.max(monthlyTotal - selectedContribution + (discountedAnnual / 12), 0)
        : monthlyTotal;
      return {
        label: `Switch ${selected.serviceName} to Annual`,
        newMonthly,
        savingsMonthly: monthlyTotal - newMonthly,
        savingsYearly: savings,
        healthImpact: '+8',
        color: 'var(--primary-500)',
        description: `Switching to annual billing saves ~17% (2 months free equivalent).`,
      };
    }

    return null;
  }, [selected, mode, monthlyTotal]);

  if (subscriptions.length === 0) return null;

  return (
    <motion.div
      className={styles.panel}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <button className={styles.toggleHeader} onClick={() => setOpen(v => !v)}>
        <div className={styles.toggleLeft}>
          <div className={styles.toggleIcon}>
            <Beaker size={17} />
          </div>
          <div>
            <span className={styles.toggleTitle}>Simulation Mode</span>
            <span className={styles.toggleSubtitle}>What-if analysis — see impact before making changes</span>
          </div>
        </div>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={styles.body}
          >
            <div className={styles.controls}>
              {/* Mode selector */}
              <div className={styles.modeGroup}>
                <button
                  className={`${styles.modeBtn} ${mode === 'cancel' ? styles.modeActive : ''}`}
                  onClick={() => setMode('cancel')}
                >
                  Cancel Subscription
                </button>
                <button
                  className={`${styles.modeBtn} ${mode === 'annual' ? styles.modeActive : ''}`}
                  onClick={() => setMode('annual')}
                >
                  Switch to Annual
                </button>
              </div>

              {/* Subscription selector */}
              <select
                className={styles.subSelect}
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
              >
                <option value="">— Select a subscription —</option>
                {subscriptions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.serviceName} ({formatCurrency(s.cost)}/mo)
                  </option>
                ))}
              </select>
            </div>

            {/* Results */}
            <AnimatePresence mode="wait">
              {simulation && selected ? (
                <motion.div
                  key={`${selectedId}-${mode}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className={styles.results}
                >
                  <div className={styles.resultLabel}>{simulation.label}</div>
                  <p className={styles.resultDesc}>{simulation.description}</p>

                  <div className={styles.resultGrid}>
                    <div className={styles.resultCard}>
                      <div className={styles.resultCardLabel}>Current Monthly</div>
                      <div className={styles.resultCardValue}>{formatCurrency(monthlyTotal)}</div>
                    </div>
                    <div className={styles.resultArrow}>→</div>
                    <div className={`${styles.resultCard} ${styles.resultCardNew}`}>
                      <div className={styles.resultCardLabel}>New Monthly</div>
                      <div className={styles.resultCardValue} style={{ color: simulation.color }}>
                        {formatCurrency(simulation.newMonthly)}
                      </div>
                    </div>
                  </div>

                  <div className={styles.savingsGrid}>
                    <div className={styles.savingsStat}>
                      <TrendingDown size={16} color="var(--success-500)" />
                      <div>
                        <span className={styles.savingsVal}>{formatCurrency(simulation.savingsMonthly)}</span>
                        <span className={styles.savingsLbl}>Saved / Month</span>
                      </div>
                    </div>
                    <div className={styles.savingsStat}>
                      <DollarSign size={16} color="var(--success-500)" />
                      <div>
                        <span className={styles.savingsVal}>{formatCurrency(simulation.savingsYearly)}</span>
                        <span className={styles.savingsLbl}>Saved / Year</span>
                      </div>
                    </div>
                    <div className={styles.savingsStat}>
                      <Activity size={16} color="var(--primary-400)" />
                      <div>
                        <span className={styles.savingsVal} style={{ color: 'var(--success-500)' }}>
                          {simulation.healthImpact}
                        </span>
                        <span className={styles.savingsLbl}>Health Score</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.disclaimer}>
                    ⚠ This is a simulation only. No changes have been made to your subscriptions.
                  </div>
                </motion.div>
              ) : selectedId === '' ? (
                <div className={styles.simPlaceholder}>
                  Select a subscription above to see the impact.
                </div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SimulationPanel;
