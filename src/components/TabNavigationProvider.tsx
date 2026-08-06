'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
// @ts-ignore - Module will be installed on Vercel deployment
import { App } from '@capacitor/app';
import { useRouter, usePathname } from 'next/navigation';

interface TabNavigationContextType {
  activeTabHistory: string[];
  currentTab: string | null;
  setActiveTab: (tabId: string) => void;
  popTab: () => boolean; // Returns true if a tab was popped
}

const TabNavigationContext = createContext<TabNavigationContextType | undefined>(undefined);

export function TabNavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeTabHistory, setActiveTabHistory] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = activeTabHistory.length > 0 ? activeTabHistory[activeTabHistory.length - 1] : null;

  const setActiveTab = useCallback((tabId: string) => {
    setActiveTabHistory((prev) => {
      if (prev[prev.length - 1] === tabId) return prev; // Avoid duplicate consecutive tabs
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

  useEffect(() => {
    let isSubscribed = true;

    const setupListener = async () => {
      try {
        await App.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
          if (!isSubscribed) return;

          // 1. Try to pop tab history first
          if (activeTabHistory.length > 1) {
            popTab();
            return;
          }

          // 2. Otherwise navigate router history
          // Check if on a root page
          const isRoot = pathname === '/' || pathname === '/admin/dashboard';
          
          if (!isRoot) {
            if (canGoBack || window.history.length > 1) {
              router.back();
            } else {
              router.push('/');
            }
          } else {
            // Exit app only if on root
            App.exitApp();
          }
        });
      } catch (err) {
        // Fallback for non-Capacitor web environments
        console.log("Capacitor App plugin not available (likely running in web browser).");
      }
    };

    setupListener();

    return () => {
      isSubscribed = false;
      try {
        App.removeAllListeners();
      } catch (e) {}
    };
  }, [router, pathname, activeTabHistory, popTab]);

  return (
    <TabNavigationContext.Provider value={{ activeTabHistory, currentTab, setActiveTab, popTab }}>
      {children}
    </TabNavigationContext.Provider>
  );
}

export function useTabNavigation() {
  const context = useContext(TabNavigationContext);
  if (!context) {
    throw new Error('useTabNavigation must be used within a TabNavigationProvider');
  }
  return context;
}
