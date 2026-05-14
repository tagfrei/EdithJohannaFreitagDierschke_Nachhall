'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { TouchedButton } from '@/components/resonance/TouchedButton';

/**
 * Gedicht-Reveal: Farb-Verlauf aus Gedichtfarbe (gedeckt/pastell).
 * Text liegt immer im hellen Teil des Verlaufs fuer gute Lesbarkeit.
 */
export function PoemReveal() {
  const currentPoem = useAppStore((s) => s.currentPoem);
  const feedbackHues = useAppStore((s) => s.feedbackHues);
  const resetForNewCycle = useAppStore((s) => s.resetForNewCycle);

  const [showResonance, setShowResonance] = useState(false);
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowResonance(true), 3000);
    const t2 = setTimeout(() => setShowContinue(true), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!currentPoem) return null;

  const hue = feedbackHues[currentPoem.id] ?? currentPoem.color_hue;
  const lines = currentPoem.body.split('\n');
  const lineDelay = Math.min(0.1, 1.8 / lines.length);

  // Gedeckte, zurueckgenommene Farbe — Verlauf spuerbar aber sanft
  const colorAccent = `hsl(${hue}, 22%, 78%)`; // Sanftes Pastell am Rand
  const colorAccentLight = `hsl(${hue}, 12%, 94%)`; // Kaum sichtbarer Hauch
  const colorAccentMid = `hsl(${hue}, 16%, 88%)`; // Weicher Uebergang

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      className="fixed inset-0 flex items-center justify-center"
    >
      {/* Verlauf: linear links Farbe → Mitte hell → rechts Farbe */}
      <div className="absolute inset-0"
        style={{
          background: `
            linear-gradient(
              to right,
              ${colorAccent} 0%,
              ${colorAccentMid} 18%,
              ${colorAccentLight} 35%,
              #faf9f7 50%,
              ${colorAccentLight} 65%,
              ${colorAccentMid} 82%,
              ${colorAccent} 100%
            )
          `,
        }}
      />

      {/* Scrollbarer Gedicht-Container */}
      <div className="relative z-10 max-w-2xl w-full max-h-full overflow-y-auto poem-scroll py-16 px-8">
        <article lang="de" aria-label={`Gedicht: ${currentPoem.title || 'Ohne Titel'}`}>
          {currentPoem.title && (
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="poem-text text-2xl md:text-3xl mb-10 text-center"
              style={{ color: `hsl(${hue}, 22%, 28%)` }}
            >
              {currentPoem.title}
            </motion.h1>
          )}

          <div className="poem-text text-lg md:text-xl leading-[2] text-center">
            {lines.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: line.trim() ? 1 : 0.2 }}
                transition={{
                  duration: 0.5,
                  delay: 0.8 + i * lineDelay,
                  ease: 'easeOut',
                }}
                style={{ color: line.trim() ? `hsl(${hue}, 12%, 22%)` : 'transparent' }}
                className={line.trim() ? '' : 'h-3'}
                aria-hidden={!line.trim()}
              >
                {line || '\u00A0'}
              </motion.p>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 1, delay: 0.8 + lines.length * lineDelay + 0.5 }}
            className="mt-12 text-sm text-center font-[family-name:var(--font-ui)]"
            style={{ color: `hsl(${hue}, 15%, 50%)` }}
          >
            {currentPoem.author}
            {currentPoem.date && <span className="ml-6">&mdash; {currentPoem.date}</span>}
          </motion.p>
        </article>

        {showResonance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="flex flex-col items-center gap-6 mt-16 pb-8"
          >
            <TouchedButton />

            {showContinue && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                onClick={resetForNewCycle}
                className="text-sm transition-colors duration-500
                  font-[family-name:var(--font-ui)]
                  focus:outline-none focus-visible:underline"
                style={{ color: `hsl(${hue}, 15%, 55%)` }}
                onMouseEnter={(e) => (e.currentTarget.style.color = `hsl(${hue}, 20%, 35%)`)}
                onMouseLeave={(e) => (e.currentTarget.style.color = `hsl(${hue}, 15%, 55%)`)}
                aria-label="Zurueck zur Galaxie"
              >
                weitergehen &rarr;
              </motion.button>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
