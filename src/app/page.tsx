'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { PoemGalaxy } from '@/components/galaxy/PoemGalaxy';
import { PoemReveal } from '@/components/poem/PoemReveal';

/**
 * Hauptseite: Gedicht-Galaxie → Gedicht-Reveal → zurueck.
 */
export default function Home() {
  const phase = useAppStore((s) => s.phase);

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
      </AnimatePresence>
    </main>
  );
}
