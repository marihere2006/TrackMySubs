// ============================================================
// Register Page
// ============================================================

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sendOtp, verifyOtp } from '../services/authService';
import styles from './AuthPages.module.css';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [showCp, setShowCp] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Email Verification state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOtp = async () => {
    setOtpError('');
    setOtpSuccess('');

    if (!form.email.trim()) {
      setErrors((err) => ({ ...err, email: 'Email is required to request OTP.' }));
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErrors((err) => ({ ...err, email: 'Enter a valid email address.' }));
      return;
    }

    setLoadingOtp(true);
    try {
      await sendOtp(form.email);
      setOtpSent(true);
      setOtpSuccess('Verification code sent successfully.');
      setCountdown(60);
    } catch (err) {
      setOtpError(err.message || 'Failed to send OTP.');
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError('');
    setOtpSuccess('');

    if (!otp.trim()) {
      setOtpError('Please enter the verification code.');
      return;
    }
    if (otp.trim().length !== 6) {
      setOtpError('Verification code must be 6 digits.');
      return;
    }

    setVerifyingOtp(true);
    try {
      await verifyOtp(form.email, otp);
      setIsEmailVerified(true);
      setOtpSuccess('Email Verified ✅');
      setErrors((err) => ({ ...err, email: '' }));
    } catch (err) {
      setOtpError(err.message || 'OTP verification failed.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    return e;
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: '' }));
    if (e.target.name === 'email') {
      setOtpSent(false);
      setOtp('');
      setOtpError('');
      setOtpSuccess('');
      setCountdown(0);
    }
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
      await register({ name: form.name, email: form.email, password: form.password });
      navigate('/dashboard');
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = (() => {
    const pw = form.password;
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  })();

  const pwStrengthLabel = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][pwStrength];
  const pwStrengthColor = ['', '#ef4444', '#f59e0b', '#f59e0b', '#22c55e', '#16a34a'][pwStrength];

  return (
    <div className={styles.page}>
      <div className={styles.blob1} aria-hidden="true" />
      <div className={styles.blob2} aria-hidden="true" />

      <div className={`${styles.card} ${styles.cardWide}`}>
        {/* Logo */}
        <div className={styles.logoRow}>
          <div className={styles.logoIcon}><Zap size={22} color="#fff" fill="#fff" /></div>
          <span className={styles.logoText}>TrackMySubs</span>
        </div>

        <h1 className={styles.heading}>Create your account</h1>
        <p className={styles.subheading}>Start tracking subscriptions for free</p>

        {errors.form && (
          <div className={styles.errorBanner} role="alert">{errors.form}</div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {/* Name */}
          <div className={styles.field}>
            <label htmlFor="reg-name" className={styles.label}>Full Name</label>
            <div className={styles.inputWrap}>
              <User size={16} className={styles.inputIcon} />
              <input
                id="reg-name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`${styles.input} ${errors.name ? styles.inputErr : ''}`}
                autoComplete="name"
              />
            </div>
            {errors.name && <p className={styles.fieldErr}>{errors.name}</p>}
          </div>

          {/* Email */}
          <div className={styles.field}>
            <label htmlFor="reg-email" className={styles.label}>Email Address</label>
            <div className={styles.inlineGroup}>
              <div className={styles.inputWrap} style={{ flex: 1 }}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={isEmailVerified}
                  className={`${styles.input} ${errors.email ? styles.inputErr : ''}`}
                  autoComplete="email"
                  placeholder="name@example.com"
                />
              </div>
              {!isEmailVerified && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className={styles.inlineBtn}
                  disabled={loadingOtp || countdown > 0}
                >
                  {loadingOtp ? 'Sending...' : otpSent ? 'Resend' : 'Send OTP'}
                </button>
              )}
            </div>
            {isEmailVerified && (
              <p className={styles.successText}>Email Verified ✅</p>
            )}
            {countdown > 0 && !isEmailVerified && (
              <p className={styles.infoText}>Resend code in {countdown}s</p>
            )}
            {errors.email && <p className={styles.fieldErr}>{errors.email}</p>}
            {otpError && !otpSent && <p className={styles.fieldErr}>{otpError}</p>}
          </div>

          {/* Verification Code */}
          {otpSent && !isEmailVerified && (
            <div className={styles.field}>
              <label htmlFor="reg-otp" className={styles.label}>Verification Code</label>
              <div className={styles.inlineGroup}>
                <input
                  id="reg-otp"
                  type="text"
                  name="otp"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setOtpError('');
                  }}
                  className={`${styles.input} ${otpError ? styles.inputErr : ''}`}
                  maxLength={6}
                  style={{ textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold' }}
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className={styles.inlineBtn}
                  disabled={verifyingOtp}
                >
                  {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
              {otpError && <p className={styles.fieldErr}>{otpError}</p>}
              {otpSuccess && !otpError && <p className={styles.successText}>{otpSuccess}</p>}
            </div>
          )}

          {/* Password */}
          <div className={styles.field}>
            <label htmlFor="reg-password" className={styles.label}>Password</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                id="reg-password"
                type={showPw ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                className={`${styles.input} ${styles.hasTrail} ${errors.password ? styles.inputErr : ''}`}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.pwToggle}
                onClick={() => setShowPw((v) => !v)}
                aria-label="Toggle password"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {form.password && (
              <div className={styles.pwStrength}>
                <div className={styles.pwBars}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={styles.pwBar}
                      style={{ background: i <= pwStrength ? pwStrengthColor : undefined }}
                    />
                  ))}
                </div>
                <span className={styles.pwLabel} style={{ color: pwStrengthColor }}>
                  {pwStrengthLabel}
                </span>
              </div>
            )}
            {errors.password && <p className={styles.fieldErr}>{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className={styles.field}>
            <label htmlFor="reg-confirm" className={styles.label}>Confirm Password</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                id="reg-confirm"
                type={showCp ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className={`${styles.input} ${styles.hasTrail} ${errors.confirmPassword ? styles.inputErr : ''}`}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.pwToggle}
                onClick={() => setShowCp((v) => !v)}
                aria-label="Toggle confirm password"
              >
                {showCp ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {form.confirmPassword && form.password === form.confirmPassword && (
              <p className={styles.matchText}>
                <CheckCircle size={12} /> Passwords match
              </p>
            )}
            {errors.confirmPassword && <p className={styles.fieldErr}>{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || !isEmailVerified}
          >
            {loading ? <span className={styles.spinner} /> : !isEmailVerified ? 'Verify Email first' : 'Create Account'}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account?{' '}
          <Link to="/login" className={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
