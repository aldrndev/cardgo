import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { scale, moderateScale } from "../utils/responsive";

const THEME_STORAGE_KEY = "@card_go_theme_mode";

// Light colors
const lightColors = {
  primary: "#4F46E5",
  secondary: "#10B981",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF", // Same as surface in light mode
  error: "#EF4444",
  text: {
    primary: "#1E293B",
    secondary: "#64748B",
    tertiary: "#94A3B8",
    inverse: "#FFFFFF",
  },
  border: "#E2E8F0",
  success: "#10B981",
  warning: "#F59E0B",
  status: {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },
  cardGradients: [
    ["#4F46E5", "#818CF8"],
    ["#059669", "#34D399"],
    ["#DB2777", "#F472B6"],
    ["#7C3AED", "#A78BFA"],
    ["#2563EB", "#60A5FA"],
    ["#D97706", "#FBBF24"],
  ],
};

// Dark colors
const darkColors = {
  primary: "#4F46E5", // Same royal purple as light mode
  secondary: "#34D399",
  background: "#0F172A",
  surface: "#1E293B",
  surfaceElevated: "#0F172A", // Darker elevated surface (same as background)
  error: "#EF4444", // Same red as light mode
  text: {
    primary: "#F1F5F9",
    secondary: "#94A3B8",
    tertiary: "#64748B",
    inverse: "#0F172A",
  },
  border: "#334155",
  success: "#34D399",
  warning: "#FBBF24",
  status: {
    success: "#34D399",
    warning: "#FBBF24",
    error: "#EF4444", // Same red as light mode
    info: "#60A5FA",
  },
  cardGradients: [
    ["#6366F1", "#A5B4FC"],
    ["#10B981", "#6EE7B7"],
    ["#EC4899", "#F9A8D4"],
    ["#8B5CF6", "#C4B5FD"],
    ["#3B82F6", "#93C5FD"],
    ["#F59E0B", "#FCD34D"],
  ],
};

// Shared theme properties
const createTheme = (colors: typeof lightColors, isDark: boolean) => ({
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
    small: isDark
      ? {
          shadowColor: "transparent",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
        }
      : {
          shadowColor: colors.text.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        },
    medium: isDark
      ? {
          shadowColor: "transparent",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
        }
      : {
          shadowColor: colors.text.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        },
    large: isDark
      ? {
          shadowColor: "transparent",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
        }
      : {
          shadowColor: colors.text.primary,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 10,
        },
  },
  iconSizes: {
    xs: scale(16),
    s: scale(20),
    m: scale(24),
    l: scale(28),
    xl: scale(32),
  },
  containerSizes: {
    iconSmall: scale(28),
    iconMedium: scale(40),
    iconLarge: scale(56),
    avatar: scale(48),
    buttonHeight: scale(48),
  },
});

export type ThemeMode = "light" | "dark" | "system";
export type Theme = ReturnType<typeof createTheme>;

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && ["light", "dark", "system"].includes(saved)) {
          setThemeModeState(saved as ThemeMode);
        }
      } catch (e) {
        console.error("Failed to load theme:", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  // Save theme preference
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.error("Failed to save theme:", e);
    }
  };

  // Determine actual dark mode
  const isDark = useMemo(() => {
    if (themeMode === "system") {
      return systemColorScheme === "dark";
    }
    return themeMode === "dark";
  }, [themeMode, systemColorScheme]);

  // Create theme object
  const theme = useMemo(() => {
    return createTheme(isDark ? darkColors : lightColors, isDark);
  }, [isDark]);

  if (!isLoaded) {
    return null; // Or loading indicator
  }

  return (
    <ThemeContext.Provider value={{ theme, themeMode, isDark, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Export static theme for backward compatibility (uses light theme)
export const theme = createTheme(lightColors, false);
