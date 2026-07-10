export const designTokens = {
  colors: {
    brand: { primary: '#007AFF', secondary: '#4CAF50', accent: '#FF9500' },
    surface: { canvas: '#1a1a1a', card: '#2a2a2a', elevated: '#404040' },
    text: { primary: '#FFFFFF', secondary: '#CCCCCC', muted: '#888888', inverse: '#000000' },
    state: { success: '#4CAF50', warning: '#FF9500', error: '#FF3B30', info: '#007AFF' },
  },
  typography: { sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, xxl: 24, display: 32 }, lineHeights: { tight: 1.2, normal: 1.5, relaxed: 1.75 } },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 4, md: 8, lg: 12, xl: 16, round: 9999 },
  shadows: { sm: 2, md: 4, lg: 8 },
  animation: { fast: 150, normal: 250, slow: 400 },
  icons: { xs: 12, sm: 16, md: 24, lg: 32 },
  breakpoints: { phone: 0, tablet: 768, desktop: 1024 },
} as const;
