// ============================================================
// Forgot Password Page
// ============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Key, Eye, EyeOff, Zap, ArrowLeft } from 'lucide-react';
import { sendForgotPasswordOtp, resetPassword } from '../services/authService';
import styles from './AuthPages.module.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: '', otp: '', newPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
    if (step === 2 && e.target.name === 'email') {
        // usually shouldn't happen, but just in case
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!form.email) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      await sendForgotPasswordOtp(form.email);
      setSuccess('Verification code sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!form.otp || !form.newPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      await resetPassword(form.email, form.otp, form.newPassword);
      setSuccess('Password reset successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Background blobs */}
      <div className={styles.blob1} aria-hidden="true" />
      <div className={styles.blob2} aria-hidden="true" />

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoRow}>
          <div className={styles.logoIcon}><Zap size={22} color="#fff" fill="#fff" /></div>
          <span className={styles.logoText}>TrackMySubs</span>
        </div>

        <h1 className={styles.heading}>Forgot Password</h1>
        <p className={styles.subheading}>
          {step === 1 ? 'Enter your email to receive a reset code' : 'Enter the code and your new password'}
        </p>

        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}
        
        {success && (
          <div className={styles.successBanner} role="alert" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '20px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            {success}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className={styles.form} noValidate>
            <div className={styles.field}>
              <label htmlFor="reset-email" className={styles.label}>Email address</label>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  id="reset-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={styles.input}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className={styles.form} noValidate>
            <div className={styles.field}>
              <label htmlFor="reset-otp" className={styles.label}>Verification Code</label>
              <div className={styles.inputWrap}>
                <Key size={16} className={styles.inputIcon} />
                <input
                  id="reset-otp"
                  type="text"
                  name="otp"
                  value={form.otp}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="6-digit code"
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor="reset-password" className={styles.label}>New Password</label>
              </div>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  id="reset-password"
                  type={showPw ? 'text' : 'password'}
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  className={`${styles.input} ${styles.hasTrail}`}
                  required
                />
                <button
                  type="button"
                  className={styles.pwToggle}
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : 'Reset Password'}
            </button>
          </form>
        )}

        <p className={styles.switchText} style={{ marginTop: '24px' }}>
          <Link to="/login" className={styles.link} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
