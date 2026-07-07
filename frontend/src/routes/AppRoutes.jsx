// ============================================================
// AppRoutes — All application routes with auth guard
// ============================================================

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import SubscriptionsPage from '../pages/SubscriptionsPage';
import AddSubscriptionPage from '../pages/AddSubscriptionPage';
import EditSubscriptionPage from '../pages/EditSubscriptionPage';
import ExpiredPage from '../pages/ExpiredPage';
import HistoryPage from '../pages/HistoryPage';
import ProfilePage from '../pages/ProfilePage';
import NotFoundPage from '../pages/NotFoundPage';

// ── Protected route wrapper ─────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-500)', animation: 'spin 600ms linear infinite', margin: '0 auto 12px' }} />
          Loading…
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
};

// ── Guest route — redirect authenticated users to dashboard ──
const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Protected routes */}
      <Route path="/dashboard"         element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/subscriptions"     element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
      <Route path="/add-subscription"  element={<ProtectedRoute><AddSubscriptionPage /></ProtectedRoute>} />
      <Route path="/edit-subscription/:id" element={<ProtectedRoute><EditSubscriptionPage /></ProtectedRoute>} />
      <Route path="/expired"           element={<ProtectedRoute><ExpiredPage /></ProtectedRoute>} />
      <Route path="/history"           element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
      <Route path="/profile"           element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<ProtectedRoute><NotFoundPage /></ProtectedRoute>} />
    </Routes>
  );
};

export default AppRoutes;
