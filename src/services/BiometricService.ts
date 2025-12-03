import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

const BIOMETRIC_ENABLED_KEY = "biometric_enabled";

export const BiometricService = {
  async isSupported(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  },

  async isEnabled(): Promise<boolean> {
    const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return value === "true";
  },

  async setEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, String(enabled));
  },

  async authenticate(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return true; // Skip if no hardware

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) return true; // Skip if not enrolled

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authentikasi untuk masuk ke Card Go",
      fallbackLabel: "Gunakan PIN",
      cancelLabel: "Batal",
      disableDeviceFallback: false,
    });

    return result.success;
  },
};
