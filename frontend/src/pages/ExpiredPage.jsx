// ============================================================
// Expired Plans Page — with Renew Modal (date picker)
// ============================================================

import { useState } from 'react';
import { RefreshCw, Trash2, Clock } from 'lucide-react';
import { useSubscriptions } from '../context/SubscriptionContext';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import HeroHeader from '../components/layout/HeroHeader';
import { formatDate, todayStr } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatUtils';
import styles from './ExpiredPage.module.css';

const ExpiredPage = () => {
  const { expiredSubscriptions, deleteSub, renewSub } = useSubscriptions();

  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [renewModal, setRenewModal] = useState(null);
  const [renewLoading, setRenewLoading] = useState(false);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newCost, setNewCost] = useState('');
  const [renewError, setRenewError] = useState('');

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await deleteSub(deleteModal.id);
    } finally {
      setDeleting(false);
      setDeleteModal(null);
    }
  };

  const openRenewModal = (sub) => {
    setRenewModal(sub);
    setNewExpiryDate('');
    setNewCost(sub.cost || '');
    setRenewError('');
  };

  const handleRenewSubmit = async () => {
    if (!newExpiryDate) {
      setRenewError('Please select a new expiry date.');
      return;
    }
    if (newExpiryDate <= todayStr()) {
      setRenewError('New expiry date must be after today.');
      return;
    }
    if (newCost === '' || isNaN(newCost) || Number(newCost) < 0) {
      setRenewError('Please enter a valid cost.');
      return;
    }
    setRenewLoading(true);
    setRenewError('');
    try {
      await renewSub(renewModal.id, newExpiryDate, Number(newCost));
      setRenewModal(null);
    } catch (err) {
      setRenewError(err.message || 'Renewal failed.');
    } finally {
      setRenewLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <HeroHeader
        breadcrumb="Expired Plans"
        title="Expired Plans"
        subtitle="Subscriptions that have passed their expiry date."
      />

      {expiredSubscriptions.length === 0 ? (
        <div className={styles.emptyWrap}>
          <EmptyState
            icon={Clock}
            title="No expired subscriptions"
            description="All your subscriptions are active and up to date."
          />
        </div>
      ) : (
        <div className={styles.grid}>
          {expiredSubscriptions.map((sub, i) => (
            <div
              key={sub.id}
              className={`${styles.card} animate-fade-in`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={styles.cardTop}>
                <Badge label="Expired" />
              </div>
              <h3 className={styles.name}>{sub.serviceName}</h3>
              <p className={styles.category}>{sub.category}</p>

              <div className={styles.details}>
                <div className={styles.detailRow}>
                  <span className={styles.dk}>Cost</span>
                  <span className={styles.dv}>{formatCurrency(sub.cost)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.dk}>Started</span>
                  <span className={styles.dv}>{formatDate(sub.startDate)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.dk}>Expired On</span>
                  <span className={`${styles.dv} ${styles.expiredDate}`}>
                    {formatDate(sub.expiryDate)}
                  </span>
                </div>
              </div>

              <div className={styles.cardActions}>
                <Button
                  variant="success"
                  size="sm"
                  icon={RefreshCw}
                  fullWidth
                  onClick={() => openRenewModal(sub)}
                >
                  Renew
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  fullWidth
                  onClick={() => setDeleteModal(sub)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Renew Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={Boolean(renewModal)}
        onClose={() => setRenewModal(null)}
        title={`Renew — ${renewModal?.serviceName || ''}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenewModal(null)}>Cancel</Button>
            <Button
              variant="success"
              onClick={handleRenewSubmit}
              loading={renewLoading}
              icon={RefreshCw}
            >
              Confirm Renewal
            </Button>
          </>
        }
      >
        {renewModal && (
          <div className={styles.renewBody}>
            <div className={styles.renewInfo}>
              <div>
                <p className={styles.renewName}>{renewModal.serviceName}</p>
                <p className={styles.renewMeta}>
                  Expired: {formatDate(renewModal.expiryDate)}
                </p>
              </div>
            </div>

            <div className={styles.renewField}>
              <label htmlFor="new-cost" className={styles.renewLabel}>
                New Rate (Cost) <span style={{ color: 'var(--danger-500)' }}>*</span>
              </label>
              <input
                id="new-cost"
                type="number"
                step="0.01"
                min="0"
                value={newCost}
                onChange={(e) => { setNewCost(e.target.value); setRenewError(''); }}
                className={`${styles.dateInput} ${renewError && (newCost === '' || isNaN(newCost) || Number(newCost) < 0) ? styles.dateInputErr : ''}`}
                placeholder="0.00"
              />
            </div>

            <div className={styles.renewField}>
              <label htmlFor="new-expiry-date" className={styles.renewLabel}>
                New Expiry Date <span style={{ color: 'var(--danger-500)' }}>*</span>
              </label>
              <input
                id="new-expiry-date"
                type="date"
                min={todayStr()}
                value={newExpiryDate}
                onChange={(e) => { setNewExpiryDate(e.target.value); setRenewError(''); }}
                className={`${styles.dateInput} ${renewError && !newExpiryDate ? styles.dateInputErr : ''}`}
              />
              {renewError && <p className={styles.renewError}>{renewError}</p>}
              <p className={styles.renewHint}>
                Renewing sets <strong>start date to today</strong> and archives the old period to History.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={Boolean(deleteModal)}
        onClose={() => setDeleteModal(null)}
        title="Delete Expired Subscription"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete</Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
          Delete <strong style={{ color: 'var(--text-primary)' }}>{deleteModal?.serviceName}</strong>?
          This will also remove it from your history.
        </p>
      </Modal>
    </div>
  );
};

export default ExpiredPage;
