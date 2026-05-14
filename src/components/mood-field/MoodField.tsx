'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import type { MoodVector, PoemLength } from '@/lib/types';
import { MoodCanvas } from './MoodCanvas';
import cloudData from '@/data/wordcloud.json';

interface CloudWord { word: string; x: number; y: number; energy: number; }
const cloudWords = cloudData as CloudWord[];

export function MoodField() {
  const setMood = useAppStore((s) => s.setMood);
  const setPhase = useAppStore((s) => s.setPhase);
  const setLengthPref = useAppStore((s) => s.setLengthPref);

  const [localMood, setLocalMood] = useState<MoodVector>({
    saturation: 0.5, brightness: 0.5, energy: 0.5, regularity: 0.5,
  });
  const [isFixed, setIsFixed] = useState(false);
  const [fixedMood, setFixedMood] = useState<MoodVector | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [showLengthChoice, setShowLengthChoice] = useState(false);
  const [fixRipple, setFixRipple] = useState<{ x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const energyRef = useRef(0.5);
  const hasMoved = useRef(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // --- Mausbewegung ---
  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    setMousePos({ x: clientX, y: clientY });

    if (isDragging.current && sliderRef.current) {
      const sr = sliderRef.current.getBoundingClientRect();
      const pct = 1 - Math.max(0, Math.min(1, (clientY - sr.top) / sr.height));
      energyRef.current = pct;
      setLocalMood((prev) => ({ ...prev, energy: pct }));
      return;
    }
    if (isFixed) return;

    // Stimmungsflaeche: rechts 72px fuer Slider freilassen
    const usableWidth = rect.width - 72;
    const saturation = Math.max(0, Math.min(1, (clientX - rect.left) / usableWidth));
    const brightness = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    hasMoved.current = true;
    setLocalMood((prev) => ({ ...prev, saturation, brightness }));
  }, [isFixed]);

  // --- Scroll → Energie ---
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (isFixed) return;
    e.preventDefault();
    energyRef.current = Math.max(0, Math.min(1, energyRef.current - e.deltaY * 0.003));
    setLocalMood((prev) => ({ ...prev, energy: energyRef.current }));
  }, [isFixed]);

  // --- Klick → Fixieren ---
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (menuPos || showLengthChoice || isDragging.current) return;
    // Nicht im Slider-Bereich fixieren
    if (e.clientX > window.innerWidth - 80) return;

    if (!isFixed && hasMoved.current) {
      setFixedMood({ ...localMood });
      setIsFixed(true);
      setFixRipple({ x: e.clientX, y: e.clientY });
      setTimeout(() => setFixRipple(null), 50);
      // Menue unter dem Klick, viewport-sicher
      const mx = Math.min(e.clientX - 80, window.innerWidth - 250);
      const my = Math.min(e.clientY + 24, window.innerHeight - 200);
      setMenuPos({ x: Math.max(12, mx), y: Math.max(12, my) });
    }
  }, [isFixed, localMood, menuPos, showLengthChoice]);

  const handleResume = useCallback(() => {
    setIsFixed(false); setFixedMood(null); setMenuPos(null); setShowLengthChoice(false);
  }, []);
  const handleConfirmMood = useCallback(() => { setShowLengthChoice(true); }, []);
  const handleLengthChoice = useCallback((pref: PoemLength) => {
    if (!fixedMood) return;
    setMood(fixedMood); setLengthPref(pref); setPhase('reveal');
  }, [fixedMood, setMood, setLengthPref, setPhase]);

  // --- Slider Drag global ---
  useEffect(() => {
    const up = () => { isDragging.current = false; };
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    return () => { window.removeEventListener('mouseup', up); window.removeEventListener('touchend', up); };
  }, []);

  const displayMood = isFixed && fixedMood ? fixedMood : localMood;
  const isLight = displayMood.brightness > 0.55;

  // Adaptive Farben
  const fg = isLight ? 'rgba(25,25,45,' : 'rgba(235,235,250,';
  const fgSolid = isLight ? '#191930' : '#ebebfa';

  // Naechste Woerter am Klickpunkt finden (fuer Kontextmenue)
  const nearestWords = useMemo(() => {
    if (!menuPos || !containerRef.current) return [];
    const rect = containerRef.current.getBoundingClientRect();
    const usableW = rect.width - 72;
    return cloudWords
      .map((cw) => {
        const sx = cw.x * usableW;
        const sy = cw.y * rect.height;
        const dist = Math.sqrt((menuPos.x - sx) ** 2 + ((menuPos.y - 24) - sy) ** 2);
        return { word: cw.word, dist };
      })
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3)
      .map((w) => w.word);
  }, [menuPos]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 no-select"
      style={{ cursor: isFixed ? 'default' : 'crosshair' }}
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
      onClick={handleClick}
      onWheel={handleWheel}
      role="application"
      aria-label="Stimmungsfeld"
    >
      <MoodCanvas mood={displayMood} rippleAt={null} fixRippleAt={fixRipple} />

      {/* === WORTWOLKE === */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden" style={{ right: '72px' }}>
        {cloudWords.map((cw, i) => {
          const el = containerRef.current;
          const rect = el?.getBoundingClientRect();
          let proximity = 0;
          if (rect && hasMoved.current) {
            const usableW = rect.width - 72;
            const screenX = cw.x * usableW;
            const screenY = cw.y * rect.height;
            const dx = mousePos.x - screenX;
            const dy = mousePos.y - screenY;
            proximity = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 280);
          }
          const wordIsLight = (1 - cw.y) > 0.55;
          const baseOp = 0.04 + proximity * 0.65;
          const fs = 12 + proximity * 7;

          return (
            <span
              key={i}
              className="absolute poem-text transition-opacity duration-200"
              style={{
                left: `${cw.x * 100}%`,
                top: `${cw.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${fs}px`,
                opacity: baseOp,
                color: wordIsLight ? 'rgba(25,25,45,0.95)' : 'rgba(235,235,250,0.95)',
                textShadow: wordIsLight
                  ? '0 0 12px rgba(255,255,255,0.6)'
                  : '0 0 12px rgba(0,0,0,0.6)',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}
            >
              {cw.word}
            </span>
          );
        })}
      </div>

      {/* === ANFANGS-HINWEIS === */}
      <AnimatePresence>
        {!hasMoved.current && !isFixed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, delay: 0.8 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10
              text-center pointer-events-none select-none"
            style={{ color: 'rgba(200,200,220,0.7)', textShadow: '0 1px 16px rgba(0,0,0,0.5)' }}
          >
            <p className="poem-text text-xl">bewege die Maus durch die Worte</p>
            <p className="font-[family-name:var(--font-ui)] text-xs mt-4 opacity-50">
              klicke, um eine Stimmung festzuhalten
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === ENERGIE-SLIDER === */}
      <div
        className="absolute right-0 top-0 bottom-0 z-10"
        style={{ width: '72px' }}
      >
        <div
          className="h-full flex flex-col items-center justify-between py-8"
          style={{
            background: `${fg}0.04)`,
            backdropFilter: 'blur(12px)',
            borderLeft: `1px solid ${fg}0.06)`,
          }}
        >
          <span className="font-[family-name:var(--font-ui)] text-[9px] tracking-[0.15em] uppercase"
            style={{ color: `${fg}0.3)` }}>
            bewegt
          </span>

          {/* Slider */}
          <div
            ref={sliderRef}
            className="relative flex-1 my-4 cursor-ns-resize"
            style={{ width: '36px' }}
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); isDragging.current = true; }}
            onTouchStart={(e) => { e.stopPropagation(); isDragging.current = true; }}
            onClick={(e) => {
              e.stopPropagation();
              const sr = sliderRef.current?.getBoundingClientRect();
              if (sr) {
                const pct = 1 - Math.max(0, Math.min(1, (e.clientY - sr.top) / sr.height));
                energyRef.current = pct;
                setLocalMood((prev) => ({ ...prev, energy: pct }));
              }
            }}
          >
            {/* Track */}
            <div className="absolute left-1/2 -translate-x-1/2 h-full rounded-full"
              style={{
                width: '3px',
                background: `${fg}0.1)`,
              }}
            />
            {/* Fill */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 rounded-full"
              style={{
                width: '3px',
                height: `${displayMood.energy * 100}%`,
                background: `${fg}0.25)`,
                transition: isDragging.current ? 'none' : 'height 0.15s ease',
              }}
            />
            {/* Thumb: sanfter Kreis */}
            <div
              className="absolute left-1/2 -translate-x-1/2 rounded-full"
              style={{
                width: '24px',
                height: '24px',
                bottom: `calc(${displayMood.energy * 100}% - 12px)`,
                background: `${fg}0.12)`,
                border: `1.5px solid ${fg}0.35)`,
                backdropFilter: 'blur(8px)',
                transition: isDragging.current ? 'none' : 'bottom 0.15s ease',
                boxShadow: `0 0 12px ${fg}0.08)`,
              }}
            >
              {/* Kleiner Punkt in der Mitte */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ width: '4px', height: '4px', background: `${fg}0.5)` }}
              />
            </div>

            {/* Energie-Wert dezent */}
            <div className="absolute -left-1 font-[family-name:var(--font-ui)] text-[9px]"
              style={{
                bottom: `calc(${displayMood.energy * 100}% + 16px)`,
                color: `${fg}0.25)`,
                transition: isDragging.current ? 'none' : 'bottom 0.15s ease',
              }}
            >
              {Math.round(displayMood.energy * 100)}
            </div>
          </div>

          <span className="font-[family-name:var(--font-ui)] text-[9px] tracking-[0.15em] uppercase"
            style={{ color: `${fg}0.3)` }}>
            ruhig
          </span>
        </div>
      </div>

      {/* === KONTEXTMENUE: subtil, transparent === */}
      <AnimatePresence>
        {menuPos && !showLengthChoice && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="fixed z-50 rounded-xl overflow-hidden"
            style={{
              left: menuPos.x, top: menuPos.y,
              background: `${fg}0.06)`,
              backdropFilter: 'blur(32px)',
              border: `1px solid ${fg}0.1)`,
              boxShadow: `0 8px 32px ${fg}0.1)`,
              minWidth: '220px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Naechste Worte aus der Wolke */}
            <div className="px-4 pt-3 pb-2">
              <p className="poem-text text-base" style={{ color: `${fg}0.7)` }}>
                {nearestWords.join(' · ')}
              </p>
            </div>
            <div style={{ height: '1px', background: `${fg}0.06)` }} />

            <button
              onClick={handleConfirmMood}
              className="w-full px-4 py-3 text-left flex items-center gap-3
                transition-all duration-200 font-[family-name:var(--font-ui)]"
              style={{ color: fgSolid }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${fg}0.06)`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ color: `${fg}0.4)`, fontSize: '16px' }}>◉</span>
              <span className="text-[13px]">waehle diese Stimmung</span>
            </button>
            <div style={{ height: '1px', background: `${fg}0.04)` }} />
            <button
              onClick={handleResume}
              className="w-full px-4 py-3 text-left flex items-center gap-3
                transition-all duration-200 font-[family-name:var(--font-ui)]"
              style={{ color: `${fg}0.45)` }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${fg}0.06)`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: '14px' }}>↻</span>
              <span className="text-[13px]">weiter erkunden</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === LAENGEN-WAHL: gleicher subtiler Stil === */}
      <AnimatePresence>
        {menuPos && showLengthChoice && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="fixed z-50 rounded-xl overflow-hidden"
            style={{
              left: menuPos.x, top: menuPos.y,
              background: `${fg}0.06)`,
              backdropFilter: 'blur(32px)',
              border: `1px solid ${fg}0.1)`,
              boxShadow: `0 8px 32px ${fg}0.1)`,
              minWidth: '220px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Zurueck */}
            <button
              onClick={() => setShowLengthChoice(false)}
              className="w-full px-4 py-2 text-left transition-all duration-200
                font-[family-name:var(--font-ui)] text-[11px]"
              style={{ color: `${fg}0.3)`, borderBottom: `1px solid ${fg}0.04)` }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${fg}0.04)`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              ← zurueck
            </button>

            {/* Header */}
            <div className="px-4 pt-2.5 pb-1.5">
              <p className="poem-text text-xs"
                style={{ color: `${fg}0.35)` }}>
                {nearestWords.join(' · ')}
              </p>
            </div>

            {[
              { pref: 'short' as PoemLength, label: 'kurzer Text', desc: 'wenige Zeilen' },
              { pref: 'any' as PoemLength, label: 'ueberrasche mich', desc: '' },
              { pref: 'long' as PoemLength, label: 'langer Text', desc: 'zum Eintauchen' },
            ].map(({ pref, label, desc }) => (
              <div key={pref}>
                <div style={{ height: '1px', background: `${fg}0.04)` }} />
                <button
                  onClick={() => handleLengthChoice(pref)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between
                    transition-all duration-200 font-[family-name:var(--font-ui)]"
                  style={{ color: pref === 'any' ? fgSolid : `${fg}0.6)` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = `${fg}0.06)`)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span className={`text-[13px] ${pref === 'any' ? 'font-medium' : ''}`}>{label}</span>
                  {desc && <span className="text-[10px]" style={{ color: `${fg}0.25)` }}>{desc}</span>}
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
