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

  feedbackHues: Record<string, number>;
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

  feedbackHues: {},
  setFeedbackHue: (poemId, hue) => {
    set((state) => ({
      feedbackHues: { ...state.feedbackHues, [poemId]: hue },
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
      const hues = await res.json();
      if (hues && typeof hues === 'object') {
        set({ feedbackHues: hues });
      }
    } catch {}
  },

  resetForNewCycle: () =>
    set({ phase: 'galaxy', currentPoem: null }),
}));
