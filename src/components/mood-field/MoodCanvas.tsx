'use client';

import { useEffect, useRef } from 'react';
import type { MoodVector } from '@/lib/types';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  baseVx: number; baseVy: number;
  size: number; opacity: number;
  hueOffset: number; phase: number;
}

interface Ripple {
  x: number; y: number;
  radius: number; maxRadius: number;
  opacity: number; hue: number;
  sat: number; light: number;
  lineWidth: number;
  isFixRipple: boolean;
}

interface MoodCanvasProps {
  mood: MoodVector;
  rippleAt?: { x: number; y: number } | null;
  fixRippleAt?: { x: number; y: number } | null;
}

/**
 * Generativer Canvas — hell, frisch, kontrastreich.
 * fixRippleAt erzeugt einen verstaerkten Ripple-Effekt beim Fixieren.
 */
export function MoodCanvas({ mood, rippleAt, fixRippleAt }: MoodCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const animRef = useRef<number>(0);
  const moodRef = useRef(mood);
  const timeRef = useRef(0);

  useEffect(() => { moodRef.current = mood; }, [mood]);

  // Normaler Ripple
  useEffect(() => {
    if (rippleAt) {
      const m = moodRef.current;
      const hue = m.warmth < 0.5 ? 200 + m.warmth * 60 : 20 + (m.warmth - 0.5) * 60;
      ripplesRef.current.push({
        x: rippleAt.x, y: rippleAt.y,
        radius: 0, maxRadius: 200, opacity: 0.7,
        hue, sat: 50 + m.warmth * 40, light: 40 + m.lightness * 45,
        lineWidth: 2, isFixRipple: false,
      });
    }
  }, [rippleAt]);

  // Verstaerkter Fix-Ripple: Dreifach-Ring + Glow
  useEffect(() => {
    if (fixRippleAt) {
      const m = moodRef.current;
      const hue = m.warmth < 0.5 ? 200 + m.warmth * 60 : 20 + (m.warmth - 0.5) * 60;
      const base = {
        x: fixRippleAt.x, y: fixRippleAt.y,
        hue, sat: 60 + m.warmth * 30, light: 50 + m.lightness * 35,
        isFixRipple: true,
      };
      // Drei konzentrische Ringe mit Versatz
      ripplesRef.current.push(
        { ...base, radius: 0, maxRadius: 400, opacity: 1.0, lineWidth: 4 },
        { ...base, radius: 0, maxRadius: 300, opacity: 0.7, lineWidth: 6 },
        { ...base, radius: 0, maxRadius: 200, opacity: 0.5, lineWidth: 8 },
      );
    }
  }, [fixRippleAt]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const count = 45;
    const w = window.innerWidth;
    const h = window.innerHeight;
    particlesRef.current = Array.from({ length: count }, (_, i) => {
      const vx = (Math.random() - 0.5) * 1.5;
      const vy = (Math.random() - 0.5) * 1.5;
      return {
        x: Math.random() * w, y: Math.random() * h,
        vx, vy, baseVx: vx, baseVy: vy,
        size: i < 10 ? Math.random() * 200 + 120 : Math.random() * 100 + 40,
        opacity: i < 10 ? Math.random() * 0.25 + 0.15 : Math.random() * 0.4 + 0.2,
        hueOffset: Math.random() * 40 - 20,
        phase: Math.random() * Math.PI * 2,
      };
    });

    const animate = () => {
      const m = moodRef.current;
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      timeRef.current += 0.016;
      const t = timeRef.current;

      // Hintergrund
      const bgHue = m.warmth < 0.5 ? 220 + m.warmth * 40 : 40 - (m.warmth - 0.5) * 60;
      const bgSat = 8 + m.warmth * 20;
      const bgLight = 8 + m.lightness * 82;
      ctx.fillStyle = `hsl(${bgHue}, ${bgSat}%, ${bgLight}%)`;
      ctx.fillRect(0, 0, cw, ch);

      // Partikel-Farben
      const baseHue = m.warmth < 0.5
        ? 210 + (1 - m.warmth) * 30
        : 30 - (m.warmth - 0.5) * 30;
      const baseSat = 25 + m.warmth * 65;
      const baseLight = 30 + m.lightness * 55;
      const speed = 0.2 + m.energy * 3;
      const chaos = 1 - m.intensity;

      for (const p of particlesRef.current) {
        if (chaos > 0.5) {
          p.vx += (Math.random() - 0.5) * chaos * 0.15;
          p.vy += (Math.random() - 0.5) * chaos * 0.15;
          const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (spd > 2.5) { p.vx = (p.vx / spd) * 2.5; p.vy = (p.vy / spd) * 2.5; }
        } else {
          p.vx = p.baseVx + Math.sin(t * 0.4 + p.phase) * 0.4 * (1 - m.intensity);
          p.vy = p.baseVy + Math.cos(t * 0.25 + p.phase) * 0.3;
        }

        p.x += p.vx * speed;
        p.y += p.vy * speed;
        if (p.x < -p.size) p.x = cw + p.size;
        if (p.x > cw + p.size) p.x = -p.size;
        if (p.y < -p.size) p.y = ch + p.size;
        if (p.y > ch + p.size) p.y = -p.size;

        const pulse = 1 + Math.sin(t * 2 + p.phase) * m.energy * 0.15;
        const size = p.size * pulse;
        const hue = baseHue + p.hueOffset;
        const contrast = m.lightness > 0.5 ? -15 : 15;
        const light = baseLight + contrast;
        const alpha = p.opacity * (0.4 + m.warmth * 0.6);

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
        gradient.addColorStop(0, `hsla(${hue}, ${baseSat}%, ${light}%, ${alpha})`);
        gradient.addColorStop(0.4, `hsla(${hue}, ${baseSat * 0.7}%, ${light}%, ${alpha * 0.5})`);
        gradient.addColorStop(1, `hsla(${hue}, ${baseSat * 0.5}%, ${light}%, 0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Ripples
      const activeRipples: Ripple[] = [];
      for (const r of ripplesRef.current) {
        const growSpeed = r.isFixRipple ? 3.5 : 5;
        r.radius += growSpeed;
        r.opacity *= r.isFixRipple ? 0.975 : 0.955;

        if (r.radius < r.maxRadius && r.opacity > 0.01) {
          activeRipples.push(r);

          // Ring
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${r.hue}, ${r.sat}%, ${r.light}%, ${r.opacity})`;
          ctx.lineWidth = r.lineWidth;
          ctx.stroke();

          // Innerer Glow (staerker bei Fix-Ripple)
          const glowStrength = r.isFixRipple ? 0.4 : 0.2;
          const inner = ctx.createRadialGradient(r.x, r.y, r.radius * 0.7, r.x, r.y, r.radius);
          inner.addColorStop(0, `hsla(${r.hue}, ${r.sat}%, ${r.light}%, 0)`);
          inner.addColorStop(1, `hsla(${r.hue}, ${r.sat}%, ${r.light}%, ${r.opacity * glowStrength})`);
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
          ctx.fillStyle = inner;
          ctx.fill();
        }
      }
      ripplesRef.current = activeRipples;

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
