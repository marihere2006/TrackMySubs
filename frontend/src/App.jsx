// ============================================================
// App.jsx — Root component with Toast system
// ============================================================

import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { ToastProvider } from './context/ToastContext';
import { AIProvider } from './context/AIContext';
import FloatingAIButton from './components/ai/FloatingAIButton';
import AIOverlay from './components/ai/AIOverlay';
import AppRoutes from './routes/AppRoutes';
import './styles/ai.css';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <AIProvider>
                <AppRoutes />
                <FloatingAIButton />
                <AIOverlay />
              </AIProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
