// Globaler App-State mit Zustand
import { create } from 'zustand';
import type { Poem, AppPhase, MoodVector, PoemLength } from './types';

interface AppState {
  phase: AppPhase;
  setPhase: (phase: AppPhase) => void;

  currentPoem: Poem | null;
  setCurrentPoem: (poem: Poem | null) => void;

  mood: MoodVector;
  setMood: (mood: MoodVector) => void;

  lengthPref: PoemLength;
  setLengthPref: (pref: PoemLength) => void;

  bgColorLeft: [number, number, number];
  bgColorRight: [number, number, number];
  setBgColorLeft: (color: [number, number, number]) => void;
  setBgColorRight: (color: [number, number, number]) => void;

  feedbackHues: Record<string, number>;
  feedbackLevels: Record<string, number>;
  setFeedbackHue: (poemId: string, hue: number) => void;
  loadFeedbackHues: () => Promise<void>;

  resetForNewCycle: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  phase: 'galaxy',
  setPhase: (phase) => set({ phase }),

  currentPoem: null,
  setCurrentPoem: (poem) => set({ currentPoem: poem }),

  mood: { warmth: 0.5, lightness: 0.5, energy: 0.5, intensity: 0.5 },
  setMood: (mood) => set({ mood }),

  lengthPref: 'any',
  setLengthPref: (pref) => set({ lengthPref: pref }),

  bgColorLeft: [105, 25, 72],
  bgColorRight: [25, 30, 68],
  setBgColorLeft: (color) => set({ bgColorLeft: color }),
  setBgColorRight: (color) => set({ bgColorRight: color }),

  feedbackHues: {},
  feedbackLevels: {},
  setFeedbackHue: (poemId, hue) => {
    set((state) => ({
      feedbackHues: { ...state.feedbackHues, [poemId]: hue },
      feedbackLevels: {
        ...state.feedbackLevels,
        [poemId]: Math.min(10, (state.feedbackLevels[poemId] ?? 0) + 1),
      },
    }));
    fetch('/api/hues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ poemId, hue }),
    }).catch(() => {});
  },
  loadFeedbackHues: async () => {
    try {
      const res = await fetch('/api/hues');
      const data = await res.json();
      if (data && typeof data === 'object') {
        const hues: Record<string, number> = {};
        const levels: Record<string, number> = {};
        for (const [id, val] of Object.entries(data)) {
          if (val && typeof val === 'object' && 'hue' in val) {
            const entry = val as { hue: number; level: number };
            hues[id] = entry.hue;
            levels[id] = entry.level;
          } else {
            // Fallback: altes Format
            hues[id] = val as number;
            levels[id] = 1;
          }
        }
        set({ feedbackHues: hues, feedbackLevels: levels });
      }
    } catch {}
  },

  resetForNewCycle: () =>
    set({ phase: 'galaxy', currentPoem: null }),
}));
