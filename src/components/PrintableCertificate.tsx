'use client';

import React, { useRef, useState, useEffect } from 'react';
import { exportElementAsImage } from '@/lib/exportUtils';
import { Download, Printer } from 'lucide-react';

import { useLogo } from '@/lib/useLogo';

interface CertificateProps {
  result: {
    id: string;
    position: string;
    points: number;
    createdAt?: string;
    programme: {
      name: string;
      category: string;
      stage: string;
    };
    participant: {
      fullName: string;
      chestNumber: string;
      registrationId: string;
      group: string;
      madrasa?: string;
    };
  };
  coordinatorSettings?: {
    coord1Name?: string;
    coord1Designation?: string;
    coord2Name?: string;
    coord2Designation?: string;
  };
}

export default function PrintableCertificate({ result, coordinatorSettings }: CertificateProps) {
  const { logoUrl, logoLightUrl } = useLogo();
  const certRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [downloading, setDownloading] = useState(false);

  // Dynamic responsive scaling calculation for preview modal (A5 Landscape: 1050px × 740px)
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.clientWidth;
        // Native A5 landscape canvas width is 1050px
        if (availableWidth > 0 && availableWidth < 1050) {
          setScale(availableWidth / 1050);
        } else {
          setScale(1);
        }
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const isParticipation =
    !result.position ||
    result.position.toLowerCase().includes('particip') ||
    result.position.toLowerCase().includes('delegate');

  const certDate = result.createdAt
    ? new Date(result.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const coord1Name = coordinatorSettings?.coord1Name || '';
  const coord1Desig = coordinatorSettings?.coord1Designation || '';
  const coord2Name = coordinatorSettings?.coord2Name || '';
  const coord2Desig = coordinatorSettings?.coord2Designation || '';

  // Format position for badge
  const positionLabel = isParticipation ? 'PARTICIPANT' : result.position.toUpperCase();

  const handleDownloadJPEG = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const filename = `Certificate_${result.participant.chestNumber}_${result.programme.name.replace(/\s+/g, '_')}.jpg`;
      
      await exportElementAsImage({
        element: certRef.current,
        className: 'hk-certificate',
        width: 1050,
        height: 740,
        scale: 2,
        backgroundColor: '#F8F5EE',
        filename,
      });
    } catch (error) {
      console.error('Certificate JPEG generation error:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col items-center space-y-5 font-sans">

      {/* ── RESPONSIVE SCALED PREVIEW CANVAS CONTAINER (A5 LANDSCAPE 210mm × 148mm) ── */}
      <div
        ref={containerRef}
        className="w-full flex items-center justify-center overflow-hidden py-1"
        style={{
          minHeight: `${740 * scale}px`,
        }}
      >
        <div
          style={{
            width: '1050px',
            height: '740px',
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            marginBottom: scale < 1 ? `-${740 * (1 - scale)}px` : 0,
          }}
          className="shrink-0 transition-transform duration-200"
        >
          {/* ── NATIVE A5 LANDSCAPE CERTIFICATE CANVAS (210mm × 148mm / 1050px × 740px) ── */}
          <div
            ref={certRef}
            style={{
              width: '1050px',
              height: '740px',
              backgroundColor: '#F8F5EE',
              position: 'relative',
              overflow: 'hidden',
              fontFamily: "'Montserrat', sans-serif",
              color: '#2E4F4F',
            }}
            className="shadow-2xl rounded-sm hk-certificate border border-[#2E4F4F]/20"
          >
            {/* ── BACKGROUND SUBTLE GEOMETRIC PATTERN ── */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `radial-gradient(#2E4F4F 0.5px, transparent 0.5px), radial-gradient(#C9A227 0.5px, #F8F5EE 0.5px)`,
                backgroundSize: '24px 24px',
                backgroundPosition: '0 0, 12px 12px',
                opacity: 0.04,
                pointerEvents: 'none',
              }}
            />

            {/* ── SUBTLE AMBIENT FEST LOGO WATERMARK ── */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '52%',
                transform: 'translate(-50%, -50%)',
                width: '380px',
                height: '380px',
                opacity: 0.08,
                filter: 'blur(1px)',
                pointerEvents: 'none',
                userSelect: 'none',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {logoLightUrl || logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoLightUrl || logoUrl}
                  alt="Certificate Watermark"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ fontSize: '200px', color: '#1F3A3A', fontFamily: 'serif' }}>ﷺ</div>
              )}
            </div>

            {/* ── VECTOR SVG FACETED LEFT TEAL-GREEN RIBBON BAND & GOLD ACCENT ── */}
            <div className="absolute top-0 left-0 bottom-0 pointer-events-none z-[2]">
              <svg width="140" height="740" viewBox="0 0 140 740" fill="none">
                <defs>
                  <linearGradient id="tealRibbonGrad" x1="0" y1="0" x2="0" y2="100%">
                    <stop offset="0%" stopColor="#1F3A3A" />
                    <stop offset="60%" stopColor="#2E4F4F" />
                    <stop offset="100%" stopColor="#1A2E2E" />
                  </linearGradient>
                  <linearGradient id="goldStripeGrad" x1="0" y1="0" x2="0" y2="100%">
                    <stop offset="0%" stopColor="#D4AF37" />
                    <stop offset="50%" stopColor="#C9A227" />
                    <stop offset="100%" stopColor="#9E741D" />
                  </linearGradient>
                </defs>
                {/* Teal Ribbon Body */}
                <polygon points="0,0 130,0 102,740 0,740" fill="url(#tealRibbonGrad)" />
                {/* Gold Accent Line */}
                <polygon points="115,0 122,0 94,740 87,740" fill="url(#goldStripeGrad)" />
              </svg>
            </div>

            {/* ── TOP-LEFT COMPACT SEAL BADGE ── */}
            <div
              style={{
                position: 'absolute',
                top: '38px',
                left: '48px',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #D4AF37 0%, #C9A227 50%, #1F3A3A 100%)',
                  padding: '3px',
                  boxShadow: '0 6px 20px rgba(31, 58, 58, 0.3)',
                  overflow: 'hidden',
                }}
                className="flex items-center justify-center relative"
              >
                <div className="w-full h-full rounded-full bg-[#F8F5EE] border-2 border-[#D4AF37] flex flex-col items-center justify-center text-center p-1 overflow-hidden space-y-0.5">
                  <div className="text-[#C9A227] font-serif font-bold text-xs leading-none">
                    ﷺ
                  </div>
                  <span className="text-[8.5px] font-black text-[#1F3A3A] font-mono leading-none">
                    2026
                  </span>
                  <span className="text-[8px] font-black text-[#9E741D] uppercase tracking-tight leading-tight px-1">
                    {positionLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* ── MAIN CONTENT AREA (EXPLICIT PIXEL TYPOGRAPHY TO PREVENT JPEG COLLAPSE) ── */}
            <div
              style={{
                position: 'relative',
                zIndex: 5,
                height: '100%',
                padding: '38px 52px 38px 170px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >

              {/* 1. EDITORIAL HEADER ROW */}
              <div className="flex items-start justify-between">
                {/* Left Stacked Eyebrow + Elegant Serif Heading + Italic Subtitle */}
                <div>
                  <div
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: '10px',
                      lineHeight: '14px',
                      fontWeight: 700,
                      letterSpacing: '2.5px',
                      color: '#C9A227',
                      textTransform: 'uppercase',
                      marginBottom: '4px',
                    }}
                  >
                    HUSNUL KAMAL MEELAD FEST 2026
                  </div>
                  <h1
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: '48px',
                      lineHeight: '50px',
                      fontWeight: 800,
                      letterSpacing: '-0.5px',
                      color: '#1F3A3A',
                      textTransform: 'uppercase',
                      margin: 0,
                    }}
                  >
                    CERTIFICATE
                  </h1>
                  <div
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: '20px',
                      lineHeight: '24px',
                      fontStyle: 'italic',
                      fontWeight: 700,
                      color: '#C9A227',
                      marginTop: '4px',
                    }}
                  >
                    {isParticipation ? 'of Participation' : 'of Achievement'}
                  </div>
                </div>

                {/* Right Header — Madrasa Name & Calligraphy Emblem */}
                <div className="flex items-center space-x-3 text-right shrink-0 pt-0.5">
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        lineHeight: '15px',
                        fontWeight: 700,
                        color: '#1F3A3A',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Mifthahul Uloom Madrasa
                    </div>
                    <div
                      style={{
                        fontFamily: "'Montserrat', monospace",
                        fontSize: '9px',
                        lineHeight: '13px',
                        fontWeight: 700,
                        color: '#C9A227',
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Ullisherikkunnu Campus
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#1F3A3A] text-[#F8F5EE] flex items-center justify-center font-serif text-sm font-bold shadow-sm shrink-0">
                    ﷺ
                  </div>
                </div>
              </div>

              {/* 2. MIDDLE CONTENT BLOCK (EXPLICIT PIXEL LINE-HEIGHTS) */}
              <div className="space-y-3 my-auto pt-1">

                {/* PRESENTED-TO ROUNDED-PILL BANNER */}
                <div
                  style={{
                    display: 'inline-block',
                    background: '#1F3A3A',
                    color: '#F8F5EE',
                    padding: '7px 22px',
                    borderRadius: '50px',
                    fontSize: '10px',
                    lineHeight: '14px',
                    fontWeight: 700,
                    letterSpacing: '2.5px',
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 10px rgba(31, 58, 58, 0.12)',
                  }}
                >
                  THIS CERTIFICATE IS PROUDLY PRESENTED TO
                </div>

                {/* RECIPIENT NAME (ALEX BRUSH SCRIPT FOCAL POINT) */}
                <div style={{ paddingTop: '2px', paddingBottom: '2px' }}>
                  <h2
                    style={{
                      fontFamily: "'Alex Brush', 'Georgia', cursive, serif",
                      fontSize: '52px',
                      lineHeight: '58px',
                      color: '#1F3A3A',
                      fontWeight: 400,
                      margin: 0,
                    }}
                  >
                    {result.participant.fullName}
                  </h2>
                </div>

                {/* METRICS & RECIPIENT DETAILS SUB-LINE */}
                <div
                  style={{
                    fontSize: '11px',
                    lineHeight: '16px',
                    fontFamily: "'Montserrat', monospace",
                    color: '#555555',
                    fontWeight: 600,
                  }}
                  className="space-x-2"
                >
                  <span>Chest No. <strong className="text-[#1F3A3A] text-xs">{result.participant.chestNumber}</strong></span>
                  <span>•</span>
                  <span>{result.participant.madrasa || 'Mifthahul Uloom Campus'}</span>
                  <span>•</span>
                  <span>Category: <strong className="text-[#1F3A3A]">{result.programme.category}</strong></span>
                  <span>•</span>
                  <span>House: <strong className="text-[#C9A227]">{result.participant.group}</strong></span>
                </div>

                {/* CITATION PARAGRAPH */}
                <p
                  style={{
                    fontSize: '11px',
                    lineHeight: '18px',
                    color: '#555555',
                    maxWidth: '580px',
                    fontFamily: "'Montserrat', sans-serif",
                    margin: 0,
                    paddingTop: '2px',
                  }}
                >
                  For outstanding <strong style={{ color: '#1F3A3A' }}>{isParticipation ? 'participation' : `${result.position} (${result.points} Points)`}</strong> in the programme <strong style={{ color: '#1F3A3A', textTransform: 'uppercase' }}>{result.programme.name}</strong> under <strong style={{ color: '#1F3A3A' }}>{result.programme.category}</strong> category, held as part of the Grand Husnul Kamal Meelad Fest 2026.
                </p>
              </div>

              {/* 3. FOOTER ROW (EXPLICIT SPACING & ALIGNMENT) */}
              <div
                style={{
                  paddingTop: '20px',
                  borderTop: '1px solid rgba(46, 79, 79, 0.2)',
                }}
                className="flex items-end justify-between"
              >
                
                {/* LEFT: FEST COORDINATOR */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div
                    style={{
                      width: '140px',
                      borderBottom: '1px solid #1F3A3A',
                      marginBottom: '4px',
                      marginTop: '16px',
                    }}
                  />
                  <div style={{ fontSize: '10px', lineHeight: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#1F3A3A' }}>
                    FEST COORDINATOR
                  </div>
                </div>

                {/* CENTER: DATE & VERIFICATION ID */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textAlign: 'center', paddingBottom: '2px' }}>
                  <div>
                    <div style={{ fontSize: '11px', lineHeight: '15px', fontFamily: 'monospace', fontWeight: 700, color: '#1F3A3A' }}>{certDate}</div>
                    <div style={{ fontSize: '8.5px', lineHeight: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6B6B6B' }}>ISSUE DATE</div>
                  </div>
                  <div style={{ paddingTop: '2px' }}>
                    <div style={{ fontSize: '11px', lineHeight: '15px', fontFamily: 'monospace', fontWeight: 700, color: '#C9A227' }}>HK-2026-CERT-{result.participant.chestNumber}</div>
                    <div style={{ fontSize: '8.5px', lineHeight: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6B6B6B' }}>VERIFICATION ID</div>
                  </div>
                </div>

                {/* RIGHT: SADAR MUALLIM */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div
                    style={{
                      width: '140px',
                      borderBottom: '1px solid #1F3A3A',
                      marginBottom: '4px',
                      marginTop: '16px',
                    }}
                  />
                  <div style={{ fontSize: '10px', lineHeight: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#1F3A3A' }}>
                    SADAR MUALLIM
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── ACTION BUTTONS (Hidden during print) ── */}
      <div className="flex items-center space-x-3 no-print pt-1">
        <button
          onClick={handleDownloadJPEG}
          disabled={downloading}
          className="btn-pill-luxury bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] text-xs px-6 py-3 font-bold shadow-lg hover:bg-[#9E741D] flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Generating High-Res A5 Image...' : 'Download Certificate (A5 JPEG)'}</span>
        </button>

        <button
          onClick={handlePrint}
          className="btn-pill-luxury bg-[#F5E6C4] text-[#7A5600] border border-[#E5C578] dark:bg-white/10 dark:text-white dark:border-white/20 text-xs px-6 py-3 font-bold shadow-lg flex items-center space-x-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as A5 PDF</span>
        </button>
      </div>

    </div>
  );
}
