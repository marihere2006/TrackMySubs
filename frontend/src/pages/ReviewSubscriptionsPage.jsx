import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, X, Edit2, AlertCircle } from 'lucide-react';
import HeroHeader from '../components/layout/HeroHeader';

const ReviewSubscriptionsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Expecting a state passed from the scan button containing the array of subscriptions
  const initialSubs = location.state?.subscriptions || [];
  
  const [subs, setSubs] = useState(initialSubs);
  const [saving, setSaving] = useState(false);

  const handleAccept = async (sub, index) => {
    // In a real app, call API to save the subscription here
    setSubs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIgnore = (index) => {
    setSubs((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div style={{ padding: '2rem' }}>
      <HeroHeader 
        title="Review Detected Subscriptions"
        subtitle={`Ollama AI found ${subs.length} potential subscriptions from your Gmail.`}
        breadcrumb="Gmail Sync / Review"
      />

      {subs.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>
          <Check size={48} color="var(--green-500)" style={{ marginBottom: '1rem' }} />
          <h3>All caught up!</h3>
          <p>No more subscriptions to review.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: 'var(--primary-500)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', marginTop: '2rem' }}>
          <AnimatePresence>
            {subs.map((sub, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0, scale: 0.9 }}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                    {sub.serviceName} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>({sub.category})</span>
                  </h3>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-500)', marginBottom: '0.5rem' }}>
                    ₹{sub.cost} / {sub.billingCycle}
                  </div>
                  {sub.confidence && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: sub.confidence > 80 ? 'var(--green-500)' : 'var(--orange-500)' }}>
                      <AlertCircle size={14} /> Confidence: {sub.confidence}%
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => handleIgnore(index)} style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red-500)', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <X size={16} /> Ignore
                  </button>
                  <button style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--orange-500)', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Edit2 size={16} /> Edit
                  </button>
                  <button onClick={() => handleAccept(sub, index)} style={{ padding: '0.5rem 1rem', background: 'var(--primary-500)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Check size={16} /> Accept
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ReviewSubscriptionsPage;
