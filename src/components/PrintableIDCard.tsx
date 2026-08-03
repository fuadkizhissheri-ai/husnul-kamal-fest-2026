'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { Download, ShieldCheck, User, MapPin, Phone } from 'lucide-react';
import { exportElementAsImage } from '@/lib/exportUtils';
import { useLogo } from '@/lib/useLogo';

interface PrintableIDCardProps {
  initialSide?: 'front' | 'back';
  participant: {
    registrationId: string;
    chestNumber: string;
    fullName: string;
    group: string;
    category: string;
    gender: string;
    whatsapp: string;
    madrasa?: string;
    photoUrl?: string | null;
    programmes?: Array<{ name: string; category?: string }> | string[];
    registrations?: Array<{ programme: { name: string } }>;
  };
}

const GROUP_CONFIG = {
  MAVADDA: {
    accentColor: '#C8A86B',
    accentDark: '#8B6914',
    bgGradient: 'linear-gradient(135deg, #1A1200 0%, #2D1F00 50%, #1A1200 100%)',
    bandGradient: 'linear-gradient(90deg, #C8A86B 0%, #E0C98A 50%, #B8943A 100%)',
    badgeBg: 'rgba(200,168,107,0.2)',
    badgeBorder: 'rgba(200,168,107,0.5)',
    badgeText: '#C8A86B',
    label: 'MAVADDA',
  },
  MAHABBA: {
    accentColor: '#10B981',
    accentDark: '#065F46',
    bgGradient: 'linear-gradient(135deg, #001A0F 0%, #002D1A 50%, #001A0F 100%)',
    bandGradient: 'linear-gradient(90deg, #10B981 0%, #34D399 50%, #065F46 100%)',
    badgeBg: 'rgba(16,185,129,0.2)',
    badgeBorder: 'rgba(16,185,129,0.5)',
    badgeText: '#10B981',
    label: 'MAHABBA',
  },
};

export default function PrintableIDCard({ participant, initialSide }: PrintableIDCardProps) {
  const { logoUrl } = useLogo();
  const cardRef = useRef<HTMLDivElement>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const [showBack, setShowBack] = useState(initialSide === 'back');

  const grp = GROUP_CONFIG[participant.group as keyof typeof GROUP_CONFIG] || GROUP_CONFIG.MAVADDA;

  // Dynamically extract registered programme names
  const programmeList = useMemo<string[]>(() => {
    if (participant.programmes) {
      return participant.programmes.map((p) => (typeof p === 'string' ? p : p.name));
    }
    if (participant.registrations) {
      return participant.registrations.map((r) => r.programme.name);
    }
    return [];
  }, [participant]);

  // Dynamic font sizing for name length safety
  const nameLength = participant.fullName.length;
  const nameFontSize = nameLength > 24 ? '13px' : nameLength > 18 ? '14.5px' : '16px';

  useEffect(() => {
    const verifyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?verify=${participant.registrationId}`;
    QRCode.toDataURL(verifyUrl, {
      margin: 1, width: 200,
      color: { dark: '#0B0B0B', light: '#FFFFFF' },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR error:', err));
  }, [participant]);

  const handleDownloadJPEG = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const sideName = showBack ? 'back' : 'front';
      const downloadUrl = `/api/id-card/download?id=${encodeURIComponent(participant.registrationId || participant.chestNumber)}&side=${sideName}`;

      const res = await fetch(downloadUrl);
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `ID-CARD_${sideName.toUpperCase()}_${participant.chestNumber}_${participant.fullName.replace(/\s+/g, '_')}.jpg`;
        link.click();
        URL.revokeObjectURL(blobUrl);
        return;
      }

      // Fallback to client-side pixel-accurate renderer
      const filename = `ID-CARD_${sideName.toUpperCase()}_${participant.chestNumber}_${participant.fullName.replace(/\s+/g, '_')}.jpg`;
      await exportElementAsImage({
        element: cardRef.current,
        className: 'hk-idcard-canvas',
        width: 340,
        height: 560,
        scale: 4,
        filename,
      });
    } catch (error) {
      console.error('ID Card export error:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">

      {/* Toggle Front/Back */}
      <div className="flex items-center space-x-2 text-xs">
        <button
          onClick={() => setShowBack(false)}
          className={`px-4 py-1.5 rounded-full font-bold transition-all ${!showBack ? 'bg-[#C8A86B] text-[#0B0B0B]' : 'bg-white/10 text-white'}`}
        >
          Front Side
        </button>
        <button
          onClick={() => setShowBack(true)}
          className={`px-4 py-1.5 rounded-full font-bold transition-all ${showBack ? 'bg-[#C8A86B] text-[#0B0B0B]' : 'bg-white/10 text-white'}`}
        >
          Back Side
        </button>
      </div>

      {/* ── ID Card Canvas (Credit Card 340×560 Portrait) ── */}
      <div
        ref={cardRef}
        className="hk-idcard-canvas"
        style={{
          width: '340px',
          height: '560px',
          background: grp.bgGradient,
          borderRadius: '20px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          border: `1px solid ${grp.accentColor}40`,
        }}
      >
        {!showBack ? (
          /* ===== FRONT SIDE ===== */
          <>
            {/* ── Group Color Accent Band (top) ── */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: '6px',
              background: grp.bandGradient,
            }} />

            {/* ── Lanyard Hole Guide ── */}
            <div style={{
              position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)',
              width: '14px', height: '14px',
              borderRadius: '50%',
              border: `2px solid ${grp.accentColor}80`,
              background: 'rgba(0,0,0,0.5)',
            }} />

            {/* ── SUBTLE AMBIENT FEST LOGO WATERMARK ── */}
            <div style={{
              position: 'absolute', top: '54%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '230px',
              height: '230px',
              opacity: 0.08,
              filter: 'blur(1.5px)',
              pointerEvents: 'none',
              userSelect: 'none',
              zIndex: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Watermark"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ fontSize: '150px', color: grp.accentColor, fontFamily: 'serif' }}>ﷺ</div>
              )}
            </div>

            {/* ── Content ── */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '28px 20px 16px 20px',
              gap: '0',
            }}>

              {/* Header (No Calligraphy Icon, Centered & Fully Uppercase) */}
              <div style={{ textAlign: 'center', marginBottom: '8px', marginTop: '8px' }}>
                <div style={{ fontSize: '9px', letterSpacing: '4px', color: grp.accentColor, textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', fontWeight: '700' }}>
                  OFFICIAL DELEGATE PASS
                </div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: 'white', fontFamily: 'sans-serif', lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  HUSNUL KAMAL 2026
                </div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                  MEELAD FEST 2026 · MIFTHAHUL ULOOM
                </div>
              </div>

              {/* ── Photo Frame ── */}
              <div style={{
                width: '84px', height: '84px',
                borderRadius: '50%',
                border: `3px solid ${grp.accentColor}`,
                background: 'rgba(0,0,0,0.4)',
                overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 24px ${grp.accentColor}30`,
                flexShrink: 0,
              }}>
                {participant.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={participant.photoUrl} alt={participant.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: `${grp.accentColor}80`, textAlign: 'center' }}>
                    <User size={32} />
                  </div>
                )}
              </div>

              {/* ── CHEST NUMBER ── */}
              <div style={{
                marginTop: '8px',
                background: grp.bandGradient,
                borderRadius: '8px',
                padding: '4px 24px',
                display: 'inline-block',
              }}>
                <div style={{ fontSize: '28px', fontWeight: '900', color: '#0B0B0B', letterSpacing: '-1px', textAlign: 'center', lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>
                  {participant.chestNumber}
                </div>
                <div style={{ fontSize: '7.5px', letterSpacing: '3px', color: 'rgba(0,0,0,0.6)', textTransform: 'uppercase', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontWeight: '700' }}>
                  CHEST NO
                </div>
              </div>

              {/* ── Name (UPPERCASE with dynamic font size) ── */}
              <div style={{ textAlign: 'center', marginTop: '6px', maxWidth: '100%' }}>
                <div style={{ fontSize: nameFontSize, fontWeight: '800', color: 'white', lineHeight: 1.2, fontFamily: 'sans-serif', letterSpacing: '-0.3px', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {participant.fullName}
                </div>
              </div>

              {/* ── Details Rows (UPPERCASE) ── */}
              <div style={{ width: '100%', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>

                {/* Group */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter, sans-serif', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>GROUP</span>
                  <span style={{
                    fontSize: '9.5px', fontWeight: '800',
                    background: grp.badgeBg,
                    border: `1px solid ${grp.badgeBorder}`,
                    color: grp.badgeText,
                    padding: '2px 10px', borderRadius: '9999px',
                    fontFamily: 'Inter, sans-serif',
                    textTransform: 'uppercase',
                  }}>
                    {grp.label}
                  </span>
                </div>

                {/* Category */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter, sans-serif', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>CATEGORY</span>
                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: 'white', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase' }}>{participant.category}</span>
                </div>

                {/* Madrasa */}
                {participant.madrasa && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter, sans-serif', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>MADRASA</span>
                    <span style={{ fontSize: '9.5px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', fontFamily: 'Inter, sans-serif', textAlign: 'right', maxWidth: '160px', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{participant.madrasa}</span>
                  </div>
                )}

              </div>

              {/* ── REGISTERED PROGRAMMES SECTION (UPPERCASE) ── */}
              {programmeList.length > 0 && (
                <div style={{ width: '100%', marginTop: '8px', flexShrink: 0 }}>
                  <div style={{
                    fontSize: '8px',
                    fontWeight: '700',
                    letterSpacing: '1.5px',
                    color: grp.accentColor,
                    textTransform: 'uppercase',
                    fontFamily: 'Inter, sans-serif',
                    marginBottom: '4px',
                  }}>
                    REGISTERED PROGRAMMES ({programmeList.length})
                  </div>

                  {programmeList.length <= 3 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '52px', overflow: 'hidden' }}>
                      {programmeList.map((prog, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '9px',
                            fontWeight: '600',
                            background: 'rgba(255,255,255,0.08)',
                            border: `1px solid ${grp.accentColor}35`,
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontFamily: 'Inter, sans-serif',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            maxWidth: '100%',
                            textTransform: 'uppercase',
                          }}
                        >
                          {prog}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', maxHeight: '56px', overflow: 'hidden' }}>
                      {programmeList.slice(0, 4).map((prog, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '8.5px',
                            fontWeight: '600',
                            background: 'rgba(255,255,255,0.08)',
                            border: `1px solid ${grp.accentColor}35`,
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontFamily: 'Inter, sans-serif',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            display: 'block',
                            textTransform: 'uppercase',
                          }}
                          title={prog}
                        >
                          • {prog}
                        </span>
                      ))}
                      {programmeList.length > 4 && (
                        <span style={{ fontSize: '8px', color: grp.accentColor, fontWeight: '700', gridColumn: 'span 2', textAlign: 'center', paddingTop: '1px', textTransform: 'uppercase' }}>
                          +{programmeList.length - 4} MORE EVENTS
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Footer: Verified badge + QR ── */}
              <div style={{
                width: '100%', marginTop: 'auto',
                paddingTop: '8px',
                borderTop: `1px solid ${grp.accentColor}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: grp.accentColor }}>
                    <ShieldCheck size={12} />
                    <span style={{ fontSize: '9px', fontWeight: '700', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '1px' }}>VERIFIED</span>
                  </div>
                  <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif', marginTop: '2px', textTransform: 'uppercase' }}>
                    ID: {participant.registrationId}
                  </div>
                </div>

                {qrCodeDataUrl && (
                  <div style={{ background: 'white', padding: '3px', borderRadius: '6px', border: `1px solid ${grp.accentColor}40` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCodeDataUrl} alt="QR" style={{ width: '40px', height: '40px', display: 'block' }} />
                  </div>
                )}
              </div>

            </div>
          </>
        ) : (
          /* ===== BACK SIDE ===== */
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            padding: '20px',
            color: 'white',
            fontFamily: 'Inter, sans-serif',
          }}>
            {/* Back header (UPPERCASE) */}
            <div style={{ borderBottom: `1px solid ${grp.accentColor}30`, paddingBottom: '12px', marginBottom: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: grp.accentColor, letterSpacing: '4px', textTransform: 'uppercase' }}>
                HUSNUL KAMAL MEELAD FEST 2026
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', marginTop: '2px', textTransform: 'uppercase' }}>MIFTHAHUL ULOOM MADRASA, ULLISHERIKKUNNU</div>
            </div>

            {/* Rules (UPPERCASE) */}
            <div style={{ flex: 1, fontSize: '9px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, textTransform: 'uppercase' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: grp.accentColor, marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>DELEGATE INSTRUCTIONS</div>
              <p>• THIS CARD MUST BE WORN VISIBLY DURING THE ENTIRE FEST.</p>
              <p>• PRESENT THIS CARD AT EACH PROGRAMME VENUE FOR ENTRY.</p>
              <p>• LOST CARDS MUST BE REPORTED TO THE REGISTRATION DESK IMMEDIATELY.</p>
              <p>• DELEGATES ARE BOUND BY THE FEST CODE OF CONDUCT AT ALL TIMES.</p>
              <p>• PHOTOGRAPHY/VIDEO DURING JUDGED ITEMS IS NOT PERMITTED.</p>
            </div>

            {/* Coordinator Contact (UPPERCASE) */}
            <div style={{ borderTop: `1px solid ${grp.accentColor}30`, paddingTop: '12px', marginTop: '12px' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', color: grp.accentColor, marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>COORDINATOR CONTACT</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '9px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={10} />
                  <span>CONTROL DESK: +91 73064 80848</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={10} />
                  <span>MIDLAJ ROSHAN KAMALI: PROGRAMME CONVENER</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={10} />
                  <span>MIFTHAHUL ULOOM CAMPUS, ULLISHERIKKUNNU</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Action Buttons */}
      <button
        onClick={handleDownloadJPEG}
        disabled={downloading}
        className="flex items-center space-x-2 px-6 py-3 bg-[#C8A86B] hover:bg-[#B8943A] text-[#0B0B0B] font-bold rounded-full shadow-lg transition-all text-sm disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        <span>{downloading ? 'Generating 4K JPEG...' : 'Download 4K Printable ID Card (JPEG)'}</span>
      </button>

    </div>
  );
}
