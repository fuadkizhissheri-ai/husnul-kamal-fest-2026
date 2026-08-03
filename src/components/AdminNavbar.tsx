'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLogo } from '@/lib/useLogo';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Trophy,
  Bell,
  Image,
  Settings,
  Info,
  Lock,
  LogOut,
  Sparkles,
  Tv,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Radio,
  FileText,
} from 'lucide-react';

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logoUrl } = useLogo();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { href: '/admin/participants', label: 'Delegates & ID Pass', icon: Users },
    { href: '/admin/programmes', label: 'Programmes Catalog', icon: Sparkles },
    { href: '/admin/results', label: 'Results & Scoreboard', icon: Trophy },
    { href: '/admin/schedule', label: 'Schedule Itinerary', icon: Calendar },
    { href: '/admin/announcements', label: 'Announcements', icon: Bell },
    { href: '/admin/certificates', label: 'Certificates & ID Cards', icon: FileText },
    { href: '/admin/gallery', label: 'Gallery Albums', icon: Image },
    { href: '/admin/about', label: 'About & Metrics', icon: Info },
    { href: '/admin/settings', label: 'Portal Settings', icon: Settings },
    { href: '/admin/change-password', label: 'Security Password', icon: Lock },
  ];

  return (
    <>
      {/* MOBILE TOP HEADER BAR (Shown on small screens) */}
      <div className="lg:hidden bg-white dark:bg-[#0B0B0B] border-b border-slate-200 dark:border-[#C8A86B]/30 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Fest Logo" className="h-8 max-w-[120px] object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] font-serif font-bold text-base flex items-center justify-center shadow-md">
              ﷺ
            </div>
          )}
          <span className="font-heading font-extrabold text-sm text-slate-900 dark:text-white">Husnul Kamal Admin</span>
        </div>

        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 text-[#9E741D] dark:text-[#C8A86B] bg-black/5 dark:bg-white/5 rounded-xl border border-slate-300 dark:border-[#C8A86B]/30"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* SIDEBAR NAVIGATION (Desktop Fixed + Mobile Overlay) */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white/90 dark:bg-[#0B0B0B] border-r border-slate-200 dark:border-[#C8A86B]/30 p-5 flex flex-col justify-between shrink-0 transform transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6 overflow-y-auto">
          
          {/* LOGO & BRANDING */}
          <div className="flex items-center space-x-3 px-2 border-b border-slate-200 dark:border-white/10 pb-4">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Fest Logo" className="h-9 max-w-[140px] object-contain" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-2xl bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] font-serif font-bold text-xl flex items-center justify-center shadow-lg">
                  ﷺ
                </div>
                <div>
                  <h2 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                    Control Desk
                  </h2>
                  <p className="text-[10px] text-[#9E741D] dark:text-[#C8A86B] font-mono">
                    Husnul Kamal 2026
                  </p>
                </div>
              </>
            )}
          </div>

          {/* REALTIME CONNECTED BADGE */}
          <div className="mx-2 p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 flex items-center space-x-2 text-[11px] font-mono text-emerald-800 dark:text-emerald-400 font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>REALTIME SYNCED</span>
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] font-bold shadow-md'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-[#9E741D] dark:hover:text-[#C8A86B]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM USER / LOGOUT BLOCK */}
        <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 font-semibold transition-colors"
          >
            <span className="flex items-center space-x-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Website</span>
            </span>
            <span className="text-[10px] font-mono bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded">
              LIVE
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Control Desk</span>
          </button>
        </div>
      </aside>
    </>
  );
}
