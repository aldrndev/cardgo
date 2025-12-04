import React, { useEffect, useState } from "react";
import { NotificationService } from "./src/services/NotificationService";
import { BiometricService } from "./src/services/BiometricService";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { CardsProvider } from "./src/context/CardsContext";
import { LimitIncreaseProvider } from "./src/context/LimitIncreaseContext";
import { registerForPushNotificationsAsync } from "./src/utils/notifications";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { LockScreen } from "./src/screens/LockScreen";
import { View, StyleSheet, Text } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { isWeb } from "./src/utils/platform";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const AppContent = () => {
  const { isLocked, isAuthenticated } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      {isLocked && (
        <View style={StyleSheet.absoluteFill}>
          <LockScreen />
        </View>
      )}
    </View>
  );
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Check biometric (skip on web)
        if (!isWeb) {
          const biometricEnabled = await BiometricService.isEnabled();
          if (biometricEnabled) {
            const success = await BiometricService.authenticate();
            if (!success) {
              // Handle biometric failure if needed
            }
          }
        }
      } catch (e) {
        console.warn("Error initializing app:", e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    };

    // Safety timeout to ensure app loads even if something hangs
    const timeout = setTimeout(() => {
      setAppIsReady(true);
      SplashScreen.hideAsync();
    }, 5000);

    initApp().then(() => clearTimeout(timeout));
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <CardsProvider>
      <LimitIncreaseProvider>
        <AuthProvider>
          <SafeAreaProvider>
            <AppContent />
          </SafeAreaProvider>
        </AuthProvider>
      </LimitIncreaseProvider>
    </CardsProvider>
  );
}
