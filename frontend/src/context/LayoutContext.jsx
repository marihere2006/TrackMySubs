import { createContext, useContext, useState } from 'react';

const LayoutContext = createContext();

export const useLayout = () => {
  return useContext(LayoutContext);
};

export const LayoutProvider = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  return (
    <LayoutContext.Provider value={{ mobileOpen, toggleMobileMenu, closeMobileMenu }}>
      {children}
    </LayoutContext.Provider>
  );
};
