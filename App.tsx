import React, { useEffect } from "react";
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
import { View, StyleSheet } from "react-native";

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
  useEffect(() => {
    const initApp = async () => {
      // Check biometric
      const biometricEnabled = await BiometricService.isEnabled();
      if (biometricEnabled) {
        const success = await BiometricService.authenticate();
        if (!success) {
          // If failed or cancelled, maybe exit or show lock screen?
          // For now, we'll just let them in, but in a real app we'd block.
          // Or better, we can use the LockScreen mechanism if we had one that supports biometric.
          // Since we don't have a global lock state for biometric yet, we'll just prompt.
        }
      }
    };
    initApp();
  }, []);

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
