'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTabNavigation } from '@/components/TabNavigationProvider';
import {
  Settings, Save, CheckCircle2, Layout, Eye, Sparkles, Sliders, Calendar, MapPin,
  Phone, Mail, Award, Layers, Users, User, Plus, Trash2, ArrowUp, ArrowDown, Upload, Image as ImageIcon, AlertCircle, RotateCcw, Trophy, MessageCircle, Lock, ShieldCheck
} from 'lucide-react';
import { PointsSettings, DEFAULT_POINTS_SETTINGS, ProgrammePointsConfig } from '@/lib/scoring';

interface CommitteeMember {
  id: string;
  name: string;
  position: string;
  photoUrl: string;
  order: number;
}

const DEFAULT_COMMITTEE: CommitteeMember[] = [
  {
    id: 'mem_1',
    name: 'Fuad Jalali',
    position: 'Fest Convenor',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    order: 0,
  },
  {
    id: 'mem_2',
    name: 'Midlaj Roshan Kamali',
    position: 'Coordinator',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    order: 1,
  },
  {
    id: 'mem_3',
    name: 'Husain Saqafi',
    position: 'Chairman',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    order: 2,
  },
  {
    id: 'mem_4',
    name: 'Rashid Wafi',
    position: 'General Secretary',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    order: 3,
  },
  {
    id: 'mem_5',
    name: 'Anas Al-Hasan',
    position: 'Finance Controller',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    order: 4,
  },
];

export default function AdminSettingsPage() {
  // Logo & Branding Settings
  const [festLogoUrl, setFestLogoUrl] = useState('');
  const [festLogoLightUrl, setFestLogoLightUrl] = useState('');
  const [festLogoBackupUrl, setFestLogoBackupUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingLightLogo, setUploadingLightLogo] = useState(false);

  // Registration Panel Auth Credentials
  const [regUsername, setRegUsername] = useState('coordinator');
  const [regAuthEnabled, setRegAuthEnabled] = useState(true);
  const [regNewPassword, setRegNewPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [savingRegAuth, setSavingRegAuth] = useState(false);
  const [regAuthMessage, setRegAuthMessage] = useState('');

  // Points & Scoring Configuration Settings
  const [pointsSettings, setPointsSettings] = useState<PointsSettings>(DEFAULT_POINTS_SETTINGS);

  // General & Registration Settings
  const [festTitle, setFestTitle] = useState('Husnul Kamal — Meelad Fest 2026');
  const [festSubtitle, setFestSubtitle] = useState('Mifthahul Uloom Madrasa, Ullisherikkunnu');
  const [regOpen, setRegOpen] = useState(true);
  const [maxProgs, setMaxProgs] = useState('3');

  // Hero Section CMS
  const [heroCtaText, setHeroCtaText] = useState('Register as Delegate');
  const [arabicBgEnabled, setArabicBgEnabled] = useState(true);
  const [heroDelegatesCount, setHeroDelegatesCount] = useState('350+');
  const [heroProgrammesCount, setHeroProgrammesCount] = useState('100+');
  const [heroStagesCount, setHeroStagesCount] = useState('4 Stages');

  // About Section CMS
  const [aboutTitle, setAboutTitle] = useState('UNVEILING EXCELLENCE IN TALENT & ART');
  const [aboutDescription, setAboutDescription] = useState(
    'Mifthahul Uloom Madrasa Ullisherikkunnu proudly presents Husnul Kamal Meelad Fest 2026 — a grand celebration of talent, spirituality, and artistic brilliance.'
  );

  // Committee / Our Onboard CMS
  const [committeeSubtitle, setCommitteeSubtitle] = useState('The dedicated leadership team guiding Husnul Kamal Meelad Fest 2026.');
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>(DEFAULT_COMMITTEE);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  // Dates & Venue CMS
  const [festDates, setFestDates] = useState('August 10 – 12, 2026');
  const [venueName, setVenueName] = useState('Mifthahul Uloom Campus');
  const [venueAddress, setVenueAddress] = useState('Mifthahul Uloom Madrasa, Ullisherikkunnu, Kerala');
  const [countdownTarget, setCountdownTarget] = useState('2026-08-26T07:00:00');

  // Contact CMS (Powers Site-wide Footer, Navbar WhatsApp & Export Documents)
  const [contactPhone, setContactPhone] = useState('+91 73064 80848');
  const [contactEmail, setContactEmail] = useState('mifthahululoomuk@gmail.com');
  const [footerCopyright, setFooterCopyright] = useState('© 2026 Husnul Kamal Meelad Fest. Mifthahul Uloom Madrasa, Ullisherikkunnu.');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const { currentTab, setActiveTab } = useTabNavigation();
  const activeTab = currentTab || 'cms';

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          const s = d.settings;
          if (s.fest_logo_url) setFestLogoUrl(s.fest_logo_url);
          if (s.fest_logo_light_url) setFestLogoLightUrl(s.fest_logo_light_url);
          if (s.fest_logo_backup_url) setFestLogoBackupUrl(s.fest_logo_backup_url);

          if (s.points_settings) {
            try {
              const parsed = JSON.parse(s.points_settings);
              setPointsSettings(parsed);
            } catch (e) {
              console.error(e);
            }
          }

          if (s.fest_title) setFestTitle(s.fest_title);
          if (s.fest_subtitle) setFestSubtitle(s.fest_subtitle);
          if (s.registration_open !== undefined) setRegOpen(s.registration_open === 'true');
          if (s.max_programmes_per_participant) setMaxProgs(s.max_programmes_per_participant);
          
          if (s.hero_cta_text) setHeroCtaText(s.hero_cta_text);
          if (s.hero_arabic_bg_enabled !== undefined) setArabicBgEnabled(s.hero_arabic_bg_enabled === 'true');
          if (s.hero_delegates_count) setHeroDelegatesCount(s.hero_delegates_count);
          if (s.hero_programmes_count) setHeroProgrammesCount(s.hero_programmes_count);
          if (s.hero_stages_count) setHeroStagesCount(s.hero_stages_count);

          if (s.about_title) setAboutTitle(s.about_title);
          if (s.about_description) setAboutDescription(s.about_description);

          if (s.committee_subtitle) setCommitteeSubtitle(s.committee_subtitle);
          const rawMembers = s.onboard_team || s.committee_members;
          if (rawMembers) {
            try {
              const parsed = JSON.parse(rawMembers);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setCommitteeMembers(parsed);
              }
            } catch (e) {
              console.error(e);
            }
          }

          if (s.fest_dates) setFestDates(s.fest_dates);
          if (s.venue_name) setVenueName(s.venue_name);
          if (s.venue_address) setVenueAddress(s.venue_address);
          if (s.countdown_target) setCountdownTarget(s.countdown_target);

          if (s.contact_phone) setContactPhone(s.contact_phone);
          if (s.contact_email) setContactEmail(s.contact_email);
          if (s.footer_copyright) setFooterCopyright(s.footer_copyright);
        }
      });

    fetch('/api/admin/registration-auth')
      .then((r) => r.json())
      .then((d) => {
        if (d.regUsername) setRegUsername(d.regUsername);
        if (d.regAuthEnabled !== undefined) setRegAuthEnabled(d.regAuthEnabled);
      })
      .catch((err) => console.error(err));
  }, []);

  const handlePointsChange = (type: 'single' | 'group' | 'general', field: keyof ProgrammePointsConfig, val: number) => {
    setPointsSettings((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: Math.max(0, val),
      },
    }));
  };

  const handleMemberChange = (index: number, field: keyof CommitteeMember, value: any) => {
    const updated = [...committeeMembers];
    updated[index] = { ...updated[index], [field]: value };
    setCommitteeMembers(updated);
  };

  const handleAddMember = () => {
    const newMember: CommitteeMember = {
      id: `mem_${Date.now()}`,
      name: '',
      position: '',
      photoUrl: '',
      order: committeeMembers.length,
    };
    setCommitteeMembers([...committeeMembers, newMember]);
  };

  const handleRemoveMember = (index: number) => {
    if (committeeMembers.length <= 1) {
      alert('You must keep at least 1 committee member slot.');
      return;
    }
    const updated = committeeMembers.filter((_, i) => i !== index);
    setCommitteeMembers(updated);
  };

  const handleMoveMember = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === committeeMembers.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...committeeMembers];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    const ordered = updated.map((item, idx) => ({ ...item, order: idx }));
    setCommitteeMembers(ordered);
  };

  const handleUploadFile = async (file: File, onSuccess: (url: string) => void, setUploading: (u: boolean) => void) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        onSuccess(data.url);
      } else {
        alert(data.error || 'Photo upload failed');
      }
    } catch (e: any) {
      alert(`Upload error: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRevertLogoBackup = () => {
    if (!festLogoBackupUrl) {
      alert('No backup logo available to revert.');
      return;
    }
    const current = festLogoUrl;
    setFestLogoUrl(festLogoBackupUrl);
    setFestLogoBackupUrl(current);
  };

  const handleSaveRegAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRegAuth(true);
    setRegAuthMessage('');

    if (!regUsername.trim()) {
      setRegAuthMessage('Error: Registration username cannot be empty.');
      setSavingRegAuth(false);
      return;
    }

    if (regNewPassword) {
      if (regNewPassword.length < 8) {
        setRegAuthMessage('Error: New password must be at least 8 characters long.');
        setSavingRegAuth(false);
        return;
      }
      if (regNewPassword !== regConfirmPassword) {
        setRegAuthMessage('Error: Passwords do not match.');
        setSavingRegAuth(false);
        return;
      }
    }

    if (!confirm('This will change Registration Panel login credentials. Anyone currently registering will be logged out. Continue?')) {
      setSavingRegAuth(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/registration-auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regUsername: regUsername.trim(),
          regAuthEnabled,
          newPassword: regNewPassword || undefined,
          confirmPassword: regConfirmPassword || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRegAuthMessage('Registration Panel credentials updated successfully');
        setRegNewPassword('');
        setRegConfirmPassword('');
      } else {
        setRegAuthMessage(`Error: ${data.error || 'Failed to save credentials'}`);
      }
    } catch (err: any) {
      setRegAuthMessage(`Error: ${err.message || 'Save failed'}`);
    } finally {
      setSavingRegAuth(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    // Phone Validation
    const cleanedPhone = contactPhone.replace(/\D/g, '');
    if (!cleanedPhone || cleanedPhone.length < 7) {
      setMessage('Error: Invalid control desk phone number. Please enter a valid phone number (e.g. +91 73064 80848).');
      setSaving(false);
      return;
    }

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail.trim())) {
      setMessage('Error: Invalid official email address format. Please enter a valid email.');
      setSaving(false);
      return;
    }

    const invalidMember = committeeMembers.find((m) => !m.name.trim() || !m.position.trim());
    if (invalidMember) {
      setMessage('Error: Please fill in Name and Position for all committee member slots before saving.');
      setSaving(false);
      return;
    }

    try {
      const serializedMembers = JSON.stringify(
        committeeMembers.map((m, idx) => ({ ...m, order: idx }))
      );

      const newBackupUrl = festLogoUrl !== '' ? festLogoUrl : festLogoBackupUrl;

      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fest_logo_url: festLogoUrl,
          fest_logo_light_url: festLogoLightUrl || festLogoUrl,
          fest_logo_backup_url: newBackupUrl,
          points_settings: JSON.stringify(pointsSettings),
          fest_title: festTitle,
          fest_subtitle: festSubtitle,
          registration_open: String(regOpen),
          max_programmes_per_participant: maxProgs,
          hero_cta_text: heroCtaText,
          hero_arabic_bg_enabled: String(arabicBgEnabled),
          hero_delegates_count: heroDelegatesCount,
          hero_programmes_count: heroProgrammesCount,
          hero_stages_count: heroStagesCount,
          about_title: aboutTitle,
          about_description: aboutDescription,
          committee_subtitle: committeeSubtitle,
          committee_members: serializedMembers,
          onboard_team: serializedMembers,
          fest_dates: festDates,
          venue_name: venueName,
          venue_address: venueAddress,
          countdown_target: countdownTarget,
          contact_phone: contactPhone,
          contact_email: contactEmail,
          footer_copyright: footerCopyright,
        }),
      });

      setMessage('All Venue & Contact details, Fest Logo, and Settings saved successfully!');
    } catch (err: any) {
      setMessage(`Error: ${err.message || 'Save failed'}`);
    } finally {
      setSaving(false);
    }
  };

  const waCleanPhone = contactPhone.replace(/\D/g, '') || '917306480848';

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#C8A86B]" />
            <span>Fest Branding &amp; Content Settings</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Manage official Fest Logo, Venue &amp; Contact Details, Points &amp; Scoring per position, Onboard Team, and site policies.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center space-x-2 bg-black/5 dark:bg-white/5 p-1 rounded-full border border-slate-300 dark:border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('cms')}
            className={`px-4 py-1.5 rounded-full font-bold transition-all ${
              activeTab === 'cms'
                ? 'bg-[#C8A86B] text-[#0B0B0B] shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Edit Content
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-1.5 rounded-full font-bold transition-all ${
              activeTab === 'preview'
                ? 'bg-[#C8A86B] text-[#0B0B0B] shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Live Preview
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center space-x-2 ${
          message.startsWith('Error')
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
        }`}>
          {message.startsWith('Error') ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{message}</span>
        </div>
      )}

      {activeTab === 'cms' ? (
        <form onSubmit={handleSave} className="space-y-6">

          {/* 1. FEST LOGO & BRANDING MANAGEMENT */}
          <div className="luxury-glass p-6 rounded-[28px] border border-[#C8A86B]/40 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold font-serif text-[#C8A86B] flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-[#C8A86B]" />
                  <span>1. Official Fest Logo &amp; Branding</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Single reusable asset reference — updates Navbar, Homepage, Footer, Certificates, ID Cards, PDFs &amp; Live Cast automatically.
                </p>
              </div>

              {festLogoBackupUrl && (
                <button
                  type="button"
                  onClick={handleRevertLogoBackup}
                  className="btn-pill-luxury bg-white/10 hover:bg-white/20 text-xs font-bold px-3 py-1.5 flex items-center space-x-1 text-slate-300 border border-white/10"
                  title="Revert to previous logo backup"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#C8A86B]" />
                  <span>Revert to Backup Logo</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Primary Logo (Dark Backgrounds)</span>
                  <span className="text-[9px] font-mono text-[#C8A86B] uppercase">PNG / SVG • MAX 5MB</span>
                </div>

                <div className="h-28 rounded-xl bg-[#0B0B0B] border border-white/20 flex items-center justify-center p-3 relative overflow-hidden">
                  {festLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={festLogoUrl} alt="Primary Fest Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="flex items-center space-x-3 text-white font-serif text-xl font-bold">
                      <div className="w-10 h-10 rounded-full bg-[#0B0B0B] border border-[#C8A86B] text-[#C8A86B] flex items-center justify-center">ﷺ</div>
                      <span>Husnul Kamal 2026</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    placeholder="https://... logo URL"
                    value={festLogoUrl}
                    onChange={(e) => setFestLogoUrl(e.target.value)}
                    className="flex-1 w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-[11px] truncate"
                  />
                  <label className="btn-pill-luxury bg-[#C8A86B] text-[#0B0B0B] font-bold text-xs px-3 py-2 flex items-center justify-center space-x-1 cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingLogo ? 'Uploading...' : 'Upload PNG'}</span>
                    <input
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleUploadFile(e.target.files[0], setFestLogoUrl, setUploadingLogo);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Light Background Variant (Certificates / Print)</span>
                  <span className="text-[9px] font-mono text-[#C8A86B] uppercase">OPTIONAL</span>
                </div>

                <div className="h-28 rounded-xl bg-[#FAF8F3] border border-slate-300 flex items-center justify-center p-3 relative overflow-hidden">
                  {festLogoLightUrl || festLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={festLogoLightUrl || festLogoUrl} alt="Light Background Fest Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="flex items-center space-x-3 text-slate-900 font-serif text-xl font-bold">
                      <div className="w-10 h-10 rounded-full bg-[#1F3A3A] text-[#C8A86B] flex items-center justify-center">ﷺ</div>
                      <span>Husnul Kamal 2026</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    placeholder="https://... light logo URL"
                    value={festLogoLightUrl}
                    onChange={(e) => setFestLogoLightUrl(e.target.value)}
                    className="flex-1 w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-[11px] truncate"
                  />
                  <label className="btn-pill-luxury bg-white/20 text-white font-bold text-xs px-3 py-2 flex items-center justify-center space-x-1 cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5 text-[#C8A86B]" />
                    <span>{uploadingLightLogo ? 'Uploading...' : 'Upload Light Logo'}</span>
                    <input
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleUploadFile(e.target.files[0], setFestLogoLightUrl, setUploadingLightLogo);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 2. REGISTRATION PANEL ACCESS CREDENTIALS (COORDINATOR LOGIN PROTECTION) */}
          <div className="luxury-glass p-6 rounded-[28px] border border-[#C8A86B]/40 space-y-4">
            <div className="border-b border-white/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold font-serif text-[#C8A86B] flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-[#C8A86B]" />
                  <span>2. Registration Access Credentials (Coordinator Login Protection)</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Manage username and password required for madrasa staff/coordinators to access the Delegate Registration Panel.
                </p>
              </div>

              <div className="flex items-center space-x-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10 shrink-0">
                <span className="text-[10px] font-bold text-slate-300">Require Login:</span>
                <input
                  type="checkbox"
                  checked={regAuthEnabled}
                  onChange={(e) => setRegAuthEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#C8A86B]"
                />
              </div>
            </div>

            {regAuthMessage && (
              <div className={`p-3 rounded-2xl border text-xs font-semibold flex items-center space-x-2 ${
                regAuthMessage.startsWith('Error')
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                {regAuthMessage.startsWith('Error') ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{regAuthMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Coordinator Username *</label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="coordinator"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Shared login username for madrasa coordinators</p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Set New Password (Min 8 chars)</label>
                <input
                  type="password"
                  value={regNewPassword}
                  onChange={(e) => setRegNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Leave blank to keep existing password unchanged</p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Re-type new password to confirm</p>
              </div>

              <div className="md:col-span-3 flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveRegAuth}
                  disabled={savingRegAuth}
                  className="btn-pill-luxury bg-[#C8A86B] text-[#0B0B0B] font-bold text-xs px-6 py-2.5 shadow-lg hover:bg-[#B8943A] flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingRegAuth ? 'Saving Credentials...' : 'Save Registration Credentials'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. VENUE & CONTACT SETTINGS SECTION (SINGLE SOURCE OF TRUTH) */}
          <div className="luxury-glass p-6 rounded-[28px] border border-[#C8A86B]/40 space-y-4">
            <div className="border-b border-white/10 pb-3">
              <h2 className="text-base font-bold font-serif text-[#C8A86B] flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-[#C8A86B]" />
                <span>2. Venue &amp; Contact Information (Powers Site-wide Footer &amp; WhatsApp Links)</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Single source of truth — updating address, phone, or email here updates Footer, Navbar WhatsApp button, Certificates &amp; ID Cards instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">Venue Address (Multi-line text supported)</label>
                <textarea
                  rows={2}
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  placeholder="Mifthahul Uloom Campus, Ullisherikkunnu, Kerala"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Control Desk Phone Number *</label>
                <input
                  type="text"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 73064 80848"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                />
                <p className="text-[10px] text-emerald-400 mt-1 flex items-center space-x-1">
                  <span>⚡ Powers Navbar &amp; Footer WhatsApp link: https://wa.me/{waCleanPhone}</span>
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Control Desk Official Email *</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="mifthahululoomuk@gmail.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  ⚡ Powers Footer mailto: link across all pages
                </p>
              </div>
            </div>
          </div>

          {/* 3. POINTS & SCORING SETTINGS SECTION */}
          <div className="luxury-glass p-6 rounded-[28px] border border-[#C8A86B]/40 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold font-serif text-[#C8A86B] flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-[#C8A86B]" />
                  <span>3. Points &amp; Scoring Configuration</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Configure fixed points awarded per position for Single Item, Group Item, and General programmes.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Note: Updates apply to new results entered from now on. Existing published results retain their earned points.</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="font-bold text-white text-xs border-b border-white/10 pb-2 flex items-center justify-between">
                  <span>Single Item Programmes</span>
                  <span className="text-[9px] font-mono text-[#C8A86B]">DEFAULT 10 / 7 / 5</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">1st Place</label>
                    <input
                      type="number"
                      min="0"
                      value={pointsSettings.single.first}
                      onChange={(e) => handlePointsChange('single', 'first', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">2nd Place</label>
                    <input
                      type="number"
                      min="0"
                      value={pointsSettings.single.second}
                      onChange={(e) => handlePointsChange('single', 'second', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">3rd Place</label>
                    <input
                      type="number"
                      min="0"
                      value={pointsSettings.single.third}
                      onChange={(e) => handlePointsChange('single', 'third', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">Grade A</label>
                    <input
                      type="number"
                      min="0"
                      value={pointsSettings.single.gradeA}
                      onChange={(e) => handlePointsChange('single', 'gradeA', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">Grade B</label>
                    <input
                      type="number"
                      min="0"
                      value={pointsSettings.single.gradeB}
                      onChange={(e) => handlePointsChange('single', 'gradeB', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">Participation</label>
                    <input
                      type="number"
                      min="0"
                      value={pointsSettings.single.participation}
                      onChange={(e) => handlePointsChange('single', 'participation', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="font-bold text-white text-xs border-b border-white/10 pb-2 flex items-center justify-between">
                  <span>Group Item Programmes</span>
                  <span className="text-[9px] font-mono text-[#C8A86B]">DEFAULT 15 / 10 / 7</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">1st Place</label>
                    <input
                      type="number"
                      min="0"
                      value={pointsSettings.group.first}
                      onChange={(e) => handlePointsChange('group', 'first', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">2nd Place</label>
                    <input
                      type="number"
                      min="0"
                      value={pointsSettings.group.second}
                      onChange={(e) => handlePointsChange('group', 'second', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">3rd Place</label>
                    <input
                      type="number"
                      min="0"
                      value={pointsSettings.group.third}
                      onChange={(e) => handlePointsChange('group', 'third', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">Grade A</label>
                    <input
                      type="number"
                      min="0"
                      value={pointsSettings.group.gradeA}
                      onChange={(e) => handlePointsChange('group', 'gradeA', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">Grade B</label>
                    <input
                      type="number"
                      min="0"
                      value={pointsSettings.group.gradeB}
                      onChange={(e) => handlePointsChange('group', 'gradeB', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">Participation</label>
                    <input
                      type="number"
                      min="0"
                      value={pointsSettings.group.participation}
                      onChange={(e) => handlePointsChange('group', 'participation', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="font-bold text-white text-xs border-b border-white/10 pb-2 flex items-center justify-between">
                  <span>General Category Programmes</span>
                  <span className="text-[9px] font-mono text-[#C8A86B]">DEFAULT 20 / 15 / 10</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">1st Place</label>
                    <input
                      type="number"
                      min="0"
                      value={pointsSettings.general.first}
                      onChange={(e) => handlePointsChange('general', 'first', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">2nd Place</label>
                    <input
                      type="number"
                      min="0"
                      value={pointsSettings.general.second}
                      onChange={(e) => handlePointsChange('general', 'second', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">3rd Place</label>
                    <input
                      type="number"
                      min="0"
                      value={pointsSettings.general.third}
                      onChange={(e) => handlePointsChange('general', 'third', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">Grade A</label>
                    <input
                      type="number"
                      min="0"
                      value={pointsSettings.general.gradeA}
                      onChange={(e) => handlePointsChange('general', 'gradeA', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">Grade B</label>
                    <input
                      type="number"
                      min="0"
                      value={pointsSettings.general.gradeB}
                      onChange={(e) => handlePointsChange('general', 'gradeB', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">Participation</label>
                    <input
                      type="number"
                      min="0"
                      value={pointsSettings.general.participation}
                      onChange={(e) => handlePointsChange('general', 'participation', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. GENERAL TITLE & REGISTRATION POLICIES */}
          <div className="luxury-glass p-6 rounded-[28px] border border-[#C8A86B]/30 space-y-4">
            <h2 className="text-base font-bold font-serif text-[#C8A86B] flex items-center space-x-2 border-b border-white/10 pb-3">
              <Sliders className="w-4 h-4 text-[#C8A86B]" />
              <span>4. General Title &amp; Registration Policy</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Fest Main Title</label>
                <input
                  type="text"
                  value={festTitle}
                  onChange={(e) => setFestTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Fest Subtitle / Institution</label>
                <input
                  type="text"
                  value={festSubtitle}
                  onChange={(e) => setFestSubtitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Max Programmes Per Participant</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxProgs}
                  onChange={(e) => setMaxProgs(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              {/* DYNAMIC FEST START DATE & TIME PICKER FOR COUNTDOWN CARD */}
              <div className="p-4 rounded-2xl bg-[#C8A86B]/10 border border-[#C8A86B]/30 md:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-white font-bold text-xs flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-[#C8A86B]" />
                    <span>Fest Start Date &amp; Time (Powers Homepage Dynamic Countdown)</span>
                  </label>
                  <span className="text-[10px] font-mono text-[#C8A86B] font-bold">DYNAMIC COUNTDOWN</span>
                </div>
                <input
                  type="datetime-local"
                  value={countdownTarget ? countdownTarget.slice(0, 16) : ''}
                  onChange={(e) => setCountdownTarget(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-[#C8A86B] font-mono font-bold text-sm focus:outline-none focus:border-[#C8A86B]"
                />
                <p className="text-[10px] text-slate-400 font-sans">
                  The homepage countdown card calculates Days, Hours, and Minutes dynamically in real-time based on this target date. If the event date passes, it automatically shows <strong>LIVE NOW</strong>.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10 md:col-span-2">
                <div>
                  <div className="font-bold text-white text-xs">Delegate Registration Status</div>
                  <div className="text-[10px] text-slate-400">Toggle whether public delegate registrations are currently accepted</div>
                </div>
                <input
                  type="checkbox"
                  checked={regOpen}
                  onChange={(e) => setRegOpen(e.target.checked)}
                  className="w-5 h-5 accent-[#C8A86B]"
                />
              </div>
            </div>
          </div>

          {/* 5. ONBOARD TEAM CMS */}
          <div className="luxury-glass p-6 rounded-[28px] border border-[#C8A86B]/30 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold font-serif text-[#C8A86B] flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#C8A86B]" />
                  <span>5. Onboard Team Manager (Committee Leadership)</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Add, edit, upload photos, and reorder team members shown on the homepage.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddMember}
                className="btn-pill-luxury bg-[#C8A86B] text-[#0B0B0B] font-bold text-xs px-3.5 py-1.5 flex items-center space-x-1 shadow-md hover:bg-[#B8943A]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Member Slot</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Committee Section Subtitle</label>
                <input
                  type="text"
                  value={committeeSubtitle}
                  onChange={(e) => setCommitteeSubtitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="space-y-4 pt-2">
                {committeeMembers.map((member, idx) => (
                  <div
                    key={member.id || idx}
                    className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-[#C8A86B]/20 text-[#C8A86B] font-mono text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-white text-xs">
                          {member.name || `Member #${idx + 1}`}
                        </span>
                        <span className="text-[10px] text-[#C8A86B] font-mono uppercase">
                          {member.position ? `(${member.position})` : ''}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleMoveMember(idx, 'up')}
                          disabled={idx === 0}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveMember(idx, 'down')}
                          disabled={idx === committeeMembers.length - 1}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(idx)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors ml-2"
                          title="Delete Member Slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div className="flex items-center space-x-3">
                        <div className="w-14 h-14 rounded-full border-2 border-[#C8A86B] overflow-hidden bg-slate-900 shrink-0 flex items-center justify-center relative">
                          {member.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-7 h-7 text-[#C8A86B]/60" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all">
                            <Upload className="w-3 h-3 text-[#C8A86B]" />
                            <span>{uploadingIdx === idx ? 'Uploading...' : 'Upload Photo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleUploadFile(e.target.files[0], (url) => handleMemberChange(idx, 'photoUrl', url), (u) => setUploadingIdx(u ? idx : null));
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1 font-bold">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Midlaj Roshan Kamali"
                          value={member.name}
                          onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1 font-bold">Position / Role *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Chief Convener"
                          value={member.position}
                          onChange={(e) => handleMemberChange(idx, 'position', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-[#C8A86B] font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1 font-bold font-mono">Image Direct URL</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={member.photoUrl}
                          onChange={(e) => handleMemberChange(idx, 'photoUrl', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-[10px]"
                        />
                      </div>

                    </div>

                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-pill-luxury bg-[#C8A86B] text-[#0B0B0B] font-bold text-sm px-8 py-3.5 shadow-xl hover:bg-[#B8943A] flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Settings...' : 'Save All Settings & Contact Info'}</span>
            </button>
          </div>

        </form>
      ) : (
        /* LIVE PREVIEW TAB */
        <div className="luxury-glass p-6 rounded-[28px] border border-[#C8A86B]/30 space-y-6">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold text-[#C8A86B] uppercase tracking-widest">
              BRANDING &amp; LOGO LIVE PREVIEW
            </span>
            <div className="flex items-center justify-center space-x-4 py-2">
              <div className="p-4 rounded-2xl bg-[#0B0B0B] border border-white/20 flex items-center space-x-3">
                {festLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={festLogoUrl} alt="Logo" className="h-10 object-contain" />
                ) : (
                  <div className="text-[#C8A86B] font-serif text-xl font-bold">ﷺ Husnul Kamal 2026</div>
                )}
              </div>
              <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-slate-300 flex items-center space-x-3">
                {festLogoLightUrl || festLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={festLogoLightUrl || festLogoUrl} alt="Logo Light" className="h-10 object-contain" />
                ) : (
                  <div className="text-slate-900 font-serif text-xl font-bold">ﷺ Husnul Kamal 2026</div>
                )}
              </div>
            </div>
          </div>

          {/* FOOTER VENUE & CONTACT LIVE PREVIEW CARD */}
          <div className="border-t border-white/10 pt-6 space-y-3">
            <span className="text-xs font-mono font-bold text-[#C8A86B] uppercase tracking-widest block text-center">
              FOOTER 'VENUE &amp; CONTACT' LIVE PREVIEW
            </span>

            <div className="max-w-md mx-auto p-5 rounded-2xl bg-[#0B0B0B] border border-[#C8A86B]/30 text-white space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#C8A86B]">
                Venue &amp; Contact
              </h3>
              <ul className="space-y-3 text-xs text-neutral-300">
                <li className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-[#C8A86B] shrink-0 mt-0.5" />
                  <span className="whitespace-pre-line">{venueAddress || 'Mifthahul Uloom Campus, Ullisherikkunnu, Kerala'}</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <a
                    href={`https://wa.me/${waCleanPhone}?text=Hi%2C%20I%20have%20a%20question%20about%20Husnul%20Kamal%20Fest%202026`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline flex items-center space-x-1.5 font-mono"
                  >
                    <span>{contactPhone}</span>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">WhatsApp</span>
                  </a>
                </li>
                <li className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-[#C8A86B] shrink-0" />
                  <a href={`mailto:${contactEmail}`} className="text-white hover:text-[#C8A86B] underline font-mono">
                    {contactEmail}
                  </a>
                </li>
              </ul>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
