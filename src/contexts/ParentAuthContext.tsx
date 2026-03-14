import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'chuck_parent_auth';
const DEFAULT_PASSWORD = 'parent2024'; // 后续可改为环境变量或后台配置

type ParentAuthContextValue = {
  isParent: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  loginModalOpen: boolean;
};

const ParentAuthContext = createContext<ParentAuthContextValue | null>(null);

export function ParentAuthProvider({ children }: { children: React.ReactNode }) {
  const [isParent, setIsParent] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === '1') setIsParent(true);
  }, []);

  const login = useCallback((password: string): boolean => {
    if (password.trim() === DEFAULT_PASSWORD) {
      setIsParent(true);
      localStorage.setItem(STORAGE_KEY, '1');
      setLoginModalOpen(false);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsParent(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const openLoginModal = useCallback(() => setLoginModalOpen(true), []);
  const closeLoginModal = useCallback(() => setLoginModalOpen(false), []);

  return (
    <ParentAuthContext.Provider
      value={{
        isParent,
        login,
        logout,
        openLoginModal,
        closeLoginModal,
        loginModalOpen,
      }}
    >
      {children}
    </ParentAuthContext.Provider>
  );
}

export function useParentAuth() {
  const ctx = useContext(ParentAuthContext);
  if (!ctx) throw new Error('useParentAuth must be used within ParentAuthProvider');
  return ctx;
}
