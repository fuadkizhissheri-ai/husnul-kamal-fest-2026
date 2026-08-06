'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AutoRefreshHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Force a soft reload of server components and data
        router.refresh();
      }
    };

    // Listen for the tab/app coming to the foreground
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Some webviews might fire focus instead of visibilitychange
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [router]);

  return null;
}
