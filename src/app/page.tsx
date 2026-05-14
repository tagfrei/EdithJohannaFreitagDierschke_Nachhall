'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { PoemGalaxy } from '@/components/galaxy/PoemGalaxy';
import { PoemReveal } from '@/components/poem/PoemReveal';
import { BiographyView } from '@/components/bio/BiographyView';

/**
 * Hauptseite: Gedicht-Galaxie → Gedicht-Reveal → zurueck.
 */
export default function Home() {
  const phase = useAppStore((s: { phase: string }) => s.phase);
  const loadFeedbackHues = useAppStore((s: { loadFeedbackHues: () => Promise<void> }) => s.loadFeedbackHues);

  useEffect(() => {
    loadFeedbackHues();
  }, [loadFeedbackHues]);

  return (
    <main className="h-full relative">
      <AnimatePresence mode="wait">
        {phase === 'galaxy' && (
          <motion.div
            key="galaxy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          >
            <PoemGalaxy />
          </motion.div>
        )}

        {(phase === 'reveal' || phase === 'resonance') && (
          <motion.div
            key="poem"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          >
            <PoemReveal />
          </motion.div>
        )}

        {phase === 'bio' && (
          <motion.div
            key="bio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          >
            <BiographyView />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
