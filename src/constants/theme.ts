import { scale, moderateScale } from "../utils/responsive";

const colors = {
  primary: "#4F46E5", // Indigo 600 - Vibrant and premium
  secondary: "#10B981", // Emerald 500 - Fresh for success/money
  background: "#F8FAFC", // Slate 50 - Clean, modern background
  surface: "#FFFFFF",
  error: "#EF4444",
  text: {
    primary: "#1E293B", // Slate 800
    secondary: "#64748B", // Slate 500
    tertiary: "#94A3B8", // Slate 400
    inverse: "#FFFFFF",
  },
  border: "#E2E8F0", // Slate 200
  success: "#10B981",
  warning: "#F59E0B",
  status: {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },
  cardGradients: [
    ["#4F46E5", "#818CF8"], // Indigo
    ["#059669", "#34D399"], // Emerald
    ["#DB2777", "#F472B6"], // Pink
    ["#7C3AED", "#A78BFA"], // Violet
    ["#2563EB", "#60A5FA"], // Blue
    ["#D97706", "#FBBF24"], // Amber
  ],
};

export const theme = {
  colors,
  spacing: {
    xs: scale(4),
    s: scale(8),
    m: scale(16),
    l: scale(24),
    xl: scale(32),
    xxl: scale(48),
  },
  borderRadius: {
    s: scale(8),
    m: scale(16),
    l: scale(24),
    xl: scale(32),
    round: 9999,
  },
  typography: {
    h1: {
      fontSize: moderateScale(28),
      fontWeight: "700" as const,
      color: colors.text.primary,
    },
    h2: {
      fontSize: moderateScale(22),
      fontWeight: "600" as const,
      color: colors.text.primary,
    },
    h3: {
      fontSize: moderateScale(18),
      fontWeight: "600" as const,
      color: colors.text.primary,
    },
    body: {
      fontSize: moderateScale(16),
      fontWeight: "400" as const,
      color: colors.text.secondary,
    },
    caption: {
      fontSize: moderateScale(12),
      fontWeight: "400" as const,
      color: colors.text.tertiary,
    },
    button: {
      fontSize: moderateScale(16),
      fontWeight: "600" as const,
      color: colors.text.inverse,
    },
  },
  shadows: {
    small: {
      shadowColor: "#64748B",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: "#64748B",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: "#64748B",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 10,
    },
  },
};
