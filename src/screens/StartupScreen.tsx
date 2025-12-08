import React, { useEffect, useMemo } from "react";
import { View, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/types";
import { storage } from "../utils/storage";
import { useTheme, Theme } from "../context/ThemeContext";

type StartupScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Onboarding"
>;

export const StartupScreen = () => {
  const navigation = useNavigation<StartupScreenNavigationProp>();
  const { theme, isDark } = useTheme();

  // Dynamic styles based on theme
  const styles = useMemo(() => getStyles(theme), [theme]);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const hasSeen = await storage.getHasSeenOnboarding();
        if (hasSeen) {
          navigation.replace("Main");
        } else {
          navigation.replace("Onboarding");
        }
      } catch (error) {
        console.error("Error checking onboarding:", error);
        // Default to onboarding on error
        navigation.replace("Onboarding");
      }
    };

    // Small delay to ensure navigation is ready
    const timer = setTimeout(checkOnboarding, 100);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.background,
    },
  });
