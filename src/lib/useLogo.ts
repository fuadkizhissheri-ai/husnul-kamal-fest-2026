'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRealtimeSync } from '@/components/useRealtimeSync';

export interface LogoSettings {
  logoUrl: string;
  logoLightUrl: string;
  backupLogoUrl: string;
}

const DEFAULT_LOGO = '';

export function useLogo(): LogoSettings {
  const [logoSettings, setLogoSettings] = useState<LogoSettings>({
    logoUrl: '',
    logoLightUrl: '',
    backupLogoUrl: '',
  });

  const fetchLogo = useCallback(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) {
          setLogoSettings({
            logoUrl: data.settings.fest_logo_url || '',
            logoLightUrl: data.settings.fest_logo_light_url || data.settings.fest_logo_url || '',
            backupLogoUrl: data.settings.fest_logo_backup_url || '',
          });
        }
      })
      .catch((err) => console.error('Failed to fetch logo settings:', err));
  }, []);

  useEffect(() => {
    fetchLogo();
  }, [fetchLogo]);

  useRealtimeSync(fetchLogo);

  return logoSettings;
}
