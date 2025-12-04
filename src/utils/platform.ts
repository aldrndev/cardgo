import { Platform } from "react-native";

/**
 * Platform detection utilities for handling web/native differences
 */

export const isWeb = Platform.OS === "web";
export const isNative = Platform.OS !== "web";
export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";

/**
 * Features available by platform
 */
export const platformCapabilities = {
  // Biometric authentication (fingerprint, Face ID)
  biometrics: isNative,

  // Push notifications (limited on iOS PWA)
  pushNotifications: isNative,

  // Local notifications
  localNotifications: isNative,

  // Haptic feedback
  haptics: isNative,

  // File system access (full on native, limited on web)
  fullFileAccess: isNative,

  // PIN lock (works but less secure on web - can be bypassed with refresh)
  securePinLock: isNative,

  // Background sync
  backgroundSync: isNative,

  // Unlimited local storage (web has ~50MB limit)
  unlimitedStorage: isNative,
};

/**
 * Check if running as PWA (installed to home screen)
 */
export const isPWA = (): boolean => {
  if (!isWeb) return false;

  // Check if standalone mode
  if (typeof window !== "undefined") {
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    return isStandalone;
  }
  return false;
};

/**
 * iOS Safari detection (for specific PWA limitations)
 */
export const isIOSSafari = (): boolean => {
  if (!isWeb) return false;

  if (typeof window !== "undefined" && typeof navigator !== "undefined") {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isWebkit = /WebKit/.test(ua);
    const isChrome = /CriOS/.test(ua);
    return isIOS && isWebkit && !isChrome;
  }
  return false;
};
