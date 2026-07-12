// ============================================================
// Auth Context — Mock Authentication State
// ============================================================

import { createContext, useContext, useState } from 'react';
import { getCurrentUser, login as loginService, logout as logoutService, register as registerService, updateProfile } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getCurrentUser());
  const [loading] = useState(false);

  const login = async (email, password) => {
    const result = await loginService(email, password);
    setUser(result.user);
    return result;
  };


  const register = async (data) => {
    const result = await registerService(data);
    setUser(result.user);
    return result;
  };

  const logout = async () => {
    await logoutService();
    setUser(null);
  };

  const updateUser = async (updates) => {
    const updated = await updateProfile(updates);
    setUser(updated);
    return updated;
  };

  const deleteAccount = async () => {
    await import('../services/authService').then(m => m.deleteAccount());
    setUser(null);
  };

  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, register, logout, updateUser, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
