'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ExternalLink, ShieldCheck, Globe } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    fetch('/api/admin/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/admin/login');
        } else {
          setAuthenticated(true);
        }
      })
      .catch(() => router.push('/admin/login'))
      .finally(() => setLoading(false));
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3] dark:bg-[#070709] text-[#9E741D] dark:text-[#C8A86B] font-serif">
        Authenticating Admin Control Desk Session...
      </div>
    );
  }

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-[#FAF8F3] dark:bg-[#070709] text-slate-900 dark:text-white flex flex-col lg:flex-row font-sans transition-colors duration-300">
      <AdminNavbar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* TOP HEADER BAR (DESKTOP) */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white/80 dark:bg-[#0B0B0B] border-b border-slate-200 dark:border-[#C8A86B]/20 backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#9E741D] dark:text-[#C8A86B]" />
            <span className="text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Control Desk • Mifthahul Uloom Madrasa, Ullisherikkunnu
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-neutral-400 hover:text-[#9E741D] dark:hover:text-[#C8A86B] font-medium transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Public Website</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <div className="h-4 w-px bg-slate-300 dark:bg-white/10" />

            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-[#F5E6C4] dark:bg-[#C8A86B]/20 border border-[#E5C578] dark:border-[#C8A86B]/40 text-[#7A5600] dark:text-[#C8A86B] font-bold text-xs flex items-center justify-center font-mono">
                A
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white">Administrator</div>
                <div className="text-[10px] text-[#9E741D] dark:text-[#C8A86B] font-mono">Super Admin</div>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 px-3.5 sm:px-8 py-4 sm:py-6 max-w-7xl w-full mx-auto space-y-6">
          <ErrorBoundary fallbackTitle="Admin Page Error">
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
