import { storage } from './storage';

export const THEME_KEY = 'app.theme';

export const THEMES = {
  dark: 'dark',
  light: 'light',
} as const;

export type ThemeKey = keyof typeof THEMES;

export function getTheme(): ThemeKey {
  const stored = storage.getString(THEME_KEY);
  if (stored && stored in THEMES) return stored as ThemeKey;
  return 'dark';
}

export function saveTheme(key: ThemeKey): void {
  storage.set(THEME_KEY, key);
}
