/**
 * Silk Value — Design Tokens (v1.1)
 * Single source of truth for the entire app palette and spacing.
 * Import as: import { DT } from '@/constants/designTokens';
 */

export const DT = {
  // ─── Palette ────────────────────────────────────────────────────────────────
  colors: {
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceAlt: '#F5F5F5',

    black: '#000000',
    white: '#FFFFFF',

    textPrimary: '#111111',
    textSecondary: '#666666',
    textMuted: '#999999',

    border: '#E5E5E5',
    borderStrong: '#CCCCCC',

    // Accent — use ONLY for small status indicators, badges, dots
    green: '#22C55E',
    greenBg: '#DCFCE7',
    greenText: '#15803D',

    red: '#EF4444',
    redBg: '#FEE2E2',
    redText: '#B91C1C',

    amber: '#F59E0B',
    amberBg: '#FEF3C7',
    amberText: '#B45309',

    blue: '#3B82F6',
    blueBg: '#DBEAFE',
    blueText: '#1D4ED8',
  },

  // ─── Typography ─────────────────────────────────────────────────────────────
  type: {
    // weights
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,

    // sizes
    xs: 10,
    sm: 11,
    base: 13,
    md: 14,
    lg: 15,
    xl: 16,
    '2xl': 18,
    '3xl': 20,
    '4xl': 22,
    '5xl': 26,
    '6xl': 32,
  },

  // ─── Spacing ─────────────────────────────────────────────────────────────────
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
  },

  // ─── Radii ───────────────────────────────────────────────────────────────────
  radius: {
    sm: 4,
    md: 8,
    lg: 10,
    xl: 12,
    full: 9999,
  },

  // ─── Misc ────────────────────────────────────────────────────────────────────
  tabBarHeight: 56,
  headerHeight: 52,
} as const;

// Convenience re-exports
export const C = DT.colors;
export const T = DT.type;
export const S = DT.space;
export const R = DT.radius;
