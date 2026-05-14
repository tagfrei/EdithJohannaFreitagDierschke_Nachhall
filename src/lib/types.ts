// Kern-Typen fuer "Ein Gedicht findet dich"

export interface Poem {
  id: string;
  title: string | null;
  body: string;
  author: string;
  date: string | null;
  warmth: number;
  lightness: number;
  energy: number;
  intensity: number;
  tags_mood: string[];
  tags_theme: string[];
  // Farb-Mapping
  color_hue: number;      // 0-360, Position im Farbkreis
  color_sat: number;       // Saettigung
  color_light: number;     // Helligkeit
  line_count: number;      // Anzahl Zeilen
  // User-Feedback (veraendert sich durch Touched)
  feedback_hue?: number;   // Verschobener Hue durch User-Resonanz
}

// App-Zustaende
export type AppPhase = 'galaxy' | 'reveal' | 'resonance';
