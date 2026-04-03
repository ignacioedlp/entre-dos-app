import { createContext, useContext, useState } from 'react';
import { darkColors, lightColors, ThemeColors } from '@/constants/colors';
import { ThemeKey, getTheme, saveTheme } from '@/lib/theme';

interface ThemeContextValue {
  theme: ThemeKey;
  colors: ThemeColors;
  setTheme: (key: ThemeKey) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKey>(() => getTheme());

  function setTheme(key: ThemeKey) {
    saveTheme(key);
    setThemeState(key);
  }

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function useColors(): ThemeColors {
  return useTheme().colors;
}
