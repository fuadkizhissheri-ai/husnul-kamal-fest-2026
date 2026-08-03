'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useLogo } from '@/lib/useLogo';
import { useRealtimeSync } from '@/components/useRealtimeSync';
import { Sun, Moon, Menu, X, ArrowUpRight, Sparkles, LayoutDashboard, UserPlus, MessageCircle } from 'lucide-react';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { logoUrl, logoLightUrl } = useLogo();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [waPhone, setWaPhone] = useState('917306480848');
  const pathname = usePathname();

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
    <header className="sticky top-0 z-50 px-4 sm:px-8 py-4 transition-all duration-300">
      <div className="max-w-7xl mx-auto luxury-glass px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-luxury dark:shadow-luxury-dark">
        
        {/* LOGO LEFT */}
        <Link href="/" className="flex items-center space-x-3 group shrink-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={theme === 'light' && logoLightUrl ? logoLightUrl : logoUrl}
              alt="Husnul Kamal Fest Logo"
              className="h-9 sm:h-10 max-w-[150px] object-contain group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-[#0B0B0B] dark:bg-white text-[#C8A86B] font-serif font-bold text-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                ﷺ
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-heading font-extrabold text-base sm:text-xl tracking-tight text-[#0B0B0B] dark:text-white">
                    Husnul Kamal
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#C8A86B]/15 text-[#C8A86B] border border-[#C8A86B]/30 font-sans">
                    2026
                  </span>
                </div>
                <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 hidden xs:block">
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
                  isActive
                    ? 'bg-[#0B0B0B] text-[#C8A86B] dark:bg-white dark:text-[#0B0B0B] shadow-sm font-bold'
                    : 'text-neutral-700 dark:text-neutral-300 hover:text-[#C8A86B] dark:hover:text-[#C8A86B]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* ACTIONS RIGHT */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* WHATSAPP CONTACT BUTTON (DYNAMICALLY BOUND TO VENUE & CONTACT SETTINGS) */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:scale-105 transition-all duration-300 flex items-center justify-center cursor-pointer"
            title="Chat with Control Desk Administration on WhatsApp"
            aria-label="WhatsApp Contact Desk"
          >
            <svg className="w-4 h-4 fill-current text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
          </a>

          {/* THEME TOGGLE BUTTON */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-[#C8A86B] text-neutral-700 dark:text-neutral-300 hover:text-[#C8A86B] transition-all duration-300 cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* REGISTER NOW CTA (NAVBAR PRIMARY ACTION) */}
          <Link
            href="/register"
            className="btn-pill-luxury bg-[#18181B] text-[#F5E6C4] dark:bg-white dark:text-[#0B0B0B] hover:bg-[#9E741D] dark:hover:bg-[#C8A86B] font-bold text-xs px-3.5 py-2 shadow-md transition-all duration-300 flex items-center space-x-1.5 shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register Now</span>
          </Link>

          {/* ADMIN DESK CTA */}
          <Link
            href="/admin/dashboard"
            className="hidden sm:inline-flex btn-pill-luxury bg-white/10 text-slate-800 dark:text-white border border-slate-300 dark:border-white/10 hover:border-[#C8A86B] text-xs px-3.5 py-2 shadow-sm transition-all duration-300 flex items-center space-x-1.5 shrink-0"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Admin</span>
          </Link>

          {/* MOBILE MENU TOGGLE */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-neutral-700 dark:text-neutral-300"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* MOBILE MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div className="xl:hidden max-w-7xl mx-auto mt-2 luxury-glass p-4 rounded-[28px] shadow-2xl border border-[#C8A86B]/30 flex flex-col space-y-2 animate-in fade-in slide-in-from-top-4">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-2xl text-sm font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-[#0B0B0B] text-[#C8A86B] dark:bg-white dark:text-[#0B0B0B] font-bold'
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
              className="btn-pill-luxury bg-emerald-500/20 text-emerald-400 text-sm py-2.5 justify-center text-center font-bold flex items-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contact Control Desk (WhatsApp)</span>
            </a>

            <Link
              href="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-pill-luxury bg-[#0B0B0B] text-[#C8A86B] dark:bg-white dark:text-[#0B0B0B] text-sm py-2.5 justify-center text-center font-bold"
            >
              Control Desk (Admin Panel)
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
