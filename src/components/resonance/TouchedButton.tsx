'use client';

import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';

/**
 * Touched-Button mit Pastell-/Schmutztöne-Farbselektor.
 *
 * Der Selektor zeigt ein 2D-Feld:
 * - Horizontal: Hue (Farbton)
 * - Vertikal: oben = hell/pastell, unten = gedeckt/schmutzig
 *
 * Alle Farben sind bewusst entsaettigt und weich.
 */

// Vorgefertigte Farben: 13 Spalten (12 Hue + Grau/Weiss), 5 Reihen
const PALETTE_COLS = 13; // 12 Hue-Schritte + 1 Grau/Weiss-Spalte
const PALETTE_ROWS = 5;  // Reihe 0: sehr hell/weiss, 1-4: pastell bis gedeckt

function paletteColor(col: number, row: number): { hue: number; sat: number; light: number } {
  if (col === 12) {
    // Grau/Weiss-Spalte: weiss → hellgrau → mittelgrau → dunkelgrau → anthrazit
    const lights = [97, 85, 70, 55, 40];
    return { hue: 0, sat: 0, light: lights[row] };
  }
  const hue = (col / 12) * 360;
  if (row === 0) {
    // Sehr helle Reihe — fast weiss mit Farbhauch
    return { hue, sat: 12, light: 95 };
  }
  // Reihe 1-4: pastell bis gedeckt
  const sat = 18 + (4 - row) * 5;   // 18-33%
  const light = 82 - (row - 1) * 14; // 82, 68, 54, 40
  return { hue, sat, light };
}

function paletteHsl(col: number, row: number): string {
  const { hue, sat, light } = paletteColor(col, row);
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

export function TouchedButton() {
  const currentPoem = useAppStore((s) => s.currentPoem);
  const setFeedbackHue = useAppStore((s) => s.setFeedbackHue);
  const feedbackHues = useAppStore((s) => s.feedbackHues);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<{ hue: number; sat: number; light: number } | null>(null);
  const [rippleActive, setRippleActive] = useState(false);

  const poemHue = currentPoem
    ? (feedbackHues[currentPoem.id] ?? currentPoem.color_hue)
    : 0;

  const handleTouched = useCallback(() => {
    setRippleActive(true);
    setTimeout(() => setRippleActive(false), 600);
    setIsOpen(true);
  }, []);

  const handleColorPick = useCallback((col: number, row: number) => {
    setSelectedColor(paletteColor(col, row));
  }, []);

  const handleConfirm = useCallback(() => {
    if (currentPoem && selectedColor) {
      setFeedbackHue(currentPoem.id, selectedColor.hue);
    }
    setIsOpen(false);
    setSelectedColor(null);
  }, [currentPoem, selectedColor, setFeedbackHue]);

  const activeColor = selectedColor
    ? `hsl(${selectedColor.hue}, ${selectedColor.sat}%, ${selectedColor.light}%)`
    : `hsl(${poemHue}, 25%, 65%)`;

  const activeColorDark = selectedColor
    ? `hsl(${selectedColor.hue}, ${selectedColor.sat + 5}%, ${selectedColor.light - 15}%)`
    : `hsl(${poemHue}, 20%, 45%)`;

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.button
        onClick={handleTouched}
        className="relative flex items-center gap-2.5
          font-[family-name:var(--font-ui)] text-[13px]
          transition-all duration-300
          focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
        style={{ color: isOpen ? activeColorDark : 'rgba(120,115,110,0.55)' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Dieses Gedicht hat mich beruehrt"
      >
        <span className="relative w-7 h-7 rounded-full border flex items-center justify-center"
          style={{
            borderColor: isOpen ? activeColor : 'rgba(160,155,150,0.3)',
            background: isOpen ? `${activeColor}30` : 'transparent',
          }}>
          <span className="w-2.5 h-2.5 rounded-full transition-colors duration-300"
            style={{ background: isOpen ? activeColor : 'rgba(160,155,150,0.25)' }}
          />
          <AnimatePresence>
            {rippleActive && (
              <>
                <motion.span
                  className="absolute inset-0 rounded-full"
                  style={{ border: `2px solid ${activeColor}` }}
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
                <motion.span
                  className="absolute inset-0 rounded-full"
                  style={{ border: `1.5px solid ${activeColor}` }}
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: 3.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                />
              </>
            )}
          </AnimatePresence>
        </span>
        touched
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col items-center gap-3 overflow-hidden"
          >
            <p className="font-[family-name:var(--font-ui)] text-[10px]"
              style={{ color: 'rgba(120,115,110,0.4)' }}>
              faerbe deine Resonanz
            </p>

            {/* Pastell-/Schmutztöne-Raster */}
            <div className="flex flex-col gap-1">
              {Array.from({ length: PALETTE_ROWS }, (_, row) => (
                <div key={row} className="flex gap-1">
                  {Array.from({ length: PALETTE_COLS }, (_, col) => {
                    const c = paletteColor(col, row);
                    const isSelected = selectedColor
                      && Math.abs(selectedColor.hue - c.hue) < 15
                      && selectedColor.light === c.light;
                    return (
                      <button
                        key={col}
                        onClick={() => handleColorPick(col, row)}
                        className="rounded-full transition-transform duration-150
                          hover:scale-125 focus:outline-none focus-visible:ring-1 focus-visible:ring-black/20"
                        style={{
                          width: '18px',
                          height: '18px',
                          background: paletteHsl(col, row),
                          boxShadow: isSelected
                            ? `0 0 0 2px #faf9f7, 0 0 0 3.5px ${activeColorDark}`
                            : 'inset 0 0 0 0.5px rgba(0,0,0,0.06)',
                          transform: isSelected ? 'scale(1.3)' : undefined,
                        }}
                        aria-label={`Farbton ${Math.round(c.hue)}, ${row === 0 ? 'pastell' : row === 3 ? 'gedeckt' : 'mittel'}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Zeilen-Labels */}
            <div className="flex justify-between w-full px-1">
              <span className="font-[family-name:var(--font-ui)] text-[8px]"
                style={{ color: 'rgba(140,135,130,0.3)' }}>hell</span>
              <span className="font-[family-name:var(--font-ui)] text-[8px]"
                style={{ color: 'rgba(140,135,130,0.3)' }}>gedeckt</span>
            </div>

            {/* Bestaetigen */}
            {selectedColor && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleConfirm}
                className="font-[family-name:var(--font-ui)] text-[11px] px-5 py-1.5 rounded-full
                  transition-all duration-300"
                style={{
                  color: activeColorDark,
                  border: `1px solid ${activeColor}`,
                  background: `${activeColor}15`,
                }}
                whileHover={{ scale: 1.05 }}
              >
                so fuehlt es sich an
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
