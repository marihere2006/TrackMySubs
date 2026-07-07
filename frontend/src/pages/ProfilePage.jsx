// ============================================================
// Profile Page
// ============================================================

import { useState } from 'react';
import { User, Mail, Calendar, CheckCircle, Pencil, Save, X, AlertTriangle, Bell, Lock, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import HeroHeader from '../components/layout/HeroHeader';
import { formatDate } from '../utils/dateUtils';
import { getInitials } from '../utils/formatUtils';
import styles from './ProfilePage.module.css';

const ProfilePage = () => {
  const userAuth = useAuth();
  const { user, updateUser } = userAuth;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  // Mock states for the new panels
  const [notifications, setNotifications] = useState({ email: true });
  const [showSecurity, setShowSecurity] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [passForm, setPassForm] = useState({ current: '', code: '', newPass: '', confirm: '' });

  const toggleNotif = (key) => setNotifications(prev => ({ ...prev, [key]: !prev[key] }));

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors({});
  };

  const handleSave = async () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setLoading(true);
    try {
      await updateUser({ name: form.name, email: form.email });
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setErrors({ form: 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({ name: user?.name || '', email: user?.email || '' });
    setEditing(false);
    setErrors({});
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone and all your subscriptions will be lost.')) {
      return;
    }
    setDeleteLoading(true);
    try {
      await userAuth.deleteAccount(); // We need to access deleteAccount from useAuth
    } catch (err) {
      setErrors({ form: err.message || 'Failed to delete account.' });
      setDeleteLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <HeroHeader
        breadcrumb="Profile"
        title="Profile"
        subtitle="Manage your account information."
      />

      <div className={styles.grid}>
        {/* Profile card */}
        <div className={styles.profileCard}>
          {/* Avatar */}
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>
              {getInitials(user?.name || 'U')}
            </div>
            <div className={styles.avatarInfo}>
              <h2 className={styles.displayName}>{user?.name}</h2>
              <p className={styles.displayEmail}>{user?.email}</p>
              <span className={styles.roleBadge}>{user?.role || 'User'}</span>
            </div>
          </div>

          {success && (
            <div className={styles.successMsg}>
              <CheckCircle size={14} /> Profile updated successfully
            </div>
          )}

          {/* Edit form */}
          <div className={styles.formSection}>
            <div className={styles.formHeader}>
              <h3>Account Information</h3>
              {!editing && (
                <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditing(true)}>
                  Edit
                </Button>
              )}
            </div>

            {errors.form && <p className={styles.errMsg}>{errors.form}</p>}

            <div className={styles.formFields}>
              <Input
                id="profile-name"
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                disabled={!editing}
                error={errors.name}
                icon={User}
              />
              <Input
                id="profile-email"
                label="Email Address"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                disabled={!editing}
                error={errors.email}
                icon={Mail}
              />
              <div className={styles.readonlyField}>
                <label className={styles.readLabel}>Member Since</label>
                <div className={styles.readValue}>
                  <Calendar size={15} />
                  <span>{formatDate(user?.joinedDate) || '—'}</span>
                </div>
              </div>
            </div>

            {editing && (
              <div className={styles.editActions}>
                <Button variant="secondary" size="sm" icon={X} onClick={handleCancel}>Cancel</Button>
                <Button variant="primary" size="sm" icon={Save} onClick={handleSave} loading={loading}>Save Changes</Button>
              </div>
            )}
          </div>
          
          {/* Danger Zone */}
          <div className={styles.dangerZone}>
            <div className={styles.dangerHeader}>
              <AlertTriangle size={18} /> Danger Zone
            </div>
            <p className={styles.dangerDesc}>
              Permanently delete your account and all your subscription data. This action cannot be undone.
            </p>
            <div className={styles.dangerActions}>
              <button 
                className={styles.deleteBtn} 
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Preferences & Security */}
        <div className={styles.rightColumn}>
          
          {/* Notifications Panel */}
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <Bell size={20} color="var(--primary-600)" />
              <h3 className={styles.panelTitle}>Notification Channels</h3>
            </div>
            
            <div className={styles.toggleList}>
              <div className={styles.toggleRow}>
                <div className={styles.toggleLeft}>
                  <div className={styles.toggleIcon} style={{ color: '#ea4335', background: 'rgba(234,67,53,0.1)' }}>
                    <Mail size={18} />
                  </div>
                  <div className={styles.toggleInfo}>
                    <h4>Email Alerts</h4>
                    <p>Receive summaries in your inbox</p>
                  </div>
                </div>
                <div className={`${styles.switch} ${notifications.email ? styles.active : ''}`} onClick={() => toggleNotif('email')} />
              </div>
            </div>
          </div>

          {/* Security Panel */}
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <Lock size={20} color="var(--primary-600)" />
              <h3 className={styles.panelTitle}>Security</h3>
            </div>
            
            {!showSecurity ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                <Button variant="primary" icon={Lock} onClick={() => setShowSecurity(true)}>
                  Change Password
                </Button>
              </div>
            ) : (
              <div className={styles.passwordForm}>
                {forgotPassword ? (
                  <div className={styles.verifyBox}>
                    <p>We've sent a 6-digit verification code to your email. Enter it below to authorize this password change.</p>
                    <Input 
                      id="verify-code"
                      label="Verification Code"
                      value={passForm.code}
                      onChange={(e) => setPassForm(p => ({ ...p, code: e.target.value }))}
                      icon={Key}
                      placeholder="123456"
                    />
                    <button className={styles.forgotLink} style={{ marginTop: 8 }} onClick={() => setForgotPassword(false)}>
                      I remembered my password
                    </button>
                  </div>
                ) : (
                  <>
                    <Input 
                      id="current-pass"
                      label="Current Password"
                      type="password"
                      value={passForm.current}
                      onChange={(e) => setPassForm(p => ({ ...p, current: e.target.value }))}
                    />
                    <button className={styles.forgotLink} onClick={() => setForgotPassword(true)}>
                      Forgot current password?
                    </button>
                  </>
                )}
                
                <Input 
                  id="new-pass"
                  label="New Password"
                  type="password"
                  value={passForm.newPass}
                  onChange={(e) => setPassForm(p => ({ ...p, newPass: e.target.value }))}
                />
                <Input 
                  id="confirm-pass"
                  label="Confirm New Password"
                  type="password"
                  value={passForm.confirm}
                  onChange={(e) => setPassForm(p => ({ ...p, confirm: e.target.value }))}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <Button variant="secondary" size="sm" onClick={() => setShowSecurity(false)}>Cancel</Button>
                  <Button variant="primary" size="sm">Update Password</Button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
