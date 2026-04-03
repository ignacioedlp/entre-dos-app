import { storage } from './storage';

export const FONT_SCALE_KEY = 'app.fontScale';

export const FONT_SCALES = {
  small: { key: 'small', multiplier: 0.85 },
  default: { key: 'default', multiplier: 1.0 },
  large: { key: 'large', multiplier: 1.15 },
  extraLarge: { key: 'extraLarge', multiplier: 1.3 },
} as const;

export type FontScaleKey = keyof typeof FONT_SCALES;

export function getFontScale(): FontScaleKey {
  const stored = storage.getString(FONT_SCALE_KEY);
  if (stored && stored in FONT_SCALES) return stored as FontScaleKey;
  return 'default';
}

export function setFontScale(key: FontScaleKey): void {
  storage.set(FONT_SCALE_KEY, key);
}
