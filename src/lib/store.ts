// Globaler App-State mit Zustand
import { create } from 'zustand';
import type { Poem, AppPhase } from './types';

interface AppState {
  phase: AppPhase;
  setPhase: (phase: AppPhase) => void;

  currentPoem: Poem | null;
  setCurrentPoem: (poem: Poem | null) => void;

  // Feedback-Hues: poemId → neuer Hue
  feedbackHues: Record<string, number>;
  setFeedbackHue: (poemId: string, hue: number) => void;

  resetForNewCycle: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  phase: 'galaxy',
  setPhase: (phase) => set({ phase }),

  currentPoem: null,
  setCurrentPoem: (poem) => set({ currentPoem: poem }),

  feedbackHues: {},
  setFeedbackHue: (poemId, hue) =>
    set((state) => ({
      feedbackHues: { ...state.feedbackHues, [poemId]: hue },
    })),

  resetForNewCycle: () =>
    set({ phase: 'galaxy', currentPoem: null }),
}));
