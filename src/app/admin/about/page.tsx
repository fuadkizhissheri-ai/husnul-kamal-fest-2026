'use client';

import React, { useState, useEffect } from 'react';
import { Info, Save, CheckCircle2, Eye, Sliders, Sparkles, Award, Globe, Heart, ShieldCheck, Layers, Users } from 'lucide-react';

export default function AdminAboutPage() {
  // 1. Header CMS
  const [tagline, setTagline] = useState('MIFTHAHUL ULOOM MADRASA, ULLISHERIKKUNNU');
  const [mainHeading, setMainHeading] = useState('ABOUT HUSNUL KAMAL FEST');
  const [headerDesc, setHeaderDesc] = useState(
    'Husnul Kamal Meelad Fest 2026 is an ultra-premium Islamic cultural fest celebrating Quranic excellence, divine art, and devotion under Mifthahul Uloom Madrasa.'
  );

  // 2. 5 Stat Cards CMS
  const [stat1Val, setStat1Val] = useState('450+');
  const [stat1Label, setStat1Label] = useState('Delegates');

  const [stat2Val, setStat2Val] = useState('32');
  const [stat2Label, setStat2Label] = useState('Programmes');

  const [stat3Val, setStat3Val] = useState('4');
  const [stat3Label, setStat3Label] = useState('Categories');

  const [stat4Val, setStat4Val] = useState('4');
  const [stat4Label, setStat4Label] = useState('Live Stages');

  const [stat5Val, setStat5Val] = useState('120+');
  const [stat5Label, setStat5Label] = useState('Awards & Trophies');

  // 3. 4 Info Cards CMS
  const [card1Badge, setCard1Badge] = useState('HERITAGE');
  const [card1Title, setCard1Title] = useState('Our Heritage & Journey');
  const [card1Body, setCard1Body] = useState(
    'Mifthahul Uloom Madrasa, Ullisherikkunnu has served as a beacon of Islamic learning, nurturing generations of students in Qirat, Islamic literature, and moral leadership.'
  );

  const [card2Badge, setCard2Badge] = useState('VISION');
  const [card2Title, setCard2Title] = useState('Our Vision');
  const [card2Body, setCard2Body] = useState(
    'To foster a holistic cultural eco-system where Islamic artistic talents thrive alongside deep spiritual devotion and academic excellence.'
  );

  const [card3Badge, setCard3Badge] = useState('MISSION');
  const [card3Title, setCard3Title] = useState('Our Mission');
  const [card3Body, setCard3Body] = useState(
    'Empowering 450+ delegates across 4 competitive categories through transparent, real-time judged talent competitions and team sportsmanship.'
  );

  const [card4Badge, setCard4Badge] = useState('MAHABBA & SUNNAH');
  const [card4Title, setCard4Title] = useState('Love for Prophet Muhammad ﷺ');
  const [card4Body, setCard4Body] = useState(
    'Centering all artistic and literary performances around the love and praise of Holy Prophet Muhammad ﷺ, spreading peace and divine light.'
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'cms' | 'preview'>('cms');

  useEffect(() => {
    fetch('/api/about')
      .then((r) => r.json())
      .then((d) => {
        if (d.about) {
          const a = d.about;
          if (a.header) {
            if (a.header.title) setMainHeading(a.header.title);
            if (a.header.body) setHeaderDesc(a.header.body);
            if (a.header.extraJson?.tagline) setTagline(a.header.extraJson.tagline);
          }

          if (a.stats && a.stats.extraJson) {
            const st = a.stats.extraJson;
            if (st.stat1Val) setStat1Val(st.stat1Val);
            if (st.stat1Label) setStat1Label(st.stat1Label);
            if (st.stat2Val) setStat2Val(st.stat2Val);
            if (st.stat2Label) setStat2Label(st.stat2Label);
            if (st.stat3Val) setStat3Val(st.stat3Val);
            if (st.stat3Label) setStat3Label(st.stat3Label);
            if (st.stat4Val) setStat4Val(st.stat4Val);
            if (st.stat4Label) setStat4Label(st.stat4Label);
            if (st.stat5Val) setStat5Val(st.stat5Val);
            if (st.stat5Label) setStat5Label(st.stat5Label);
          }

          if (a.card1) {
            if (a.card1.title) setCard1Title(a.card1.title);
            if (a.card1.body) setCard1Body(a.card1.body);
            if (a.card1.extraJson?.badge) setCard1Badge(a.card1.extraJson.badge);
          }

          if (a.card2) {
            if (a.card2.title) setCard2Title(a.card2.title);
            if (a.card2.body) setCard2Body(a.card2.body);
            if (a.card2.extraJson?.badge) setCard2Badge(a.card2.extraJson.badge);
          }

          if (a.card3) {
            if (a.card3.title) setCard3Title(a.card3.title);
            if (a.card3.body) setCard3Body(a.card3.body);
            if (a.card3.extraJson?.badge) setCard3Badge(a.card3.extraJson.badge);
          }

          if (a.card4) {
            if (a.card4.title) setCard4Title(a.card4.title);
            if (a.card4.body) setCard4Body(a.card4.body);
            if (a.card4.extraJson?.badge) setCard4Badge(a.card4.extraJson.badge);
          }
        }
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      // Save Header
      await fetch('/api/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: 'header',
          title: mainHeading,
          body: headerDesc,
          extraJson: { tagline },
        }),
      });

      // Save Stats
      await fetch('/api/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: 'stats',
          title: 'Stats Counter',
          body: '',
          extraJson: {
            stat1Val, stat1Label,
            stat2Val, stat2Label,
            stat3Val, stat3Label,
            stat4Val, stat4Label,
            stat5Val, stat5Label,
          },
        }),
      });

      // Save Card 1
      await fetch('/api/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: 'card1',
          title: card1Title,
          body: card1Body,
          extraJson: { badge: card1Badge },
        }),
      });

      // Save Card 2
      await fetch('/api/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: 'card2',
          title: card2Title,
          body: card2Body,
          extraJson: { badge: card2Badge },
        }),
      });

      // Save Card 3
      await fetch('/api/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: 'card3',
          title: card3Title,
          body: card3Body,
          extraJson: { badge: card3Badge },
        }),
      });

      // Save Card 4
      await fetch('/api/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: 'card4',
          title: card4Title,
          body: card4Body,
          extraJson: { badge: card4Badge },
        }),
      });

      setMessage('About Page CMS Content published live!');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-white">About Page Content CMS</h1>
          <p className="text-xs text-slate-400">Edit About Us page header, 5 stat counter cards, and 4 core info sections with live preview.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('cms')}
            className={`btn-pill-luxury text-xs px-4 py-2 font-bold flex items-center space-x-1.5 ${
              activeTab === 'cms'
                ? 'bg-[#C8A86B] text-[#0B0B0B]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>CMS Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`btn-pill-luxury text-xs px-4 py-2 font-bold flex items-center space-x-1.5 ${
              activeTab === 'preview'
                ? 'bg-[#C8A86B] text-[#0B0B0B]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Live Side-by-Side Preview</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {/* CMS FORM VS SIDE-BY-SIDE PREVIEW */}
      <div className={`grid gap-6 ${activeTab === 'preview' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* EDITOR FORM */}
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* 1. HEADER SECTION CMS */}
          <div className="luxury-glass p-6 rounded-[28px] border border-[#C8A86B]/30 space-y-4">
            <h2 className="text-base font-bold font-serif text-[#C8A86B] flex items-center space-x-2 border-b border-white/10 pb-3">
              <Sparkles className="w-4 h-4 text-[#C8A86B]" />
              <span>1. About Page Header CMS</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tagline Eyebrow</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Main Heading</label>
                <input
                  type="text"
                  value={mainHeading}
                  onChange={(e) => setMainHeading(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none font-bold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">Header Description Paragraph</label>
                <textarea
                  rows={3}
                  value={headerDesc}
                  onChange={(e) => setHeaderDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 2. STATS CARDS CMS (5 STAT CARDS) */}
          <div className="luxury-glass p-6 rounded-[28px] border border-[#C8A86B]/30 space-y-4">
            <h2 className="text-base font-bold font-serif text-[#C8A86B] flex items-center space-x-2 border-b border-white/10 pb-3">
              <Award className="w-4 h-4 text-[#C8A86B]" />
              <span>2. 5 Stat Counter Cards CMS</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              {/* Stat 1 */}
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                <span className="font-bold text-[#C8A86B]">Stat 1</span>
                <input
                  type="text"
                  value={stat1Val}
                  onChange={(e) => setStat1Val(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white font-bold"
                />
                <input
                  type="text"
                  value={stat1Label}
                  onChange={(e) => setStat1Label(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-300 text-[10px]"
                />
              </div>

              {/* Stat 2 */}
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                <span className="font-bold text-[#C8A86B]">Stat 2</span>
                <input
                  type="text"
                  value={stat2Val}
                  onChange={(e) => setStat2Val(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white font-bold"
                />
                <input
                  type="text"
                  value={stat2Label}
                  onChange={(e) => setStat2Label(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-300 text-[10px]"
                />
              </div>

              {/* Stat 3 */}
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                <span className="font-bold text-[#C8A86B]">Stat 3</span>
                <input
                  type="text"
                  value={stat3Val}
                  onChange={(e) => setStat3Val(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white font-bold"
                />
                <input
                  type="text"
                  value={stat3Label}
                  onChange={(e) => setStat3Label(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-300 text-[10px]"
                />
              </div>

              {/* Stat 4 */}
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                <span className="font-bold text-[#C8A86B]">Stat 4</span>
                <input
                  type="text"
                  value={stat4Val}
                  onChange={(e) => setStat4Val(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white font-bold"
                />
                <input
                  type="text"
                  value={stat4Label}
                  onChange={(e) => setStat4Label(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-300 text-[10px]"
                />
              </div>

              {/* Stat 5 */}
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                <span className="font-bold text-[#C8A86B]">Stat 5</span>
                <input
                  type="text"
                  value={stat5Val}
                  onChange={(e) => setStat5Val(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white font-bold"
                />
                <input
                  type="text"
                  value={stat5Label}
                  onChange={(e) => setStat5Label(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-300 text-[10px]"
                />
              </div>
            </div>
          </div>

          {/* 3. 4 CORE INFO CARDS CMS */}
          <div className="luxury-glass p-6 rounded-[28px] border border-[#C8A86B]/30 space-y-6">
            <h2 className="text-base font-bold font-serif text-[#C8A86B] flex items-center space-x-2 border-b border-white/10 pb-3">
              <Globe className="w-4 h-4 text-[#C8A86B]" />
              <span>3. 4 Core Info Cards CMS (Heritage, Vision, Mission, Mahabba)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Card 1 */}
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#C8A86B]">Card 1: Heritage</span>
                  <input
                    type="text"
                    value={card1Badge}
                    onChange={(e) => setCard1Badge(e.target.value)}
                    className="px-2 py-0.5 bg-slate-950 border border-slate-700 rounded text-[10px] text-[#C8A86B] font-mono font-bold"
                  />
                </div>
                <input
                  type="text"
                  value={card1Title}
                  onChange={(e) => setCard1Title(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                />
                <textarea
                  rows={3}
                  value={card1Body}
                  onChange={(e) => setCard1Body(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-300"
                />
              </div>

              {/* Card 2 */}
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#C8A86B]">Card 2: Vision</span>
                  <input
                    type="text"
                    value={card2Badge}
                    onChange={(e) => setCard2Badge(e.target.value)}
                    className="px-2 py-0.5 bg-slate-950 border border-slate-700 rounded text-[10px] text-[#C8A86B] font-mono font-bold"
                  />
                </div>
                <input
                  type="text"
                  value={card2Title}
                  onChange={(e) => setCard2Title(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                />
                <textarea
                  rows={3}
                  value={card2Body}
                  onChange={(e) => setCard2Body(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-300"
                />
              </div>

              {/* Card 3 */}
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#C8A86B]">Card 3: Mission</span>
                  <input
                    type="text"
                    value={card3Badge}
                    onChange={(e) => setCard3Badge(e.target.value)}
                    className="px-2 py-0.5 bg-slate-950 border border-slate-700 rounded text-[10px] text-[#C8A86B] font-mono font-bold"
                  />
                </div>
                <input
                  type="text"
                  value={card3Title}
                  onChange={(e) => setCard3Title(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                />
                <textarea
                  rows={3}
                  value={card3Body}
                  onChange={(e) => setCard3Body(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-300"
                />
              </div>

              {/* Card 4 */}
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#C8A86B]">Card 4: Mahabba & Sunnah</span>
                  <input
                    type="text"
                    value={card4Badge}
                    onChange={(e) => setCard4Badge(e.target.value)}
                    className="px-2 py-0.5 bg-slate-950 border border-slate-700 rounded text-[10px] text-[#C8A86B] font-mono font-bold"
                  />
                </div>
                <input
                  type="text"
                  value={card4Title}
                  onChange={(e) => setCard4Title(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                />
                <textarea
                  rows={3}
                  value={card4Body}
                  onChange={(e) => setCard4Body(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-300"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-pill-luxury bg-[#C8A86B] text-[#0B0B0B] font-bold text-sm w-full py-4 flex items-center justify-center space-x-2 shadow-luxury"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Publishing About Content...' : 'Publish About Page CMS Content Live'}</span>
          </button>
        </form>

        {/* LIVE SIDE-BY-SIDE PREVIEW PANE */}
        {activeTab === 'preview' && (
          <div className="space-y-6 sticky top-28">
            <div className="luxury-glass p-6 rounded-[32px] border border-[#C8A86B]/40 space-y-6 bg-black/60 backdrop-blur-xl">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-mono font-bold text-[#C8A86B] flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>LIVE ABOUT PAGE PREVIEW PANE</span>
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full">
                  INSTANT PREVIEW
                </span>
              </div>

              {/* Header Preview */}
              <div className="space-y-3 p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="text-[10px] font-mono font-bold text-[#C8A86B] tracking-wider">
                  {tagline}
                </span>

                <h1 className="text-2xl font-serif font-black text-white">
                  {mainHeading}
                </h1>

                <p className="text-xs text-neutral-300 max-w-sm mx-auto">
                  {headerDesc}
                </p>
              </div>

              {/* Stats Preview */}
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-bold text-[#C8A86B]">{stat1Val}</div>
                  <div className="text-[9px] text-neutral-400">{stat1Label}</div>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-bold text-white">{stat2Val}</div>
                  <div className="text-[9px] text-neutral-400">{stat2Label}</div>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-bold text-[#C8A86B]">{stat3Val}</div>
                  <div className="text-[9px] text-neutral-400">{stat3Label}</div>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-bold text-white">{stat4Val}</div>
                  <div className="text-[9px] text-neutral-400">{stat4Label}</div>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-bold text-[#C8A86B]">{stat5Val}</div>
                  <div className="text-[9px] text-neutral-400">{stat5Label}</div>
                </div>
              </div>

              {/* Info Cards Preview */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[9px] font-mono text-[#C8A86B] font-bold">{card1Badge}</span>
                  <h4 className="font-bold text-white">{card1Title}</h4>
                  <p className="text-[10px] text-neutral-400 line-clamp-2">{card1Body}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[9px] font-mono text-[#C8A86B] font-bold">{card4Badge}</span>
                  <h4 className="font-bold text-white">{card4Title}</h4>
                  <p className="text-[10px] text-neutral-400 line-clamp-2">{card4Body}</p>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
