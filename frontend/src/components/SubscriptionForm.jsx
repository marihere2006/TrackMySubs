// ============================================================
// Subscription Form — Shared by Add & Edit pages
// billingCycle field removed — model uses only dates
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { useSubscriptions } from '../context/SubscriptionContext';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import HeroHeader from './layout/HeroHeader';
import { CATEGORIES, PAYMENT_METHODS, REMINDER_DAYS, USAGE_FREQUENCIES, BILLING_CYCLES } from '../data/constants';
import { todayStr } from '../utils/dateUtils';
import styles from './SubscriptionFormPage.module.css';

const defaultForm = {
  serviceName: '',
  planName: '',
  category: '',
  billingCycle: 'Monthly',
  paymentMethod: 'Credit Card',
  autoRenewal: 'false',
  reminderDays: '7',
  usageFrequency: 'Monthly',
  cost: '',
  startDate: todayStr(),
  expiryDate: '',
  notes: '',
  website: '',
};

const SubscriptionForm = ({ initialData, subscriptionId, mode = 'add' }) => {
  const navigate = useNavigate();
  const { addSub, updateSub } = useSubscriptions();
  const [form, setForm] = useState(initialData || defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.serviceName.trim()) e.serviceName = 'Service name is required.';
    if (!form.category) e.category = 'Category is required.';
    if (!form.cost || isNaN(Number(form.cost)) || Number(form.cost) <= 0)
      e.cost = 'Enter a valid cost greater than 0.';
    if (!form.startDate) e.startDate = 'Start date is required.';
    if (!form.expiryDate) e.expiryDate = 'Expiry date is required.';
    else if (form.expiryDate <= form.startDate)
      e.expiryDate = 'Expiry date must be after start date.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      // Only send clean fields — no billingCycle
      const data = {
        serviceName: form.serviceName.trim(),
        category: form.category,
        planName: form.planName.trim(),
        billingCycle: form.billingCycle,
        paymentMethod: form.paymentMethod,
        autoRenewal: form.autoRenewal === 'true' || form.autoRenewal === true,
        reminderDays: Number(form.reminderDays),
        usageFrequency: form.usageFrequency,
        cost: Number(form.cost),
        startDate: form.startDate,
        expiryDate: form.expiryDate,
        notes: form.notes.trim(),
        website: form.website.trim(),
      };
      if (mode === 'edit' && subscriptionId) {
        await updateSub(subscriptionId, data);
      } else {
        await addSub(data);
      }
      setSuccess(true);
      setTimeout(() => navigate('/subscriptions'), 800);
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <HeroHeader
        breadcrumb={mode === 'edit' ? 'Edit Subscription' : 'Add Subscription'}
        title={mode === 'edit' ? 'Edit Subscription' : 'Add New Subscription'}
        subtitle={mode === 'edit' ? 'Update your subscription details.' : 'Track a new subscription service.'}
      />

      <div className={styles.formCard}>
        {success && (
          <div className={styles.successBanner}>
            ✓ Subscription {mode === 'edit' ? 'updated' : 'added'} successfully! Redirecting…
          </div>
        )}
        {errors.form && (
          <div className={styles.errorBanner}>{errors.form}</div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.grid}>
            <Input
              id="serviceName"
              label="Service Name"
              name="serviceName"
              value={form.serviceName}
              onChange={handleChange}
              error={errors.serviceName}
              required
            />
            <Input
              id="planName"
              label="Plan Name"
              name="planName"
              value={form.planName}
              onChange={handleChange}
              placeholder="e.g. Premium, Basic"
            />
            <Select
              id="category"
              label="Category"
              name="category"
              value={form.category}
              onChange={handleChange}
              options={CATEGORIES}
              error={errors.category}
              required
            />
            <Select
              id="billingCycle"
              label="Billing Cycle"
              name="billingCycle"
              value={form.billingCycle}
              onChange={handleChange}
              options={BILLING_CYCLES}
              required
            />
            <Input
              id="cost"
              label="Cost (₹)"
              name="cost"
              type="number"
              value={form.cost}
              onChange={handleChange}
              error={errors.cost}
              required
              min="0"
              step="0.01"
            />
            <Select
              id="paymentMethod"
              label="Payment Method"
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleChange}
              options={PAYMENT_METHODS}
              required
            />
            <Select
              id="autoRenewal"
              label="Auto Renewal"
              name="autoRenewal"
              value={form.autoRenewal.toString()}
              onChange={handleChange}
              options={[{value: 'true', label: 'Yes'}, {value: 'false', label: 'No'}]}
              required
            />
            <Select
              id="reminderDays"
              label="Reminder Days"
              name="reminderDays"
              value={form.reminderDays.toString()}
              onChange={handleChange}
              options={REMINDER_DAYS}
              required
            />
            <Select
              id="usageFrequency"
              label="Usage Frequency"
              name="usageFrequency"
              value={form.usageFrequency}
              onChange={handleChange}
              options={USAGE_FREQUENCIES}
              required
            />
            <Input
              id="website"
              label="Website URL (optional)"
              name="website"
              type="url"
              value={form.website}
              onChange={handleChange}
            />
            <Input
              id="startDate"
              label="Start Date"
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
              error={errors.startDate}
              required
            />
            <Input
              id="expiryDate"
              label="Expiry Date"
              name="expiryDate"
              type="date"
              value={form.expiryDate}
              onChange={handleChange}
              error={errors.expiryDate}
              hint={
                form.startDate && form.expiryDate && form.expiryDate > form.startDate
                  ? `Duration will be auto-calculated from dates`
                  : undefined
              }
              required
            />
            <div className={styles.fullWidth}>
              <label htmlFor="notes" className={styles.textareaLabel}>
                Notes (optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                className={styles.textarea}
                rows={3}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <Button
              variant="secondary"
              type="button"
              icon={X}
              onClick={() => navigate('/subscriptions')}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              icon={Save}
              loading={loading}
            >
              {mode === 'edit' ? 'Save Changes' : 'Add Subscription'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionForm;
