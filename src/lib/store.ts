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
  feedbackTimestamps: Record<string, string>;
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
  feedbackTimestamps: {},
  setFeedbackHue: (poemId, hue) => {
    set((state) => ({
      feedbackHues: { ...state.feedbackHues, [poemId]: hue },
      feedbackTimestamps: { ...state.feedbackTimestamps, [poemId]: new Date().toISOString() },
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
        const timestamps: Record<string, string> = {};
        for (const [id, val] of Object.entries(data)) {
          if (val && typeof val === 'object' && 'hue' in val) {
            const entry = val as { hue: number; touchedAt: string };
            hues[id] = entry.hue;
            timestamps[id] = entry.touchedAt;
          } else {
            // Fallback: altes Format (nur Zahl)
            hues[id] = val as number;
          }
        }
        set({ feedbackHues: hues, feedbackTimestamps: timestamps });
      }
    } catch {}
  },

  resetForNewCycle: () =>
    set({ phase: 'galaxy', currentPoem: null }),
}));
