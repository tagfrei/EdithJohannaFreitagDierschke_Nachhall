'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { deriveMoodProfile } from '@/lib/matching';
import type { PoemLength } from '@/lib/types';

/**
 * Uebergangsbildschirm mit klarem Kontrast.
 */
export function TransitionScreen() {
  const mood = useAppStore((s) => s.mood);
  const setPhase = useAppStore((s) => s.setPhase);
  const setLengthPref = useAppStore((s) => s.setLengthPref);

  const profile = deriveMoodProfile(mood);

  const handleChoice = (pref: PoemLength) => {
    setLengthPref(pref);
    setPhase('reveal');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
      className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{ background: 'rgba(252, 250, 248, 0.98)' }}
    >
      {/* Stimmungs-Wort */}
      <motion.h2
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="poem-text text-4xl md:text-6xl mb-3"
        style={{ color: '#1a1a2e' }}
      >
        {profile.label}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.8 }}
        className="text-sm tracking-[0.15em]
          font-[family-name:var(--font-ui)] mb-20"
        style={{ color: '#8a8a9e' }}
      >
        {profile.sublabel}
      </motion.p>

      {/* Laengen-Auswahl */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="flex flex-col items-center gap-6"
      >
        <p className="text-xs tracking-[0.15em] uppercase font-[family-name:var(--font-ui)]"
          style={{ color: '#9a9aae' }}>
          ein Gedicht fuer diesen Moment
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => handleChoice('short')}
            className="px-7 py-3 rounded-full text-sm font-[family-name:var(--font-ui)]
              transition-all duration-400
              focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
            style={{
              border: '1.5px solid #c8c8d4',
              color: '#5a5a6e',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#7a7a8e';
              e.currentTarget.style.color = '#2a2a3e';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#c8c8d4';
              e.currentTarget.style.color = '#5a5a6e';
            }}
          >
            kurz
          </button>

          <button
            onClick={() => handleChoice('any')}
            className="px-7 py-3 rounded-full text-sm font-[family-name:var(--font-ui)]
              transition-all duration-400
              focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
            style={{
              border: '1.5px solid #8a8a9e',
              color: '#2a2a3e',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#4a4a5e';
              e.currentTarget.style.color = '#1a1a2e';
              e.currentTarget.style.background = 'rgba(0,0,0,0.03)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#8a8a9e';
              e.currentTarget.style.color = '#2a2a3e';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            ueberrasche mich
          </button>

          <button
            onClick={() => handleChoice('long')}
            className="px-7 py-3 rounded-full text-sm font-[family-name:var(--font-ui)]
              transition-all duration-400
              focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
            style={{
              border: '1.5px solid #c8c8d4',
              color: '#5a5a6e',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#7a7a8e';
              e.currentTarget.style.color = '#2a2a3e';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#c8c8d4';
              e.currentTarget.style.color = '#5a5a6e';
            }}
          >
            lang
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
