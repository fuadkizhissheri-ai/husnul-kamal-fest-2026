'use client';

import React, { useEffect, useRef } from 'react';

const ARABIC_LETTERS = [
  'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش',
  'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي',
  'ﷺ', 'ﷲ'
];

export default function ArabicCalligraphyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawStaticWatermark = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains('dark');
      const letterCount = Math.min(24, Math.max(12, Math.floor((width * height) / 35000)));

      // Pseudo-random deterministic placement grid for clean static layout
      for (let i = 0; i < letterCount; i++) {
        const letter = ARABIC_LETTERS[i % ARABIC_LETTERS.length];

        const cols = Math.ceil(Math.sqrt(letterCount * (width / height)));
        const rows = Math.ceil(letterCount / cols);
        const col = i % cols;
        const row = Math.floor(i / cols);

        const cellW = width / cols;
        const cellH = height / rows;

        const x = (col + 0.5) * cellW + (Math.sin(i * 3) * cellW * 0.2);
        const y = (row + 0.5) * cellH + (Math.cos(i * 2) * cellH * 0.2);

        const size = Math.min(cellW, cellH) * 0.5;
        const rotation = Math.sin(i) * 0.15;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        ctx.font = `bold ${size}px "Amiri", "Aref Ruqaa", "Scheherazade New", "Noto Naskh Arabic", serif`;
        ctx.fillStyle = isDark ? '#C8A86B' : '#7A5600';
        ctx.globalAlpha = isDark ? 0.05 : 0.04;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 0;

        ctx.fillText(letter, 0, 0);
        ctx.restore();
      }
    };

    drawStaticWatermark();

    window.addEventListener('resize', drawStaticWatermark, { passive: true });
    return () => {
      window.removeEventListener('resize', drawStaticWatermark);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
    />
  );
}
