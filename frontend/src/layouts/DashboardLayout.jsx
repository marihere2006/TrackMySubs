// ============================================================
// DashboardLayout — Main layout wrapper for authenticated pages
// ============================================================

import { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { LayoutProvider, useLayout } from '../context/LayoutContext';
import styles from './DashboardLayout.module.css';

const DashboardLayoutContent = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { mobileOpen, closeMobileMenu } = useLayout();

  // Collapse sidebar on small screens by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className={`${styles.layout} ${collapsed ? styles.sidebarCollapsed : ''}`}
    >
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={closeMobileMenu}
      />

      <div className={styles.main}>
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
};

const DashboardLayout = ({ children }) => {
  return (
    <LayoutProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </LayoutProvider>
  );
};

export default DashboardLayout;
