/**
 * Entre Dos — Design Tokens
 * Single source of truth for all colors.
 * Mirrors CSS variables defined in landing/src/layouts/Layout.astro.
 */

const shared = {
  // ─── Rarity ──────────────────────────────────────────────────
  comun: '#e2e8f0', // Common   — light slate
  rara: '#38bdf8', // Rare     — sky blue
  epica: '#a855f7', // Epic     — purple
  legendaria: '#f59e0b', // Legendary — amber
  pasion: '#ff3b5c', // Passion  — hot pink/red

  // ─── Text on rarity cards ────────────────────────────────────
  onComun: '#0f1115',
  onRara: '#0f1115',
  onEpica: '#ffffff',
  onLegendaria: '#451a03',
  onPasion: '#ffffff',

  // ─── Accent / CTA ────────────────────────────────────────────
  accent: '#FF3B5C', // Primary CTA — matches landing hero button

  // ─── Glow shadows (for Reanimated shadow props) ──────────────
  glowComun: 'rgba(226, 232, 240, 0.25)',
  glowRara: 'rgba(56,  189, 248, 0.45)',
  glowEpica: 'rgba(168,  85, 247, 0.50)',
  glowLegendaria: 'rgba(245, 158,  11, 0.50)',
  glowPasion: 'rgba(255,  59,  92, 0.50)',
} as const;

export const darkColors = {
  ...shared,

  // ─── Backgrounds ─────────────────────────────────────────────
  background: '#0a0c10', // --obsidian
  surface: '#121418', // card backs, modals, bottom sheets
  surfaceAlt: '#1a1d24', // slightly lighter surface for layering

  // ─── Text ────────────────────────────────────────────────────
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  textMuted: 'rgba(255, 255, 255, 0.4)',

  // ─── Borders / Overlays ──────────────────────────────────────
  border: 'rgba(255, 255, 255, 0.05)',
  borderSubtle: 'rgba(255, 255, 255, 0.03)',
  glare: 'rgba(255, 255, 255, 0.15)',
} as const;

export const lightColors = {
  ...shared,

  // ─── Backgrounds ─────────────────────────────────────────────
  background: '#f7f7f5',
  surface: '#ffffff',
  surfaceAlt: '#f0efec',

  // ─── Text ────────────────────────────────────────────────────
  textPrimary: '#0f1115',
  textSecondary: 'rgba(15, 17, 21, 0.6)',
  textMuted: 'rgba(15, 17, 21, 0.4)',

  // ─── Borders / Overlays ──────────────────────────────────────
  border: 'rgba(15, 17, 21, 0.1)',
  borderSubtle: 'rgba(15, 17, 21, 0.05)',
  glare: 'rgba(255, 255, 255, 0.3)',
} as const;

export type ThemeColors = typeof darkColors;

/** Default export kept for convenience — always the dark palette */
export const Colors = darkColors;

export type RarityKey = 'comun' | 'rara' | 'epica' | 'legendaria' | 'pasion';

/** Maps a rarity key to its card background color */
export const rarityColor: Record<RarityKey, string> = {
  comun: shared.comun,
  rara: shared.rara,
  epica: shared.epica,
  legendaria: shared.legendaria,
  pasion: shared.pasion,
};

/** Maps a rarity key to its foreground text color */
export const rarityTextColor: Record<RarityKey, string> = {
  comun: shared.onComun,
  rara: shared.onRara,
  epica: shared.onEpica,
  legendaria: shared.onLegendaria,
  pasion: shared.onPasion,
};

/** Maps a rarity key to its glow shadow color */
export const rarityGlow: Record<RarityKey, string> = {
  comun: shared.glowComun,
  rara: shared.glowRara,
  epica: shared.glowEpica,
  legendaria: shared.glowLegendaria,
  pasion: shared.glowPasion,
};
