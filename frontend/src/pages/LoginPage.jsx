// ============================================================
// Login Page
// ============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './AuthPages.module.css';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
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

        <h1 className={styles.heading}>Welcome back</h1>
        <p className={styles.subheading}>Sign in to manage your subscriptions</p>

        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {/* Email */}
          <div className={styles.field}>
            <label htmlFor="login-email" className={styles.label}>Email address</label>
            <div className={styles.inputWrap}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                id="login-email"
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

          {/* Password */}
          <div className={styles.field}>
            <div className={styles.labelRow} style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <label htmlFor="login-password" className={styles.label}>Password</label>
              <Link to="/forgot-password" className={styles.link} style={{ fontSize: '0.85rem' }}>Forgot password?</Link>
            </div>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                className={`${styles.input} ${styles.hasTrail}`}
                autoComplete="current-password"
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

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? <span className={styles.spinner} /> : 'Sign In'}
          </button>
        </form>

        <p className={styles.switchText}>
          Don't have an account?{' '}
          <Link to="/register" className={styles.link}>Create one free</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
