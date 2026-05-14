'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { poems } from '@/lib/poems';
import type { Poem } from '@/lib/types';

function dotSize(lineCount: number): number {
  const t = Math.min(1, Math.max(0, (lineCount - 2) / 78));
  return 10 + t * 38;
}

function mutedColor(hue: number, sat: number, light: number, alpha: number): string {
  const s = Math.min(38, sat * 0.5 + 10);
  const l = 55 + (light / 70) * 20;
  return `hsla(${hue}, ${s}%, ${l}%, ${alpha})`;
}

function seeded(i: number, offset: number): number {
  const x = Math.sin(i * 127.1 + offset * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function heartbeat(phase: number): number {
  const p = phase % (Math.PI * 2);
  const t = p / (Math.PI * 2);
  if (t < 0.1) return Math.sin(t / 0.1 * Math.PI) * 1.0;
  if (t < 0.15) return Math.sin((t - 0.1) / 0.05 * Math.PI) * -0.3;
  if (t < 0.25) return Math.sin((t - 0.15) / 0.1 * Math.PI) * 0.6;
  if (t < 0.35) return Math.sin((t - 0.25) / 0.1 * Math.PI) * -0.15;
  return 0;
}

// Pastell-Palette: 4 Reihen × 8 Farben — gedeckte, gebrochene Toene
const PALETTE_COLS = 8;
const PALETTE_ROWS = 3;
const PALETTE_HUES = [25, 45, 90, 140, 185, 220, 270, 340]; // Ocker, Gold, Sage, Gruen, Teal, Blau, Violett, Altrosa

function paletteHSL(col: number, row: number): [number, number, number] {
  const hue = PALETTE_HUES[col];
  const sat = 30 - row * 5;    // 30, 25, 20 — etwas kraeftiger
  const light = 78 - row * 12; // 78, 66, 54
  return [hue, sat, light];
}

interface Dot {
  poem: Poem;
  hue: number; sat: number; light: number; size: number;
  xPct: number; yOffset: number;
  beatPhase: number; beatSpeed: number;
}

export function PoemGalaxy() {
  const setCurrentPoem = useAppStore((s) => s.setCurrentPoem);
  const setPhase = useAppStore((s) => s.setPhase);
  const feedbackHues = useAppStore((s) => s.feedbackHues);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const dotsRef = useRef<Dot[]>([]);
  const [hoveredPoem, setHoveredPoem] = useState<Poem | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [tappedPoem, setTappedPoem] = useState<Poem | null>(null);
  const [tapPos, setTapPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hintergrund-Farben: links und rechts (Start: kraeftiges Sage → warmer Ziegel)
  const [colorLeft, setColorLeft] = useState<[number, number, number]>([105, 25, 72]);  // Sage Green, kraeftiger
  const [colorRight, setColorRight] = useState<[number, number, number]>([25, 30, 68]); // Ziegel/Ocker, waermer
  const [pickerSide, setPickerSide] = useState<'left' | 'right' | null>(null);

  const bgLeftRef = useRef(colorLeft);
  const bgRightRef = useRef(colorRight);
  useEffect(() => { bgLeftRef.current = colorLeft; }, [colorLeft]);
  useEffect(() => { bgRightRef.current = colorRight; }, [colorRight]);

  // Dots aufbauen
  useEffect(() => {
    dotsRef.current = poems.map((p, i) => {
      const hue = feedbackHues[p.id] ?? p.color_hue;
      return {
        poem: p, hue, sat: p.color_sat, light: p.color_light,
        size: dotSize(p.line_count),
        xPct: 0.08 + (hue / 360) * 0.84,
        yOffset: (seeded(i, 1) - 0.5) * 0.55 + (p.color_light / 70 - 0.5) * 0.15,
        beatPhase: seeded(i, 2) * Math.PI * 2,
        beatSpeed: 0.55 + seeded(i, 3) * 0.15,
      };
    });
  }, [feedbackHues]);

  // Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cy = h / 2;
      timeRef.current += 0.016;
      const t = timeRef.current;

      // Gradient-Hintergrund aus den beiden User-Farben
      const cl = bgLeftRef.current;
      const cr = bgRightRef.current;
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, `hsl(${cl[0]}, ${cl[1]}%, ${cl[2]}%)`);
      grad.addColorStop(0.5, `hsl(${(cl[0] + cr[0]) / 2}, ${(cl[1] + cr[1]) / 2}%, ${Math.max(cl[2], cr[2]) + 4}%)`);
      grad.addColorStop(1, `hsl(${cr[0]}, ${cr[1]}%, ${cr[2]}%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Dots
      const dots = dotsRef.current;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const x = d.xPct * w;
        const y = cy + d.yOffset * h;
        const beat = heartbeat(t * d.beatSpeed + d.beatPhase);
        const scale = 1 + beat * 0.25;
        const size = d.size * scale;
        const breathe = Math.sin(t * 0.3 + d.beatPhase) * 8;
        const drift = Math.sin(t * 0.15 + d.beatPhase * 1.7) * 6;
        const yFinal = y + breathe;
        const xFinal = x + drift;

        const glowSize = size * 2.5;
        const glow = ctx.createRadialGradient(xFinal, yFinal, 0, xFinal, yFinal, glowSize);
        glow.addColorStop(0, mutedColor(d.hue, d.sat, d.light, 0.25));
        glow.addColorStop(0.5, mutedColor(d.hue, d.sat, d.light, 0.09));
        glow.addColorStop(1, mutedColor(d.hue, d.sat, d.light, 0));
        ctx.beginPath();
        ctx.arc(xFinal, yFinal, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        const kern = ctx.createRadialGradient(xFinal, yFinal, 0, xFinal, yFinal, size);
        const coreSat = Math.min(45, d.sat * 0.6 + 12);
        const coreLight = 50 + (d.light / 70) * 20;
        const beatAlpha = 0.65 + beat * 0.15;
        kern.addColorStop(0, `hsla(${d.hue}, ${coreSat}%, ${coreLight}%, ${beatAlpha})`);
        kern.addColorStop(0.5, `hsla(${d.hue}, ${coreSat * 0.8}%, ${coreLight + 5}%, ${beatAlpha * 0.5})`);
        kern.addColorStop(1, `hsla(${d.hue}, ${coreSat * 0.5}%, ${coreLight + 10}%, 0)`);
        ctx.beginPath();
        ctx.arc(xFinal, yFinal, size, 0, Math.PI * 2);
        ctx.fillStyle = kern;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Hit-Test
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cy = h / 2;
    const t = timeRef.current;
    const mx = e.clientX;
    const my = e.clientY;

    let closest: { poem: Poem; dist: number } | null = null;
    for (const d of dotsRef.current) {
      const x = d.xPct * w + Math.sin(t * 0.15 + d.beatPhase * 1.7) * 6;
      const y = cy + d.yOffset * h + Math.sin(t * 0.3 + d.beatPhase) * 8;
      const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2);
      if (dist < d.size * 2.5 && (!closest || dist < closest.dist)) {
        closest = { poem: d.poem, dist };
      }
    }

    if (closest) {
      setHoveredPoem(closest.poem);
      setHoverPos({ x: mx, y: my });
    } else {
      setHoveredPoem(null);
    }
  }, []);

  const findPoemAt = useCallback((cx: number, cy: number): Poem | null => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const mid = h / 2;
    const t = timeRef.current;
    let closest: { poem: Poem; dist: number } | null = null;
    for (const d of dotsRef.current) {
      const x = d.xPct * w + Math.sin(t * 0.15 + d.beatPhase * 1.7) * 6;
      const y = mid + d.yOffset * h + Math.sin(t * 0.3 + d.beatPhase) * 8;
      const dist = Math.sqrt((cx - x) ** 2 + (cy - y) ** 2);
      if (dist < d.size * 2.5 && (!closest || dist < closest.dist)) {
        closest = { poem: d.poem, dist };
      }
    }
    return closest?.poem ?? null;
  }, []);

  const handleClick = useCallback(() => {
    if (hoveredPoem) {
      setCurrentPoem(hoveredPoem);
      setPhase('reveal');
    }
  }, [hoveredPoem, setCurrentPoem, setPhase]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (pickerSide) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const poem = findPoemAt(touch.clientX, touch.clientY);

    if (!poem) {
      setTappedPoem(null);
      return;
    }

    if (tappedPoem && tappedPoem.id === poem.id) {
      setCurrentPoem(poem);
      setPhase('reveal');
      setTappedPoem(null);
    } else {
      setTappedPoem(poem);
      setTapPos({ x: touch.clientX, y: touch.clientY });
    }
  }, [tappedPoem, pickerSide, findPoemAt, setCurrentPoem, setPhase]);

  const handlePickColor = useCallback((col: number, row: number) => {
    const hsl = paletteHSL(col, row);
    if (pickerSide === 'left') setColorLeft(hsl);
    else if (pickerSide === 'right') setColorRight(hsl);
    setPickerSide(null);
  }, [pickerSide]);

  const previewText = useMemo(() => {
    if (!hoveredPoem) return '';
    const firstLine = hoveredPoem.body.split('\n').find((l) => l.trim()) || '';
    return firstLine.length > 60 ? firstLine.slice(0, 57) + '...' : firstLine;
  }, [hoveredPoem]);

  return (
    <div
      className="fixed inset-0 no-select"
      style={{ cursor: hoveredPoem ? 'pointer' : 'default' }}
      onMouseMove={handleMouseMove}
      onClick={(e) => {
        if (pickerSide) return;
        handleClick();
      }}
      onTouchEnd={handleTouchEnd}
      role="application"
      aria-label="Gedicht-Galaxie"
    >
      <canvas ref={canvasRef} className="absolute inset-0" aria-hidden="true" />

      {/* Farbwaehler links */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); setPickerSide(pickerSide === 'left' ? null : 'left'); }}
          className="w-10 h-10 rounded-full transition-all duration-200 hover:scale-110
            focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
          style={{
            background: `hsl(${colorLeft[0]}, ${colorLeft[1]}%, ${colorLeft[2]}%)`,
            boxShadow: pickerSide === 'left'
              ? `0 0 0 2.5px white, 0 0 0 4.5px hsl(${colorLeft[0]}, ${colorLeft[1] + 5}%, ${colorLeft[2] - 20}%), 0 2px 12px rgba(0,0,0,0.15)`
              : `0 0 0 2px rgba(255,255,255,0.7), 0 2px 8px rgba(0,0,0,0.1)`,
          }}
          aria-label="Linke Hintergrundfarbe waehlen"
        />
        <span className="font-[family-name:var(--font-ui)] text-[8px] tracking-wider"
          style={{ color: 'rgba(255,255,255,0.5)', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
          FARBE
        </span>
      </div>

      {/* Farbwaehler rechts */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); setPickerSide(pickerSide === 'right' ? null : 'right'); }}
          className="w-10 h-10 rounded-full transition-all duration-200 hover:scale-110
            focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
          style={{
            background: `hsl(${colorRight[0]}, ${colorRight[1]}%, ${colorRight[2]}%)`,
            boxShadow: pickerSide === 'right'
              ? `0 0 0 2.5px white, 0 0 0 4.5px hsl(${colorRight[0]}, ${colorRight[1] + 5}%, ${colorRight[2] - 20}%), 0 2px 12px rgba(0,0,0,0.15)`
              : `0 0 0 2px rgba(255,255,255,0.7), 0 2px 8px rgba(0,0,0,0.1)`,
          }}
          aria-label="Rechte Hintergrundfarbe waehlen"
        />
        <span className="font-[family-name:var(--font-ui)] text-[8px] tracking-wider"
          style={{ color: 'rgba(255,255,255,0.5)', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
          FARBE
        </span>
      </div>

      {/* Pastell-Palette Popup */}
      <AnimatePresence>
        {pickerSide && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute top-1/2 -translate-y-1/2 z-30"
            style={{
              [pickerSide === 'left' ? 'left' : 'right']: '44px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-xl overflow-hidden p-3 flex flex-col gap-1.5"
              style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <p className="font-[family-name:var(--font-ui)] text-[9px] text-center mb-1"
                style={{ color: 'rgba(100,95,90,0.5)' }}>
                {pickerSide === 'left' ? 'linke Farbe' : 'rechte Farbe'}
              </p>
              {Array.from({ length: PALETTE_ROWS }, (_, row) => (
                <div key={row} className="flex gap-1.5">
                  {Array.from({ length: PALETTE_COLS }, (_, col) => {
                    const [h, s, l] = paletteHSL(col, row);
                    const current = pickerSide === 'left' ? colorLeft : colorRight;
                    const isSelected = current[0] === h && current[2] === l;
                    return (
                      <button
                        key={col}
                        onClick={() => handlePickColor(col, row)}
                        className="rounded-full transition-transform duration-150
                          hover:scale-125 focus:outline-none"
                        style={{
                          width: '22px', height: '22px',
                          background: `hsl(${h}, ${s}%, ${l}%)`,
                          boxShadow: isSelected
                            ? `0 0 0 2px white, 0 0 0 3.5px hsl(${h}, ${s + 5}%, ${l - 15}%)`
                            : 'inset 0 0 0 0.5px rgba(0,0,0,0.06)',
                          transform: isSelected ? 'scale(1.2)' : undefined,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Autorin */}
      <div className="absolute bottom-6 left-0 right-0 z-10 text-center pointer-events-none select-none">
        <p className="poem-text text-base tracking-wide"
          style={{ color: 'rgba(0,0,0,0.6)', textShadow: '0 1px 6px rgba(255,255,255,0.3)' }}>
          Edith J. Freitag-Dierschke
        </p>
        <p className="font-[family-name:var(--font-ui)] text-xs tracking-widest mt-0.5"
          style={{ color: 'rgba(0,0,0,0.4)', textShadow: '0 1px 4px rgba(255,255,255,0.2)' }}>
          5. November 1937 – 14. Mai 2023
        </p>
      </div>

      {/* Hover-Vorschau (Desktop) */}
      <AnimatePresence>
        {hoveredPoem && !pickerSide && (
          <motion.div
            key={hoveredPoem.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed z-20 pointer-events-none select-none max-w-xs hidden md:block"
            style={{
              left: Math.min(hoverPos.x + 16, window.innerWidth - 280),
              top: hoverPos.y - 60,
            }}
          >
            {hoveredPoem.title && (
              <p className="poem-text text-sm mb-1"
                style={{
                  color: `hsl(${feedbackHues[hoveredPoem.id] ?? hoveredPoem.color_hue}, 25%, 28%)`,
                  textShadow: '0 1px 6px rgba(255,255,255,0.5)',
                }}>
                {hoveredPoem.title}
              </p>
            )}
            <p className="poem-text text-xs"
              style={{ color: 'rgba(40,38,36,0.55)', textShadow: '0 1px 4px rgba(255,255,255,0.4)' }}>
              {previewText}
            </p>
            <p className="font-[family-name:var(--font-ui)] text-[9px] mt-1"
              style={{ color: 'rgba(80,75,70,0.4)' }}>
              {hoveredPoem.line_count} Zeilen
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap-Vorschau (Mobile) */}
      <AnimatePresence>
        {tappedPoem && !pickerSide && (
          <motion.div
            key={`tap-${tappedPoem.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="fixed z-20 pointer-events-none select-none max-w-[240px] md:hidden"
            style={{
              left: Math.min(Math.max(16, tapPos.x - 120), window.innerWidth - 256),
              top: Math.max(16, tapPos.y - 80),
            }}
          >
            <div className="rounded-lg px-3 py-2"
              style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              {tappedPoem.title && (
                <p className="poem-text text-sm"
                  style={{ color: `hsl(${feedbackHues[tappedPoem.id] ?? tappedPoem.color_hue}, 25%, 28%)` }}>
                  {tappedPoem.title}
                </p>
              )}
              <p className="poem-text text-xs mt-0.5"
                style={{ color: 'rgba(40,38,36,0.55)' }}>
                {tappedPoem.body.split('\n').find((l) => l.trim())?.slice(0, 50) || ''}
              </p>
              <p className="font-[family-name:var(--font-ui)] text-[9px] mt-1"
                style={{ color: 'rgba(80,75,70,0.35)' }}>
                nochmal tippen zum Lesen
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
