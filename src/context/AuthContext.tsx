import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";

interface AuthContextType {
  isLocked: boolean;
  isAuthenticated: boolean;
  hasPin: boolean;
  setPin: (pin: string) => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
  authenticateWithBiometrics: () => Promise<boolean>;
  lockApp: () => void;
  removePin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PIN_STORAGE_KEY = "@card_go_pin";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [storedPin, setStoredPin] = useState<string | null>(null);

  useEffect(() => {
    checkPinStatus();
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => {
      subscription.remove();
    };
  }, []);

  const checkPinStatus = async () => {
    const pin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
    if (pin) {
      setHasPin(true);
      setStoredPin(pin);
      setIsLocked(true);
    } else {
      setHasPin(false);
      setIsAuthenticated(true);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === "background" || nextAppState === "inactive") {
      if (hasPin) {
        setIsLocked(true);
        setIsAuthenticated(false);
      }
    }
  };

  const setPin = async (pin: string) => {
    await AsyncStorage.setItem(PIN_STORAGE_KEY, pin);
    setStoredPin(pin);
    setHasPin(true);
    setIsAuthenticated(true);
  };

  const removePin = async () => {
    await AsyncStorage.removeItem(PIN_STORAGE_KEY);
    setStoredPin(null);
    setHasPin(false);
    setIsLocked(false);
    setIsAuthenticated(true);
  };

  const unlock = async (pin: string) => {
    if (pin === storedPin) {
      setIsLocked(false);
      setIsAuthenticated(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    return false;
  };

  const authenticateWithBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Card Go",
        fallbackLabel: "Use PIN",
      });

      if (result.success) {
        setIsLocked(false);
        setIsAuthenticated(true);
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        return true;
      }
    }
    return false;
  };

  const lockApp = () => {
    if (hasPin) {
      setIsLocked(true);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLocked,
        isAuthenticated,
        hasPin,
        setPin,
        unlock,
        authenticateWithBiometrics,
        lockApp,
        removePin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
