'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface TabNavigationContextType {
  activeTabHistory: string[];
  currentTab: string | null;
  setActiveTab: (tabId: string) => void;
  popTab: () => boolean;
  registerModal: (id: string, onClose: () => void) => void;
  unregisterModal: (id: string) => void;
}

const TabNavigationContext = createContext<TabNavigationContextType | undefined>(undefined);

export function TabNavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeTabHistory, setActiveTabHistory] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  const modalsRef = useRef<{ id: string; onClose: () => void }[]>([]);
  const isBackActionInProgress = useRef(false);

  const registerModal = useCallback((id: string, onClose: () => void) => {
    if (!modalsRef.current.find(m => m.id === id)) {
      modalsRef.current.push({ id, onClose });
      window.history.pushState({ modal: id }, '');
    }
  }, []);

  const unregisterModal = useCallback((id: string) => {
    const exists = modalsRef.current.find((m) => m.id === id);
    if (exists) {
      modalsRef.current = modalsRef.current.filter((m) => m.id !== id);
      // If we aren't currently popping this due to a back button, it means the user closed it manually
      // We must clean up the history stack
      if (!isBackActionInProgress.current) {
        window.history.back();
      }
    }
  }, []);

  const currentTab = activeTabHistory.length > 0 ? activeTabHistory[activeTabHistory.length - 1] : null;

  const setActiveTab = useCallback((tabId: string) => {
    setActiveTabHistory((prev) => {
      if (prev[prev.length - 1] === tabId) return prev;
      window.history.pushState({ tab: tabId }, '');
      return [...prev, tabId];
    });
  }, []);

  const popTab = useCallback(() => {
    let popped = false;
    setActiveTabHistory((prev) => {
      if (prev.length > 1) {
        popped = true;
        return prev.slice(0, -1);
      }
      return prev;
    });
    return popped;
  }, []);

  const handleBackAction = useCallback(async (fromCapacitor = false, canGoBack = true, CapacitorApp?: any) => {
    isBackActionInProgress.current = true;

    try {
      // 1. MODAL CHECK
      if (modalsRef.current.length > 0) {
        const topModal = modalsRef.current[modalsRef.current.length - 1];
        topModal.onClose(); // This triggers unregisterModal via useEffect, but isBackActionInProgress is true
        modalsRef.current.pop();
        
        if (fromCapacitor) {
          window.history.back(); // Sync browser history since capacitor bypassed popstate
        }
        return true;
      }

      // 2. TAB CHECK
      if (activeTabHistory.length > 1) {
        popTab();
        if (fromCapacitor) {
           window.history.back(); 
        }
        return true;
      }

      // 3. PAGE CHECK
      const isRoot = pathname === '/' || pathname === '/admin/dashboard';
      if (!isRoot) {
        if (canGoBack || window.history.length > 1) {
          if (fromCapacitor) {
            router.back();
          }
          return true;
        } else {
          if (fromCapacitor) {
            router.push('/');
          }
          return true;
        }
      } else {
        // 4. EXIT CHECK
        if (fromCapacitor && CapacitorApp) {
          CapacitorApp.exitApp();
        }
        return false;
      }
    } finally {
      // Small timeout to allow state to settle before we consider back action done
      setTimeout(() => {
        isBackActionInProgress.current = false;
      }, 100);
    }
  }, [activeTabHistory.length, pathname, popTab, router]);

  useEffect(() => {
    let handler: any;
    let isSubscribed = true;

    const setupBackButton = async () => {
      try {
        const { App } = await import('@capacitor/app');
        if (!isSubscribed) return;

        handler = await App.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
          // Fallback DOM check for unmanaged modals as requested by user
          const openModal = document.querySelector('[role="dialog"]');
          if (openModal) {
            const closeBtn = openModal.querySelector('button[data-close]') as HTMLButtonElement;
            if (closeBtn) {
              closeBtn.click();
              return;
            }
          }

          handleBackAction(true, canGoBack, App);
        });
      } catch (e) {
        console.log('Capacitor App plugin not available in web mode', e);
      }
    };

    setupBackButton();

    return () => {
      isSubscribed = false;
      if (handler && typeof handler.remove === 'function') {
        handler.remove();
      }
    };
  }, [handleBackAction]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      handleBackAction(false, true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleBackAction]);

  return (
    <TabNavigationContext.Provider value={{ activeTabHistory, currentTab, setActiveTab, popTab, registerModal, unregisterModal }}>
      {children}
    </TabNavigationContext.Provider>
  );
}

export function useGlobalModal(isOpen: boolean, onClose: () => void, modalId: string) {
  const context = useContext(TabNavigationContext);
  useEffect(() => {
    if (!context) return;
    if (isOpen) {
      context.registerModal(modalId, onClose);
    } else {
      context.unregisterModal(modalId);
    }
  }, [isOpen, modalId, context, onClose]);
}

export function useTabNavigation() {
  const context = useContext(TabNavigationContext);
  if (!context) {
    throw new Error('useTabNavigation must be used within a TabNavigationProvider');
  }
  return context;
}
