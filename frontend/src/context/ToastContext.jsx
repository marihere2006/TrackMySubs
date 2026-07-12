// ============================================================
// ToastContext — Global toast notification system
// ============================================================

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TITLES = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

const DURATION = {
  success: 3500,
  error: 5000,
  warning: 4500,
  info: 4000,
};

// ── Toast Item ────────────────────────────────────────
const ToastItem = ({ toast, onRemove }) => {
  const Icon = ICONS[toast.type] || Info;

  return (
    <div className={`toast toast-${toast.type}${toast.exiting ? ' exiting' : ''}`}>
      <Icon className="toast-icon" size={20} />
      <div className="toast-body">
        <div className="toast-title">{toast.title || TITLES[toast.type]}</div>
        {toast.message && <div className="toast-message">{toast.message}</div>}
      </div>
      <button className="toast-close" onClick={() => onRemove(toast.id)} aria-label="Dismiss">
        <X size={14} />
      </button>
      <div
        className="toast-progress"
        style={{
          animation: `progressBar ${toast.duration}ms linear forwards`,
        }}
      />
    </div>
  );
};

// ── Provider ──────────────────────────────────────────
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    // Mark as exiting first for animation
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 260);
  }, []);

  const addToast = useCallback(({ type = 'info', title, message }) => {
    const id = ++toastIdCounter;
    const duration = DURATION[type] || 4000;
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
    setTimeout(() => removeToast(id), duration);
    return id;
  }, [removeToast]);

  const showSuccess = useCallback((message, title) => addToast({ type: 'success', title, message }), [addToast]);
  const showError   = useCallback((message, title) => addToast({ type: 'error', title, message }), [addToast]);
  const showWarning = useCallback((message, title) => addToast({ type: 'warning', title, message }), [addToast]);
  const showInfo    = useCallback((message, title) => addToast({ type: 'info', title, message }), [addToast]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showWarning, showInfo }}>
      {children}
      {createPortal(
        <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
