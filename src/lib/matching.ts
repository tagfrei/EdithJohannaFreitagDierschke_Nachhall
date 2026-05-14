import type { MoodVector } from './types';

export function deriveMoodProfile(mood: MoodVector) {
  const warm = mood.warmth > 0.5;
  const bright = mood.lightness > 0.5;
  if (warm && bright) return { label: 'Leichtigkeit', sublabel: 'hell und warm' };
  if (warm && !bright) return { label: 'Geborgenheit', sublabel: 'warm und still' };
  if (!warm && bright) return { label: 'Klarheit', sublabel: 'kuhl und hell' };
  return { label: 'Tiefe', sublabel: 'still und dunkel' };
}
