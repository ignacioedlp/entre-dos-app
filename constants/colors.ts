/**
 * Entre Dos — Design Tokens
 * Single source of truth for all colors.
 * Mirrors CSS variables defined in landing/src/layouts/Layout.astro.
 */

export const Colors = {
  // ─── Backgrounds ─────────────────────────────────────────────
  background: '#0a0c10', // --obsidian
  surface: '#121418', // card backs, modals, bottom sheets
  surfaceAlt: '#1a1d24', // slightly lighter surface for layering

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

  // ─── Text ────────────────────────────────────────────────────
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  textMuted: 'rgba(255, 255, 255, 0.4)',

  // ─── Borders / Overlays ──────────────────────────────────────
  border: 'rgba(255, 255, 255, 0.05)',
  borderSubtle: 'rgba(255, 255, 255, 0.03)',
  glare: 'rgba(255, 255, 255, 0.15)',

  // ─── Glow shadows (for Reanimated shadow props) ──────────────
  glowComun: 'rgba(226, 232, 240, 0.25)',
  glowRara: 'rgba(56,  189, 248, 0.45)',
  glowEpica: 'rgba(168,  85, 247, 0.50)',
  glowLegendaria: 'rgba(245, 158,  11, 0.50)',
  glowPasion: 'rgba(255,  59,  92, 0.50)',
} as const;

export type RarityKey = 'comun' | 'rara' | 'epica' | 'legendaria' | 'pasion';

/** Maps a rarity key to its card background color */
export const rarityColor: Record<RarityKey, string> = {
  comun: Colors.comun,
  rara: Colors.rara,
  epica: Colors.epica,
  legendaria: Colors.legendaria,
  pasion: Colors.pasion,
};

/** Maps a rarity key to its foreground text color */
export const rarityTextColor: Record<RarityKey, string> = {
  comun: Colors.onComun,
  rara: Colors.onRara,
  epica: Colors.onEpica,
  legendaria: Colors.onLegendaria,
  pasion: Colors.onPasion,
};

/** Maps a rarity key to its glow shadow color */
export const rarityGlow: Record<RarityKey, string> = {
  comun: Colors.glowComun,
  rara: Colors.glowRara,
  epica: Colors.glowEpica,
  legendaria: Colors.glowLegendaria,
  pasion: Colors.glowPasion,
};
