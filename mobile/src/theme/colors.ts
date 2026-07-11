/**
 * Brand Colors Configuration
 *
 * Update these values to match pbgearbag.com branding
 * PBGearbag field palette: turf, thermal lens, paint, shell, and staging-area graphite.
 */

export const colors = {
  // Primary Brand Colors
  primary: "#A8C84A",
  primaryDark: "#78952F",
  primaryLight: "#D7EFA0",

  // Secondary Colors
  secondary: "#7E9F45",
  secondaryDark: "#566E31",
  secondaryLight: "#A7BD76",

  // Accent Colors
  accent: "#E8743B",
  accentDark: "#B94B24",
  accentLight: "#F2AA83",

  // Background Colors
  background: {
    primary: "#0A0E0F",
    secondary: "#121819",
    tertiary: "#1A2223",
    elevated: "#171E1F",
  },

  // Text Colors
  text: {
    primary: "#F3F1E8",
    secondary: "#BCC2BC",
    tertiary: "#7D8783",
    inverse: "#10140D",
  },

  // Semantic Colors
  success: "#7E9F45", // Green for success
  warning: "#D39A3A", // Thermal-lens amber
  error: "#FF3B30", // Red for errors
  info: "#D39A3A",

  // Marketplace Specific
  price: "#A8C84A",
  sold: "#FF3B30", // Sold badge
  negotiable: "#FF9500", // Negotiable badge

  // Paintball Category Colors (optional)
  categories: {
    marker: "#A8C84A",
    mask: "#E8743B",
    tank: "#85939A",
    loader: "#D39A3A",
    apparel: "#7E9F45",
    accessory: "#718187",
    completeSetup: "#C7B35A",
    paint: "#D85B48",
    parts: "#66747A",
  },

  // UI Elements
  border: "#283137",
  divider: "#20282D",
  overlay: "rgba(0, 0, 0, 0.7)",
  shadow: "rgba(0, 0, 0, 0.3)",

  // Tab Bar
  tabBar: {
    background: "#101516",
    border: "#283033",
    active: "#A8C84A",
    inactive: "#77818A",
  },

  // Transparent variants
  transparent: {
    white: (opacity: number) => `rgba(255, 255, 255, ${opacity})`,
    black: (opacity: number) => `rgba(0, 0, 0, ${opacity})`,
    primary: (opacity: number) => `rgba(168, 200, 74, ${opacity})`,
  },
};

/**
 * Typography
 */
export const typography = {
  fontFamily: {
    regular: "System",
    medium: "System",
    semiBold: "System",
    bold: "System",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
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
