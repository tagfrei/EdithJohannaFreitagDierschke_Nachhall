// Gedicht-Datenbank: laedt und typisiert die extrahierten Gedichte
import type { Poem } from './types';
import poemsData from '@/data/poems.json';

export const poems: Poem[] = (poemsData as Record<string, unknown>[]).map((p) => ({
  id: p.id as string,
  title: (p.title as string) || null,
  body: p.body as string,
  author: p.author as string,
  date: (p.date as string) || null,
  warmth: p.warmth as number,
  lightness: p.lightness as number,
  energy: p.energy as number,
  intensity: p.intensity as number,
  tags_mood: (p.tags_mood as string[]) || [],
  tags_theme: (p.tags_theme as string[]) || [],
  color_hue: (p.color_hue as number) ?? 180,
  color_sat: (p.color_sat as number) ?? 50,
  color_light: (p.color_light as number) ?? 50,
  line_count: (p.line_count as number) ?? 10,
}));
