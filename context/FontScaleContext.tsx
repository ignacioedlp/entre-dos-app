import { createContext, useContext, useState } from 'react';
import { FONT_SCALES, FontScaleKey, getFontScale, setFontScale } from '@/lib/font-scale';

interface FontScaleContextValue {
  scale: FontScaleKey;
  multiplier: number;
  setScale: (key: FontScaleKey) => void;
}

const FontScaleContext = createContext<FontScaleContextValue | undefined>(undefined);

export function FontScaleProvider({ children }: { children: React.ReactNode }) {
  const [scale, setScaleState] = useState<FontScaleKey>(() => getFontScale());

  function setScale(key: FontScaleKey) {
    setFontScale(key);
    setScaleState(key);
  }

  return (
    <FontScaleContext.Provider
      value={{ scale, multiplier: FONT_SCALES[scale].multiplier, setScale }}
    >
      {children}
    </FontScaleContext.Provider>
  );
}

export function useFontScale(): FontScaleContextValue {
  const ctx = useContext(FontScaleContext);
  if (!ctx) throw new Error('useFontScale must be used within FontScaleProvider');
  return ctx;
}

export function useScaledFontSize(base: number): number {
  const { multiplier } = useFontScale();
  return Math.round(base * multiplier);
}
