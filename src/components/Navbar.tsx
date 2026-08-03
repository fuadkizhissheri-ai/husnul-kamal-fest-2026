'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useLogo } from '@/lib/useLogo';
import { useRealtimeSync } from '@/components/useRealtimeSync';
import { Sun, Moon, Menu, X, ArrowUpRight, Sparkles, LayoutDashboard, UserPlus } from 'lucide-react';

const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662a11.87 11.87 0 005.71 1.455h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.488-8.41" />
  </svg>
);

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { logoUrl, logoLightUrl } = useLogo();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [waPhone, setWaPhone] = useState('917306480848');
  const pathname = usePathname();

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/render')) {
    return null;
  }

  const loadPhone = useCallback(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings?.contact_phone) {
          const raw = data.settings.contact_phone;
          const cleaned = raw.replace(/\D/g, '');
          if (cleaned.length >= 10) {
            setWaPhone(cleaned.startsWith('91') ? cleaned : `91${cleaned}`);
          }
        }
      })
      .catch((err) => console.error('Failed to load contact phone for WhatsApp navbar link:', err));
  }, []);

  useEffect(() => {
    loadPhone();
  }, [loadPhone]);

  useRealtimeSync(loadPhone);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/announcements', label: 'Announcements' },
    { href: '/schedule', label: 'Schedule' },
    { href: '/results', label: 'Results' },
    { href: '/participants', label: 'Participants' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/live', label: 'Live TV' },
  ];

  const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent('Hi, I have a question about Husnul Kamal Fest 2026')}`;

  return (
    <header className="sticky top-0 z-50 px-2 sm:px-8 pt-safe py-2 sm:py-3 transition-all duration-300 w-full max-w-[100vw] overflow-x-hidden">
      <div className="max-w-7xl mx-auto luxury-glass px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between shadow-luxury dark:shadow-luxury-dark">
        
        {/* LOGO LEFT */}
        <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group shrink-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={theme === 'light' && logoLightUrl ? logoLightUrl : logoUrl}
              alt="Husnul Kamal Fest Logo"
              className="h-8 sm:h-10 max-w-[110px] sm:max-w-[160px] object-contain group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0B0B0B] dark:bg-white text-[#C8A86B] font-serif font-bold text-lg sm:text-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                ﷺ
              </div>
              <div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <span className="font-bebas text-lg sm:text-2xl tracking-wider text-[#0B0B0B] dark:text-white uppercase leading-none">
                    Husnul Kamal
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-1.5 sm:px-2 py-0.5 rounded-full bg-[#C8A86B]/15 text-[#C8A86B] border border-[#C8A86B]/30 font-sans">
                    2026
                  </span>
                </div>
                <p className="text-[9px] sm:text-[10px] font-medium text-neutral-500 dark:text-neutral-400 hidden xs:block">
                  Mifthahul Uloom Ullisherikkunnu
                </p>
              </div>
            </>
          )}
        </Link>

        {/* NAVIGATION RIGHT (DESKTOP) */}
        <nav className="hidden xl:flex items-center space-x-1 bg-black/5 dark:bg-white/5 p-1 rounded-full border border-[#C8A86B]/20">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-1 rounded-full text-base font-bebas tracking-wider uppercase transition-all duration-300 ${
                  isActive
                    ? 'bg-[#0B0B0B] text-[#C8A86B] dark:bg-white dark:text-[#0B0B0B] shadow-sm'
                    : 'text-neutral-700 dark:text-neutral-300 hover:text-[#C8A86B] dark:hover:text-[#C8A86B]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* ACTIONS RIGHT */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          
          {/* OFFICIAL WHATSAPP CONTACT BUTTON */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex p-2 sm:p-2.5 rounded-full bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] dark:text-[#25D366] hover:scale-110 transition-all duration-300 items-center justify-center cursor-pointer shadow-sm"
            title="Chat with Control Desk Administration on WhatsApp"
          >
            <WhatsAppIcon className="w-4 h-4 fill-current" />
          </a>

          {/* THEME TOGGLE BUTTON */}
          <button
            onClick={toggleTheme}
            className="p-2 sm:p-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-[#C8A86B] text-neutral-700 dark:text-neutral-300 hover:text-[#C8A86B] transition-all duration-300 cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* REGISTER NOW CTA (HIDDEN ON VERY SMALL SCREENS, VISIBLE ON SM+) */}
          <Link
            href="/register"
            className="hidden sm:inline-flex btn-pill-luxury bg-[#18181B] text-[#F5E6C4] dark:bg-white dark:text-[#0B0B0B] hover:bg-[#9E741D] dark:hover:bg-[#C8A86B] font-bebas tracking-wider text-sm sm:text-base uppercase px-3.5 sm:px-5 py-2 sm:py-2.5 shadow-md transition-all duration-300 items-center justify-center gap-1.5 sm:gap-2 shrink-0 leading-none"
          >
            <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="leading-none translate-y-[1px]">Register Now</span>
          </Link>

          {/* ADMIN DESK CTA */}
          <Link
            href="/admin/dashboard"
            className="hidden md:inline-flex btn-pill-luxury bg-white/10 text-slate-800 dark:text-white border border-slate-300 dark:border-white/10 hover:border-[#C8A86B] font-bebas tracking-wider text-sm sm:text-base uppercase px-3.5 sm:px-5 py-2 sm:py-2.5 shadow-sm transition-all duration-300 items-center justify-center gap-1.5 sm:gap-2 shrink-0 leading-none"
          >
            <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="leading-none translate-y-[1px]">Admin</span>
          </Link>

          {/* MOBILE MENU TOGGLE */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 sm:p-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-neutral-700 dark:text-neutral-300 cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>

      </div>

      {/* MOBILE MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div className="xl:hidden max-w-7xl mx-auto mt-2 luxury-glass p-4 rounded-[28px] shadow-2xl border border-[#C8A86B]/30 flex flex-col space-y-2 animate-in fade-in slide-in-from-top-4">
          <Link
            href="/register"
            onClick={() => setMobileMenuOpen(false)}
            className="btn-pill-luxury bg-[#0B0B0B] text-[#C8A86B] dark:bg-white dark:text-[#0B0B0B] font-bebas tracking-wider text-base py-3 justify-center text-center font-bold flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>REGISTER NOW</span>
          </Link>

          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2.5 rounded-2xl text-lg font-bebas tracking-wider uppercase transition-all ${
                  isActive
                    ? 'bg-[#0B0B0B]/10 text-[#7A5600] dark:bg-white/10 dark:text-[#C8A86B] font-bold'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          
          <div className="pt-2 border-t border-white/10 flex flex-col space-y-2">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-pill-luxury bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40 text-sm py-2.5 justify-center text-center font-bold flex items-center space-x-2"
            >
              <WhatsAppIcon className="w-4 h-4 fill-current" />
              <span>Contact Control Desk (WhatsApp)</span>
            </a>

            <Link
              href="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-pill-luxury bg-white/10 text-slate-800 dark:text-white border border-slate-300 dark:border-white/10 text-sm py-2.5 justify-center text-center font-bold flex items-center space-x-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Control Desk (Admin Panel)</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
