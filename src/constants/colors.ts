export const colors = {
  primary: "#00A896", // Modern Teal
  primaryDark: "#008C7D",
  primaryLight: "#E0F7FA",

  background: "#F5F7FA",
  surface: "#FFFFFF",

  text: {
    primary: "#111827",
    secondary: "#4B5563",
    tertiary: "#9CA3AF",
    inverse: "#FFFFFF",
  },

  status: {
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#3B82F6",
  },

  border: "#E5E7EB",

  // Card Gradients (start/end colors)
  gradients: {
    bluePurple: ["#4F46E5", "#7C3AED"],
    greenBlue: ["#10B981", "#3B82F6"],
    orangePink: ["#F59E0B", "#EC4899"],
    tealCyan: ["#0D9488", "#06B6D4"],
  },
};

export const darkColors = {
  primary: "#00A896", // Keep same primary or adjust slightly
  primaryDark: "#008C7D",
  primaryLight: "#1F2937", // Darker background for primary light areas

  background: "#111827", // Very dark grey/black
  surface: "#1F2937", // Dark grey

  text: {
    primary: "#F9FAFB", // White-ish
    secondary: "#D1D5DB", // Light grey
    tertiary: "#9CA3AF", // Grey
    inverse: "#111827", // Dark text for light backgrounds
  },

  status: {
    success: "#34D399",
    warning: "#FBBF24",
    danger: "#F87171",
    info: "#60A5FA",
  },

  border: "#374151",

  gradients: colors.gradients,
};
