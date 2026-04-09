export const Colors = {
  primary: '#2D6A4F',       // Forest green (brand)
  primaryLight: '#52B788',
  primaryDark: '#1B4332',
  secondary: '#F4A261',     // Warm amber
  secondaryLight: '#FFBD69',
  accent: '#E76F51',        // Alert/CTA
  background: '#F8F9FA',
  surface: '#FFFFFF',
  border: '#E9ECEF',
  text: { primary: '#212529', secondary: '#6C757D', disabled: '#ADB5BD', inverse: '#FFFFFF' },
  status: { success: '#40C057', warning: '#FAB005', error: '#FA5252', info: '#339AF0' },
  grade: { A: '#2D9D78', B: '#4A90D9', C: '#F5A623', D: '#E67E22', Reject: '#E74C3C' },
  // Per-app accent strip
  apps: { reeler: '#2D6A4F', collector: '#1A535C', gate: '#4A1942' },
} as const;
