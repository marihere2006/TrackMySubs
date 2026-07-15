// ============================================================
// AiSmartAdd — Natural Language Subscription Entry
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Edit3, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { smartAdd } from '../services/aiService';
import { useSubscriptions } from '../context/SubscriptionContext';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import { CATEGORIES, BILLING_CYCLES, PAYMENT_METHODS } from '../data/constants';
import styles from './AiSmartAdd.module.css';

const SUGGESTIONS = [
  'I subscribed to Netflix Premium for ₹649 per month',
  'Added Spotify Family plan at ₹179/month starting today',
  'Amazon Prime annual plan for ₹1499 per year',
  'Notion Pro ₹330 monthly, renews next month',
  'YouTube Premium ₹139/month, started 3 days ago',
];

const AiSmartAdd = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { addSub } = useSubscriptions();

  const handleParse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setParsed(null);
    setForm(null);

    try {
      const result = await smartAdd(text.trim());
      setParsed(result);
      setForm(result);
    } catch (err) {
      setError(err.message || 'Could not understand that. Try being more specific.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await addSub(form);
      setSaved(true);
      setText('');
      setParsed(null);
      setForm(null);
    } catch (err) {
      setError(err.message || 'Failed to save subscription.');
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <motion.div
        className={styles.successCard}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12 }}
      >
        <CheckCircle size={40} color="var(--success-500)" />
        <h3>Subscription Added!</h3>
        <p>Your subscription was successfully added from plain text.</p>
        <Button variant="primary" onClick={() => setSaved(false)}>
          Add Another
        </Button>
      </motion.div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Input Card */}
      <div className={styles.inputCard}>
        <div className={styles.inputHeader}>
          <div className={styles.inputIcon}><Sparkles size={18} /></div>
          <div>
            <h3 className={styles.inputTitle}>Describe your subscription</h3>
            <p className={styles.inputSubtitle}>
              Tell the AI in plain language. It will extract all the details.
            </p>
          </div>
        </div>

        <div className={styles.textareaWrap}>
          <textarea
            className={styles.textarea}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="e.g. I bought Netflix Premium for ₹649 per month, started last week"
            rows={3}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleParse(); }}
            disabled={loading}
          />
          {loading && (
            <div className={styles.loadingOverlay}>
              <RefreshCw className={styles.loadingSpinner} size={20} />
              <span>Extracting subscription details...</span>
            </div>
          )}
          {!loading && <span className={styles.textareaHint}>Press ⌘↵ or click Parse</span>}
        </div>

        {/* Suggestions */}
        {!parsed && (
          <div className={styles.suggestions}>
            <span className={styles.suggestLabel}>Try:</span>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className={styles.suggestChip} onClick={() => setText(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <div className={styles.inputActions}>
          {parsed && (
            <button className={styles.resetBtn} onClick={() => { setParsed(null); setForm(null); setError(''); }}>
              <RefreshCw size={14} /> Start Over
            </button>
          )}
          <Button
            variant="gradient"
            icon={Send}
            loading={loading}
            onClick={handleParse}
            disabled={!text.trim()}
          >
            {parsed ? 'Re-parse' : 'Parse with AI'}
          </Button>
        </div>
      </div>

      {/* Parsed Form Preview */}
      <AnimatePresence>
        {form && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={styles.previewCard}
          >
            <div className={styles.previewHeader}>
              <Edit3 size={16} color="var(--violet-500)" />
              <h3 className={styles.previewTitle}>AI extracted these details — review and confirm</h3>
            </div>

            <div className={styles.formGrid}>
              <div>
                <label className={styles.formLabel}>Service Name</label>
                <Input
                  name="serviceName"
                  value={form.serviceName || ''}
                  onChange={handleFormChange}
                  id="ai-serviceName"
                />
              </div>
              <div>
                <label className={styles.formLabel}>Plan Name</label>
                <Input
                  name="planName"
                  value={form.planName || ''}
                  onChange={handleFormChange}
                  id="ai-planName"
                  placeholder="e.g. Premium, Basic"
                />
              </div>
              <div>
                <label className={styles.formLabel}>Category</label>
                <Select
                  id="ai-category"
                  name="category"
                  value={form.category || ''}
                  onChange={handleFormChange}
                  options={CATEGORIES}
                />
              </div>
              <div>
                <label className={styles.formLabel}>Billing Cycle</label>
                <Select
                  id="ai-billingCycle"
                  name="billingCycle"
                  value={form.billingCycle || 'Monthly'}
                  onChange={handleFormChange}
                  options={BILLING_CYCLES}
                />
              </div>
              <div>
                <label className={styles.formLabel}>Cost (₹)</label>
                <Input
                  id="ai-cost"
                  name="cost"
                  type="number"
                  value={form.cost || ''}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className={styles.formLabel}>Payment Method</label>
                <Select
                  id="ai-paymentMethod"
                  name="paymentMethod"
                  value={form.paymentMethod || 'Other'}
                  onChange={handleFormChange}
                  options={PAYMENT_METHODS}
                />
              </div>
              <div>
                <label className={styles.formLabel}>Start Date</label>
                <Input
                  id="ai-startDate"
                  name="startDate"
                  type="date"
                  value={form.startDate || ''}
                  onChange={handleFormChange}
                />
              </div>
              <div>
                <label className={styles.formLabel}>Expiry Date</label>
                <Input
                  id="ai-expiryDate"
                  name="expiryDate"
                  type="date"
                  value={form.expiryDate || ''}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className={styles.previewActions}>
              <Button variant="secondary" onClick={() => { setParsed(null); setForm(null); }}>
                Cancel
              </Button>
              <Button variant="primary" icon={CheckCircle} loading={saving} onClick={handleSave}>
                Confirm & Add Subscription
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiSmartAdd;
