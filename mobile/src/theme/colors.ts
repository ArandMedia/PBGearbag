/**
 * Brand Colors Configuration
 *
 * Update these values to match pbgearbag.com branding
 * Currently using placeholder dark theme colors
 */

export const colors = {
  // Primary Brand Colors
  primary: '#007AFF',        // Main brand color - update with PBG primary
  primaryDark: '#0051D5',    // Darker shade for pressed states
  primaryLight: '#4DA2FF',   // Lighter shade for highlights

  // Secondary Colors
  secondary: '#4CAF50',      // Success/positive actions
  secondaryDark: '#388E3C',
  secondaryLight: '#81C784',

  // Accent Colors
  accent: '#FF9500',         // Highlights, CTAs
  accentDark: '#CC7700',
  accentLight: '#FFB347',

  // Background Colors
  background: {
    primary: '#1a1a1a',      // Main background
    secondary: '#2a2a2a',    // Cards, modals
    tertiary: '#333333',     // Borders, dividers
    elevated: '#404040',     // Elevated surfaces
  },

  // Text Colors
  text: {
    primary: '#FFFFFF',      // Main text
    secondary: '#CCCCCC',    // Secondary text
    tertiary: '#888888',     // Disabled, placeholder
    inverse: '#000000',      // Text on light backgrounds
  },

  // Semantic Colors
  success: '#4CAF50',        // Green for success
  warning: '#FF9500',        // Orange for warnings
  error: '#FF3B30',          // Red for errors
  info: '#007AFF',           // Blue for info

  // Marketplace Specific
  price: '#4CAF50',          // Price display
  sold: '#FF3B30',           // Sold badge
  negotiable: '#FF9500',     // Negotiable badge

  // Paintball Category Colors (optional)
  categories: {
    marker: '#007AFF',
    mask: '#FF3B30',
    tank: '#4CAF50',
    loader: '#FF9500',
    apparel: '#9C27B0',
    accessory: '#00BCD4',
    completeSetup: '#FFC107',
    paint: '#E91E63',
    parts: '#607D8B',
  },

  // UI Elements
  border: '#333333',
  divider: '#2a2a2a',
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: 'rgba(0, 0, 0, 0.3)',

  // Tab Bar
  tabBar: {
    background: '#1a1a1a',
    border: '#2a2a2a',
    active: '#007AFF',
    inactive: '#666666',
  },

  // Transparent variants
  transparent: {
    white: (opacity: number) => `rgba(255, 255, 255, ${opacity})`,
    black: (opacity: number) => `rgba(0, 0, 0, ${opacity})`,
    primary: (opacity: number) => `rgba(0, 122, 255, ${opacity})`,
  },
};

/**
 * Typography
 */
export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },

  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

/**
 * Spacing
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

/**
 * Border Radius
 */
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

/**
 * Shadows
 */
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
};

/**
 * Complete theme object
 */
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
};

export type Theme = typeof theme;
