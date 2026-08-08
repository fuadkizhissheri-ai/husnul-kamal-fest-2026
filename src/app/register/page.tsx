'use client';

import React, { useState, useEffect } from 'react';
import SmoothScroll from '@/components/SmoothScroll';
import PrintableIDCard from '@/components/PrintableIDCard';
import { UserPlus, AlertCircle, CheckCircle2, User, Layers, ArrowUpRight, Upload, Loader2, Flame, Hash, Sparkles, FileText, Globe, Lock, LogOut, ShieldCheck } from 'lucide-react';

interface Programme {
  id: string;
  name: string;
  category: string;
  stage: string;
  date: string;
  startTime: string;
  endTime: string;
  participantLimit: number;
  registeredCount: number;
  isFull: boolean;
  mavaddaCount?: number;
  mahabbaCount?: number;
  isMavaddaFull?: boolean;
  isMahabbaFull?: boolean;
  isGroup?: boolean;
}

interface GroupChestInfo {
  nextChestNumber: string | null;
  isFull: boolean;
  remaining: number;
  min: number;
  max: number;
}

export default function RegisterPage() {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [maxProgrammesAllowed, setMaxProgrammesAllowed] = useState(3);
  const [initialLoading, setInitialLoading] = useState(true);

  // Registration Auth Gate State
  const [regAuthRequired, setRegAuthRequired] = useState(true);
  const [regAuthenticated, setRegAuthenticated] = useState(false);
  const [regAuthUser, setRegAuthUser] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  // Login Form Fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Group Chest Info State
  const [chestInfo, setChestInfo] = useState<{ MAVADDA?: GroupChestInfo; MAHABBA?: GroupChestInfo }>({});

  // Registration Form Fields
  const [fullName, setFullName] = useState('');
  const [group, setGroup] = useState<'MAVADDA' | 'MAHABBA'>('MAVADDA');
  const [category, setCategory] = useState<'Sub Junior' | 'Junior' | 'Senior' | 'Super Senior'>('Sub Junior');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [dob, setDob] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Programmes State
  const [categoryProgrammes, setCategoryProgrammes] = useState<Programme[]>([]);
  const [generalProgrammes, setGeneralProgrammes] = useState<Programme[]>([]);
  const [selectedProgrammeIds, setSelectedProgrammeIds] = useState<string[]>([]);

  // Submission Status
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [registeredParticipant, setRegisteredParticipant] = useState<any | null>(null);

  const checkAuthStatus = () => {
    setAuthLoading(true);
    fetch('/api/register/me')
      .then((r) => r.json())
      .then((d) => {
        setRegAuthRequired(d.authRequired !== false);
        setRegAuthenticated(d.authenticated === true);
        if (d.username) setRegAuthUser(d.username);
      })
      .catch((err) => console.error(err))
      .finally(() => setAuthLoading(false));
  };

  const fetchChestInfo = () => {
    fetch('/api/chest-numbers')
      .then((res) => res.json())
      .then((data) => {
        setChestInfo(data);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    checkAuthStatus();

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          if (data.settings.registration_open === 'false') {
            setIsRegistrationOpen(false);
          }
          if (data.settings.max_programmes_per_participant) {
            setMaxProgrammesAllowed(parseInt(data.settings.max_programmes_per_participant, 10) || 3);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setInitialLoading(false));

    fetchChestInfo();
  }, []);

  useEffect(() => {
    if (!category || (regAuthRequired && !regAuthenticated)) return;
    fetch(`/api/programmes?category=${encodeURIComponent(category)}&activeOnly=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.categoryProgrammes) setCategoryProgrammes(data.categoryProgrammes);
        if (data.generalProgrammes) setGeneralProgrammes(data.generalProgrammes);
        setSelectedProgrammeIds([]);
      })
      .catch((err) => console.error(err));
  }, [category, regAuthRequired, regAuthenticated]);

  const handleRegLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginSubmitting(true);
    setLoginError('');

    try {
      const res = await fetch('/api/register/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRegAuthenticated(true);
        setLoginPassword('');
        checkAuthStatus();
      } else {
        setLoginError(data.error || 'Incorrect username or password');
      }
    } catch (err: any) {
      setLoginError('Authentication failed. Please try again.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleRegLogout = async () => {
    await fetch('/api/register/logout', { method: 'POST' });
    setRegAuthenticated(false);
    checkAuthStatus();
  };

  const handleFileUpload = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setPhotoUrl(data.url);
      } else {
        alert(data.error || 'Photo upload failed');
      }
    } catch (e: any) {
      alert(`Upload error: ${e.message}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const toggleProgrammeSelection = (id: string) => {
    if (selectedProgrammeIds.includes(id)) {
      setSelectedProgrammeIds(selectedProgrammeIds.filter((pId) => pId !== id));
    } else {
      const prog = categoryProgrammes.find(p => p.id === id) || generalProgrammes.find(p => p.id === id);
      
      if (prog) {
        const isSingle = !prog.isGroup && prog.category.toLowerCase() !== 'general';
        
        if (isSingle) {
          const singleItemsCount = selectedProgrammeIds.filter(pid => {
            const p = categoryProgrammes.find(c => c.id === pid) || generalProgrammes.find(g => g.id === pid);
            return p && !p.isGroup && p.category.toLowerCase() !== 'general';
          }).length;
          
          if (singleItemsCount >= maxProgrammesAllowed) {
            alert(`Maximum limit of ${maxProgrammesAllowed} Single items reached. Group and General items are excluded.`);
            return;
          }
        }
      }

      setSelectedProgrammeIds([...selectedProgrammeIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    if (selectedProgrammeIds.length === 0) {
      setErrorMessage('Please select at least 1 programme for registration.');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        fullName,
        group,
        category,
        gender,
        dob,
        whatsapp,
        photoUrl,
        programmeIds: selectedProgrammeIds,
      };

      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setRegisteredParticipant(data.participant);
        fetchChestInfo();
      } else {
        setErrorMessage(data.error || 'Failed to submit registration. Please check fields.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderProgrammeGrid = (programmesList: any[]) => {
    if (programmesList.length === 0) return (
      <p className="text-xs text-slate-500 italic py-2">No programmes found in this section.</p>
    );
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {programmesList.map((prog) => {
          const isSelected = selectedProgrammeIds.includes(prog.id);
          return (
            <div
              key={prog.id}
              onClick={() => !prog.isFull && toggleProgrammeSelection(prog.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'bg-[#C8A86B]/20 border-[#C8A86B] shadow-md'
                  : prog.isFull
                  ? 'opacity-40 bg-black/5 dark:bg-white/5 border-transparent cursor-not-allowed'
                  : 'bg-black/5 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-[#C8A86B]/50'
              }`}
            >
              <div className="space-y-1">
                <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <span>{prog.name}</span>
                  {prog.isGroup && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-normal">
                      Group
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono">
                  {prog.stage} • {prog.startTime}
                </div>
              </div>

              <div className="shrink-0 pl-2">
                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-[#C8A86B] text-[#0B0B0B] flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-slate-400 dark:border-white/30" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (initialLoading || authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8A86B]" />
      </div>
    );
  }

  // CLOSED REGISTRATION NOTICE
  if (!isRegistrationOpen) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-[#0B0B0B] dark:text-white">
          Registration Closed
        </h1>
        <p className="text-xs text-neutral-500 max-w-lg mx-auto">
          Online delegate registration is closed by the Fest Controlling Desk.
        </p>
      </div>
    );
  }

  // REGISTRATION PANEL LOGIN SCREEN
  if (regAuthRequired && !regAuthenticated) {
    return (
      <SmoothScroll>
        <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 py-12">
          <div className="max-w-md w-full luxury-glass p-8 rounded-[32px] border border-[#C8A86B]/40 shadow-2xl space-y-6">
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#18181B] dark:bg-white text-[#C8A86B] dark:text-[#0B0B0B] border border-[#C8A86B]/40 flex items-center justify-center mx-auto shadow-lg">
                <Lock className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#C8A86B]">
                MIFTHAHUL ULOOM DELEGATE PORTAL
              </span>
              <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
                Coordinator Registration Access
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Please enter coordinator credentials to access student delegate registration.
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleRegLogin} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. coordinator"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/10 border border-slate-300 dark:border-[#C8A86B]/30 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/10 border border-slate-300 dark:border-[#C8A86B]/30 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loginSubmitting}
                className="w-full btn-pill-luxury bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] font-bold text-sm py-3.5 shadow-xl hover:bg-[#9E741D] flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
              >
                {loginSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize Registration Access</span>
                  </>
                )}
              </button>
            </form>

            <p className="text-[10px] text-center text-slate-400 font-mono">
              Protected by bcrypt hashing &amp; rate-limit security.
            </p>
          </div>
        </div>
      </SmoothScroll>
    );
  }

  // SUCCESS CONFIRMATION MODAL / SCREEN
  if (registeredParticipant) {
    return (
      <SmoothScroll>
        <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-8">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">REGISTRATION SUCCESSFUL</span>
            <h1 className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
              {registeredParticipant.fullName} Registered!
            </h1>
            <p className="text-xs text-neutral-400">
              Assigned Chest Number: <strong className="text-[#C8A86B] font-mono text-base">{registeredParticipant.chestNumber}</strong>
            </p>
          </div>

          {/* Printable ID Card Component */}
          <div className="py-4 flex justify-center">
            <PrintableIDCard participant={registeredParticipant} />
          </div>

          <div className="pt-4 flex justify-center space-x-4">
            <button
              onClick={() => {
                setRegisteredParticipant(null);
                setFullName('');
                setSelectedProgrammeIds([]);
              }}
              className="btn-pill-luxury bg-[#C8A86B] text-[#0B0B0B] font-bold text-xs px-6 py-3 shadow-lg"
            >
              + Register Another Participant
            </button>
          </div>
        </div>
      </SmoothScroll>
    );
  }

  return (
    <SmoothScroll>
      <div className="max-w-4xl mx-auto px-6 sm:px-8 py-12 space-y-8">
        
        {/* Header with Coordinator Auth Status */}
        <div className="text-center space-y-3 relative">
          {regAuthRequired && (
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Coordinator Authorized: {regAuthUser || 'coordinator'}</span>
              <button
                onClick={handleRegLogout}
                className="ml-2 text-rose-500 hover:underline text-[10px] flex items-center space-x-0.5"
                title="Sign out of registration portal"
              >
                <LogOut className="w-3 h-3" />
                <span>Logout</span>
              </button>
            </div>
          )}

          <span className="text-xs font-bold uppercase tracking-widest text-[#9E741D] dark:text-[#C8A86B] block">
            Mifthahul Uloom Delegate Portal
          </span>
          <h1 className="text-3xl sm:text-6xl font-heading font-extrabold text-[#0B0B0B] dark:text-white">
            Delegate Registration
          </h1>
          <p className="max-w-2xl mx-auto text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-sans">
            Automatic chest number assignment with dynamic category &amp; general programme selection.
          </p>
        </div>

        {/* LIVE CHEST NUMBER REMAINING COUNTERS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="luxury-glass p-5 rounded-[24px] border border-[#9E741D]/25 dark:border-[#C8A86B]/30 flex items-center justify-between shadow-luxury">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-[#9E741D] dark:text-[#C8A86B]" />
                <span className="font-heading font-bold text-sm text-[#0B0B0B] dark:text-white">Mavadda House</span>
              </div>
              <p className="text-[10px] text-neutral-500 font-mono">Chest Range: 101 – 299</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-heading font-black text-[#9E741D] dark:text-[#C8A86B]">
                {chestInfo.MAVADDA ? `${chestInfo.MAVADDA.remaining} Left` : '...'}
              </div>
              {chestInfo.MAVADDA?.isFull && (
                <span className="text-[9px] font-bold text-rose-400 uppercase">FULL</span>
              )}
            </div>
          </div>

          <div className="luxury-glass p-5 rounded-[24px] border border-[#9E741D]/25 dark:border-[#C8A86B]/30 flex items-center justify-between shadow-luxury">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-[#9E741D] dark:text-[#C8A86B]" />
                <span className="font-heading font-bold text-sm text-[#0B0B0B] dark:text-white">Mahabba House</span>
              </div>
              <p className="text-[10px] text-neutral-500 font-mono">Chest Range: 301 – 499</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-heading font-black text-[#9E741D] dark:text-[#C8A86B]">
                {chestInfo.MAHABBA ? `${chestInfo.MAHABBA.remaining} Left` : '...'}
              </div>
              {chestInfo.MAHABBA?.isFull && (
                <span className="text-[9px] font-bold text-rose-400 uppercase">FULL</span>
              )}
            </div>
          </div>
        </div>

        {/* ERROR NOTIFICATION */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* FORM CONTAINER */}
        <form onSubmit={handleSubmit} className="luxury-glass p-6 sm:p-10 rounded-[32px] border border-[#9E741D]/25 dark:border-[#C8A86B]/30 shadow-luxury space-y-8">
          
          {/* SECTION 1: PARTICIPANT PERSONAL DETAILS */}
          <div className="space-y-4">
            <h3 className="text-lg font-heading font-bold text-[#9E741D] dark:text-[#C8A86B] flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>1. Delegate Personal Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Full Delegate Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Al-Mahdi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/10 border border-slate-300 dark:border-[#C8A86B]/30 text-xs text-[#0B0B0B] dark:text-white placeholder-neutral-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">House Group Selection *</label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/10 border border-slate-300 dark:border-[#C8A86B]/30 text-xs font-semibold text-[#0B0B0B] dark:text-white focus:outline-none"
                >
                  <option value="MAVADDA" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">MAVADDA HOUSE (Chest 101-299)</option>
                  <option value="MAHABBA" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">MAHABBA HOUSE (Chest 301-499)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/10 border border-slate-300 dark:border-[#C8A86B]/30 text-xs font-semibold text-[#0B0B0B] dark:text-white focus:outline-none"
                >
                  <option value="Sub Junior" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Sub Junior (Classes 3, 4)</option>
                  <option value="Junior" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Junior (Classes 5, 6)</option>
                  <option value="Senior" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Senior (Classes 7, 8)</option>
                  <option value="Super Senior" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Super Senior (Classes 9-12)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Gender *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/10 border border-slate-300 dark:border-[#C8A86B]/30 text-xs font-semibold text-[#0B0B0B] dark:text-white focus:outline-none"
                >
                  <option value="Male" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Male</option>
                  <option value="Female" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Female</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/10 border border-slate-300 dark:border-[#C8A86B]/30 text-xs text-[#0B0B0B] dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">WhatsApp Contact Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 7306480848"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/10 border border-slate-300 dark:border-[#C8A86B]/30 text-xs text-[#0B0B0B] dark:text-white placeholder-neutral-400 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Passport Photo (Optional Upload)</label>
                <label className="cursor-pointer bg-black/5 dark:bg-white/10 border border-dashed border-[#C8A86B]/40 hover:border-[#C8A86B] p-2.5 rounded-2xl flex items-center justify-center space-x-2 text-xs text-neutral-300 transition-all">
                  {uploadingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#C8A86B]" />
                  ) : (
                    <Upload className="w-4 h-4 text-[#C8A86B]" />
                  )}
                  <span className="truncate">{uploadingPhoto ? 'Uploading Photo...' : photoUrl ? 'Photo Uploaded ✓' : 'Upload Passport Photo File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </label>
              </div>

            </div>
          </div>

          {/* SECTION 2: DYNAMIC PROGRAMME SELECTION */}
          <div className="space-y-6 pt-6 border-t border-black/10 dark:border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-heading font-bold text-[#9E741D] dark:text-[#C8A86B] flex items-center space-x-2">
                  <Layers className="w-5 h-5" />
                  <span>2. Dynamic Programme Selection</span>
                </h3>
                <p className="text-xs text-neutral-400">Select checkboxes for requested programmes.</p>
              </div>

              <div className="text-right">
                <span className={`text-[10px] sm:text-xs font-mono font-bold px-3 py-1.5 rounded-full border ${
                  selectedProgrammeIds.filter(pid => {
                    const p = categoryProgrammes.find(c => c.id === pid) || generalProgrammes.find(g => g.id === pid);
                    return p && !p.isGroup && p.category.toLowerCase() !== 'general';
                  }).length >= maxProgrammesAllowed
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : 'bg-[#C8A86B]/15 text-[#C8A86B] border-[#C8A86B]/30'
                }`}>
                  Selected Single Items: {selectedProgrammeIds.filter(pid => {
                    const p = categoryProgrammes.find(c => c.id === pid) || generalProgrammes.find(g => g.id === pid);
                    return p && !p.isGroup && p.category.toLowerCase() !== 'general';
                  }).length} / {maxProgrammesAllowed} Max
                </span>
              </div>
            </div>

            {/* CATEGORY-SPECIFIC SINGLE PROGRAMMES */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                <Sparkles className="w-4 h-4 text-[#9E741D] dark:text-[#C8A86B]" />
                <span>Category Programmes ({category})</span>
              </div>
              {renderProgrammeGrid(categoryProgrammes.filter((p) => !p.isGroup))}
            </div>

            {/* CATEGORY-SPECIFIC GROUP PROGRAMMES */}
            <div className="space-y-3 pt-4 border-t border-black/5 dark:border-white/5">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                <Layers className="w-4 h-4 text-[#9E741D] dark:text-[#C8A86B]" />
                <span>Group Programmes ({category})</span>
              </div>
              {renderProgrammeGrid(categoryProgrammes.filter((p) => p.isGroup))}
            </div>

            {/* GENERAL PROGRAMMES */}
            {generalProgrammes.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-black/5 dark:border-white/5">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  <Globe className="w-4 h-4 text-[#9E741D] dark:text-[#C8A86B]" />
                  <span>General Programmes (Open to All Categories)</span>
                </div>
                {renderProgrammeGrid(generalProgrammes)}
              </div>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto btn-pill-luxury bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] font-bold text-sm px-10 py-4 shadow-xl hover:bg-[#9E741D] flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Submit Delegate Registration</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </SmoothScroll>
  );
}
