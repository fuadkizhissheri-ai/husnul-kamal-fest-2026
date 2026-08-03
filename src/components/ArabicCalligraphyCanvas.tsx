'use client';

import React, { useEffect, useRef } from 'react';

interface LetterParticle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  targetSize: number;
  opacity: number;
  baseOpacity: number;
  targetOpacity: number;
  letter: string;
  rotation: number;
  rotationSpeed: number;
  layer: 'bg' | 'mid' | 'fg';
  floatOffset: number;
  floatSpeed: number;
}

interface SparkleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  colorType: 'gold' | 'green' | 'gold-green';
}

interface ClickRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

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

    // Accessibility check: reduced motion preference
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId: number;
    let startTime = 0;
    let lastFrameTime = 0;
    const fpsInterval = 1000 / 30; // 30 FPS target for efficiency

    let width = 0;
    let height = 0;

    // Actual raw cursor position
    const mouse = { x: -1000, y: -1000, active: false };

    // Lerp-smoothed cursor position for spotlight orb
    const smoothMouse = { x: -1000, y: -1000 };

    let particles: LetterParticle[] = [];
    let sparkles: SparkleParticle[] = [];
    let ripples: ClickRipple[] = [];

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const density = prefersReducedMotion ? 12 : Math.min(36, Math.max(20, Math.floor((width * height) / 28000)));

      for (let i = 0; i < density; i++) {
        const letter = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
        const x = Math.random() * width;
        const y = Math.random() * height;

        const layerRand = Math.random();
        let layer: 'bg' | 'mid' | 'fg' = 'mid';
        let size = 30;
        let opacity = 0.12;
        let speedMult = 0.3;

        if (layerRand < 0.3) {
          layer = 'bg';
          size = Math.random() * 24 + 40; // 40-64px
          opacity = Math.random() * 0.04 + 0.04;
          speedMult = 0.12;
        } else if (layerRand < 0.7) {
          layer = 'mid';
          size = Math.random() * 16 + 26; // 26-42px
          opacity = Math.random() * 0.08 + 0.08;
          speedMult = 0.25;
        } else {
          layer = 'fg';
          size = Math.random() * 12 + 20; // 20-32px
          opacity = Math.random() * 0.10 + 0.14;
          speedMult = 0.40;
        }

        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          targetX: x,
          targetY: y,
          vx: prefersReducedMotion ? 0 : (Math.random() - 0.5) * speedMult,
          vy: prefersReducedMotion ? 0 : (Math.random() - 0.5) * speedMult,
          size,
          baseSize: size,
          targetSize: size,
          opacity,
          baseOpacity: opacity,
          targetOpacity: opacity,
          letter,
          rotation: (Math.random() - 0.5) * 0.4,
          rotationSpeed: prefersReducedMotion ? 0 : (Math.random() - 0.5) * 0.003,
          layer,
          floatOffset: Math.random() * Math.PI * 2,
          floatSpeed: prefersReducedMotion ? 0 : Math.random() * 0.02 + 0.01,
        });
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;

      // Spawn playful golden and emerald green dots following the mouse cursor
      if (!prefersReducedMotion) {
        for (let k = 0; k < 2; k++) {
          const colorRand = Math.random();
          const colorType: 'gold' | 'green' | 'gold-green' =
            colorRand < 0.4 ? 'gold' : colorRand < 0.75 ? 'green' : 'gold-green';

          sparkles.push({
            x: mouse.x + (Math.random() - 0.5) * 20,
            y: mouse.y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 1.4,
            vy: (Math.random() - 0.5) * 1.4 - 0.2,
            size: Math.random() * 3.5 + 1.5,
            alpha: 0.85,
            life: 0,
            maxLife: Math.random() * 25 + 15,
            colorType,
          });
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      if (!canvas || prefersReducedMotion) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      ripples.push({
        x: clickX,
        y: clickY,
        radius: 5,
        maxRadius: Math.max(width, height) * 0.35,
        alpha: 0.5,
      });
    };

    const onMouseLeave = () => {
      mouse.active = false;
    };

    let isScrolling = false;
    let scrollTimeout: any = null;

    const onScroll = () => {
      isScrolling = true;
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 150);
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('click', onClick, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    resize();

    // Main Canvas Render Loop
    const render = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(render);

      if (document.hidden || isScrolling) return;

      if (!startTime) startTime = currentTime;
      const elapsedTime = currentTime - startTime;

      const delta = currentTime - lastFrameTime;
      if (delta < fpsInterval) return;
      lastFrameTime = currentTime - (delta % fpsInterval);

      const globalFade = Math.min(1, elapsedTime / 1200);

      ctx.clearRect(0, 0, width, height);

      // Lerp smooth mouse spotlight position
      if (mouse.active) {
        smoothMouse.x += (mouse.x - smoothMouse.x) * 0.08;
        smoothMouse.y += (mouse.y - smoothMouse.y) * 0.08;
      } else {
        smoothMouse.x += (-1000 - smoothMouse.x) * 0.05;
        smoothMouse.y += (-1000 - smoothMouse.y) * 0.05;
      }

      // ── 1. RENDER CURSOR SPOTLIGHT ORB (GOLD & GREEN TINT) ──
      if (smoothMouse.x > -500 && !prefersReducedMotion) {
        ctx.save();
        const isDark = document.documentElement.classList.contains('dark');
        const spotlightGrad = ctx.createRadialGradient(
          smoothMouse.x, smoothMouse.y, 0,
          smoothMouse.x, smoothMouse.y, 220
        );
        if (isDark) {
          spotlightGrad.addColorStop(0, 'rgba(200, 168, 107, 0.14)');
          spotlightGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.07)');
          spotlightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          spotlightGrad.addColorStop(0, 'rgba(158, 116, 29, 0.12)');
          spotlightGrad.addColorStop(0.5, 'rgba(6, 95, 70, 0.06)');
          spotlightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }

        ctx.fillStyle = spotlightGrad;
        ctx.beginPath();
        ctx.arc(smoothMouse.x, smoothMouse.y, 220, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ── 2. RENDER CLICK RIPPLES ──
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.radius += (rip.maxRadius - rip.radius) * 0.08 + 2;
        rip.alpha *= 0.94;

        if (rip.alpha < 0.01 || rip.radius >= rip.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#C8A86B';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = rip.alpha * globalFade;
        ctx.shadowColor = '#C8A86B';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();
      }

      // ── 3. RENDER PLAYFUL GOLD & GREEN PARTICLES ──
      const isDark = document.documentElement.classList.contains('dark');
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const sp = sparkles[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.life++;
        sp.alpha = (1 - sp.life / sp.maxLife) * 0.85 * globalFade;

        if (sp.life >= sp.maxLife) {
          sparkles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);

        let dotGrad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, sp.size);
        if (sp.colorType === 'green') {
          dotGrad.addColorStop(0, isDark ? '#34D399' : '#059669');
          dotGrad.addColorStop(1, isDark ? '#059669' : '#065F46');
          ctx.shadowColor = isDark ? '#34D399' : '#059669';
        } else if (sp.colorType === 'gold-green') {
          dotGrad.addColorStop(0, isDark ? '#F5E6C4' : '#C8A86B');
          dotGrad.addColorStop(1, isDark ? '#10B981' : '#065F46');
          ctx.shadowColor = isDark ? '#C8A86B' : '#9E741D';
        } else {
          dotGrad.addColorStop(0, isDark ? '#FDE68A' : '#C8A86B');
          dotGrad.addColorStop(1, isDark ? '#C8A86B' : '#7A5600');
          ctx.shadowColor = isDark ? '#FDE68A' : '#9E741D';
        }

        ctx.fillStyle = dotGrad;
        ctx.globalAlpha = sp.alpha;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }

      // ── 4. RENDER CALLIGRAPHY PARTICLES ──
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.floatOffset += p.floatSpeed;
          const floatY = Math.sin(p.floatOffset) * 0.4;
          const floatX = Math.cos(p.floatOffset * 0.8) * 0.3;

          p.baseX += p.vx + floatX;
          p.baseY += p.vy + floatY;
          p.rotation += p.rotationSpeed;
        }

        // Wrap Canvas Boundaries
        if (p.baseX < -60) p.baseX = width + 60;
        if (p.baseX > width + 60) p.baseX = -60;
        if (p.baseY < -60) p.baseY = height + 60;
        if (p.baseY > height + 60) p.baseY = -60;

        // Interaction calculation: Mouse & Ripples
        const dx = smoothMouse.x - p.baseX;
        const dy = smoothMouse.y - p.baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radius = 180;

        let targetDx = 0;
        let targetDy = 0;
        let rippleBoost = 0;

        // Check if particle is inside active click ripples
        for (const rip of ripples) {
          const rdx = p.baseX - rip.x;
          const rdy = p.baseY - rip.y;
          const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
          if (Math.abs(rdist - rip.radius) < 50) {
            rippleBoost = Math.max(rippleBoost, rip.alpha);
          }
        }

        if (mouse.active && distance < radius && !prefersReducedMotion) {
          const force = (radius - distance) / radius;
          const angle = Math.atan2(dy, dx);

          targetDx = -Math.cos(angle) * force * 35;
          targetDy = -Math.sin(angle) * force * 35;

          p.targetSize = p.baseSize * (1 + force * 0.4);
          p.targetOpacity = Math.min(0.65, p.baseOpacity + force * 0.35 + rippleBoost * 0.3);
        } else {
          p.targetSize = p.baseSize;
          p.targetOpacity = Math.min(0.65, p.baseOpacity + rippleBoost * 0.3);
        }

        // LERP Smooth Eased Interpolation
        p.x += (p.baseX + targetDx - p.x) * 0.08;
        p.y += (p.baseY + targetDy - p.y) * 0.08;
        p.size += (p.targetSize - p.size) * 0.08;
        p.opacity += (p.targetOpacity - p.opacity) * 0.08;

        // Draw Calligraphy
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        const isDark = document.documentElement.classList.contains('dark');

        const grad = ctx.createLinearGradient(-p.size / 2, -p.size / 2, p.size / 2, p.size / 2);
        if (isDark) {
          grad.addColorStop(0, '#C8A86B'); // Gold
          grad.addColorStop(1, '#10B981'); // Emerald
        } else {
          grad.addColorStop(0, '#7A5600'); // Deep Bronze Gold
          grad.addColorStop(1, '#065F46'); // Deep Forest Green
        }

        ctx.font = `bold ${p.size}px "Amiri", "Aref Ruqaa", "Reem Kufi", "Scheherazade New", "Noto Naskh Arabic", serif`;
        ctx.fillStyle = grad;
        ctx.globalAlpha = (isDark ? p.opacity : p.opacity * 0.75) * globalFade;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Soft Golden Glow when cursor is near or ripple passes
        if (distance < radius || rippleBoost > 0.1) {
          ctx.shadowColor = isDark ? '#C8A86B' : '#9E741D';
          ctx.shadowBlur = 14;
        }

        ctx.fillText(p.letter, 0, 0);
        ctx.restore();
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
    />
  );
}
