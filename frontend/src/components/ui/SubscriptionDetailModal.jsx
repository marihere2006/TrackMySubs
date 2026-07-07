import Modal from './Modal';
import Button from './Button';
import Badge from './Badge';
import { formatCurrency } from '../../utils/formatUtils';
import { formatDate } from '../../utils/dateUtils';
import styles from './SubscriptionDetailModal.module.css';

const SubscriptionDetailModal = ({ isOpen, onClose, subscription }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={subscription?.serviceName || ''}
      size="md"
      footer={
        <Button variant="secondary" onClick={onClose}>Close</Button>
      }
    >
      {subscription && (
        <div className={styles.detailGrid}>
          {[
            ['Category', subscription.category],
            ['Plan Name', subscription.planName || '—'],
            ['Billing Cycle', subscription.billingCycle || 'Monthly'],
            ['Payment Method', subscription.paymentMethod || 'Credit Card'],
            ['Auto Renewal', subscription.autoRenewal ? 'Enabled' : 'Disabled'],
            ['Reminder', `${subscription.reminderDays || 7} Days Before`],
            ['Usage Frequency', subscription.usageFrequency || 'Monthly'],
            ['Renewals', subscription.renewalCount || 0],
            ['Cost', formatCurrency(subscription.cost)],
            ['Start Date', formatDate(subscription.startDate)],
            ['Expiry Date', formatDate(subscription.expiryDate)],
            ['Status', <Badge label={subscription.computedStatus} dot />],
            ['Website', subscription.website ? (
              <a href={subscription.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-600)' }}>
                {subscription.website}
              </a>
            ) : '—'],
            ['Notes', subscription.notes || '—'],
          ].map(([k, v]) => (
            <div key={k} className={styles.detailRow}>
              <span className={styles.detailKey}>{k}</span>
              <span className={styles.detailVal}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default SubscriptionDetailModal;
