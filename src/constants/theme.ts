// Re-export theme from ThemeContext for backward compatibility
// Screens using `import { theme }` will get the static light theme
// For dynamic theming, screens should use `useTheme()` hook

export { theme, useTheme, ThemeProvider } from "../context/ThemeContext";
export type { Theme, ThemeMode } from "../context/ThemeContext";
