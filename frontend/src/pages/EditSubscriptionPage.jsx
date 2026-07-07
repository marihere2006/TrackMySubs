// ============================================================
// Edit Subscription Page
// ============================================================

import { useParams, useNavigate } from 'react-router-dom';
import { useSubscriptions } from '../context/SubscriptionContext';
import SubscriptionForm from '../components/SubscriptionForm';

const EditSubscriptionPage = () => {
  const { id } = useParams();
  const { subscriptions, loading } = useSubscriptions();
  const navigate = useNavigate();

  const sub = subscriptions.find((s) => s.id === id);
  const notFound = !sub && !loading && subscriptions.length > 0;

  if (notFound) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Subscription not found.</h2>
        <button
          onClick={() => navigate('/subscriptions')}
          style={{ marginTop: 16, color: 'var(--primary-600)', cursor: 'pointer', background: 'none', border: 'none', fontSize: '0.9rem' }}
        >
          ← Back to subscriptions
        </button>
      </div>
    );
  }

  if (!sub) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading…
      </div>
    );
  }

  return (
    <SubscriptionForm
      mode="edit"
      subscriptionId={id}
      initialData={{
        serviceName: sub.serviceName,
        planName: sub.planName || '',
        category: sub.category,
        billingCycle: sub.billingCycle || 'Monthly',
        paymentMethod: sub.paymentMethod || 'Credit Card',
        autoRenewal: sub.autoRenewal !== undefined ? sub.autoRenewal.toString() : 'false',
        reminderDays: sub.reminderDays ? sub.reminderDays.toString() : '7',
        usageFrequency: sub.usageFrequency || 'Monthly',
        cost: String(sub.cost),
        startDate: sub.startDate,
        expiryDate: sub.expiryDate,
        notes: sub.notes || '',
        website: sub.website || '',
      }}
    />
  );
};

export default EditSubscriptionPage;
