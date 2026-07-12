// ============================================================
// Add Subscription Page — 3-Method Selector
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenLine, Sparkles } from 'lucide-react';
import SubscriptionForm from '../components/SubscriptionForm';
import AiSmartAdd from '../components/AiSmartAdd';
import HeroHeader from '../components/layout/HeroHeader';
import styles from './AddSubscriptionPage.module.css';

const METHODS = [
  {
    id: 'manual',
    icon: PenLine,
    label: 'Manual Add',
    description: 'Fill in the details yourself',
    color: 'var(--primary-500)',
    bg: 'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.25)',
  },
  {
    id: 'ai',
    icon: Sparkles,
    label: 'AI Smart Add',
    description: 'Describe it in plain English',
    color: 'var(--violet-500)',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.25)',
    badge: 'AI',
  },
];

const AddSubscriptionPage = () => {
  const [activeMethod, setActiveMethod] = useState('manual');

  return (
    <div className={styles.page}>
      <HeroHeader
        breadcrumb="Add Subscription"
        title="Add New Subscription"
        subtitle="Choose how you'd like to add your subscription."
      />

      {/* Method Selector */}
      <div className={styles.methodGrid}>
        {METHODS.map((method) => {
          const Icon = method.icon;
          const isActive = activeMethod === method.id;
          return (
            <button
              key={method.id}
              className={`${styles.methodCard} ${isActive ? styles.methodActive : ''}`}
              onClick={() => setActiveMethod(method.id)}
              style={isActive ? { borderColor: method.border, background: method.bg } : {}}
            >
              <div className={styles.methodIconWrap} style={isActive ? { background: method.bg, border: `1px solid ${method.border}` } : {}}>
                <Icon size={20} color={isActive ? method.color : 'var(--text-muted)'} />
              </div>
              <div className={styles.methodInfo}>
                <div className={styles.methodLabelRow}>
                  <span className={styles.methodLabel} style={isActive ? { color: method.color } : {}}>
                    {method.label}
                  </span>
                  {method.badge && (
                    <span className={styles.methodBadge} style={{ background: method.color }}>
                      {method.badge}
                    </span>
                  )}
                </div>
                <span className={styles.methodDesc}>{method.description}</span>
              </div>
              {isActive && (
                <motion.div
                  className={styles.methodDot}
                  layoutId="activeMethodDot"
                  style={{ background: method.color }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMethod}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {activeMethod === 'manual' && <SubscriptionForm mode="add" />}
          {activeMethod === 'ai'     && <AiSmartAdd />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AddSubscriptionPage;
