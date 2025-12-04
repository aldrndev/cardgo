import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/types";
import { storage } from "../utils/storage";
import { theme } from "../constants/theme";

type StartupScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Onboarding"
>;

export const StartupScreen = () => {
  const navigation = useNavigation<StartupScreenNavigationProp>();

  useEffect(() => {
    const checkOnboarding = async () => {
      // On web, check if we are on a public route (privacy/terms)
      if (Platform.OS === "web") {
        const path = window.location.pathname;
        if (path === "/privacy" || path === "/terms") {
          // Let the router handle it, don't redirect
          return;
        }
      }

      const hasSeen = await storage.getHasSeenOnboarding();
      if (hasSeen) {
        navigation.replace("Main");
      } else {
        navigation.replace("Onboarding");
      }
    };

    checkOnboarding();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
});
