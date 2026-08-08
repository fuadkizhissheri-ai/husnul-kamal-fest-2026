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

export function useHardwareBackButton(activeTab: string | null, setActiveTab: (tab: string) => void) {
  const router = useRouter();
  const pathname = usePathname();
  const historyStack = useRef<string[]>([]);

  // Maintain custom tab stack
  useEffect(() => {
    if (activeTab && historyStack.current[historyStack.current.length - 1] !== activeTab) {
      historyStack.current.push(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    let backListener: any = null;

    const init = async () => {
      try {
        const { App } = await import('@capacitor/app');
        backListener = await App.addListener('backButton', ({ canGoBack }) => {
          // Priority 1: Dialog / Modal Close
          const openModal = document.querySelector('[role="dialog"], .modal-open');
          if (openModal) {
            const closeBtn = openModal.querySelector('button[aria-label="Close"], button[data-close], .close-btn') as HTMLButtonElement;
            if (closeBtn) {
              closeBtn.click();
              return;
            }
          }

          // Priority 2: Custom Tab Navigation History
          if (historyStack.current.length > 1) {
            historyStack.current.pop(); // remove current
            const previousTab = historyStack.current[historyStack.current.length - 1];
            setActiveTab(previousTab);
            return;
          }

          // Priority 3: Browser / Next.js History
          if (pathname !== '/' && pathname !== '/admin/dashboard' && canGoBack) {
            router.back();
            return;
          }

          // Priority 4: Exit ONLY if sitting at Home / Dashboard and history is empty
          App.exitApp();
        });
      } catch (e) {
        console.log('Capacitor App plugin not available in web mode');
      }
    };

    init();

    return () => {
      if (backListener) {
        if (typeof backListener.remove === 'function') {
          backListener.remove();
        } else if (typeof backListener.then === 'function') {
          backListener.then((handler: any) => handler.remove());
        }
      }
    };
  }, [pathname, router, setActiveTab]);
}

export function TabNavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeTabHistory, setActiveTabHistory] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  const historyRef = useRef<string[]>([]);
  const modalsRef = useRef<{ id: string; onClose: () => void }[]>([]);
  const isBackActionInProgress = useRef(false);

  useEffect(() => {
    historyRef.current = activeTabHistory;
  }, [activeTabHistory]);

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

  useHardwareBackButton(currentTab, setActiveTab);

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

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      isBackActionInProgress.current = true;
      try {
        if (modalsRef.current.length > 0) {
          const topModal = modalsRef.current[modalsRef.current.length - 1];
          topModal.onClose();
          modalsRef.current.pop();
          return;
        }

        if (historyRef.current.length > 1) {
          setActiveTabHistory(prev => prev.slice(0, -1));
          return;
        }
      } finally {
        setTimeout(() => { isBackActionInProgress.current = false; }, 100);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
