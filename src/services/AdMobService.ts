/**
 * AdMob Service - Skeleton Implementation
 *
 * This service handles all AdMob ad functionality.
 * Actual ads only load when ENABLE_ADS is true.
 *
 * Dependencies to install when ready:
 * npm install react-native-google-mobile-ads
 */

import { MONETIZATION_CONFIG, getAdUnitId } from "../config/monetization";

// Types for ad events
export interface AdEventCallbacks {
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: Error) => void;
  onAdClosed?: () => void;
  onAdOpened?: () => void;
  onRewarded?: (reward: { type: string; amount: number }) => void;
}

class AdMobServiceClass {
  private isInitialized = false;
  private interstitialCounter = 0;

  /**
   * Initialize AdMob SDK
   * Call this in App.tsx on startup
   */
  async initialize(): Promise<void> {
    if (!MONETIZATION_CONFIG.ENABLE_ADS) {
      console.log("[AdMob] Ads disabled - skipping initialization");
      return;
    }

    if (this.isInitialized) {
      return;
    }

    try {
      // TODO: Uncomment when react-native-google-mobile-ads is installed
      // const { mobileAds } = require('react-native-google-mobile-ads');
      // await mobileAds().initialize();

      this.isInitialized = true;
      console.log("[AdMob] SDK initialized successfully");
    } catch (error) {
      console.error("[AdMob] Failed to initialize:", error);
    }
  }

  /**
   * Load and show an interstitial ad
   * Respects frequency capping
   */
  async showInterstitial(callbacks?: AdEventCallbacks): Promise<boolean> {
    if (!MONETIZATION_CONFIG.ENABLE_ADS) {
      console.log("[AdMob] Ads disabled - skipping interstitial");
      return false;
    }

    // Frequency capping
    this.interstitialCounter++;
    if (
      this.interstitialCounter % MONETIZATION_CONFIG.INTERSTITIAL_FREQUENCY !==
      0
    ) {
      return false;
    }

    try {
      const adUnitId = getAdUnitId("interstitial");
      console.log("[AdMob] Loading interstitial:", adUnitId);

      // TODO: Uncomment when react-native-google-mobile-ads is installed
      /*
      const { InterstitialAd, AdEventType } = require('react-native-google-mobile-ads');
      
      const interstitial = InterstitialAd.createForAdRequest(adUnitId);
      
      interstitial.addAdEventListener(AdEventType.LOADED, () => {
        callbacks?.onAdLoaded?.();
        interstitial.show();
      });
      
      interstitial.addAdEventListener(AdEventType.ERROR, (error: Error) => {
        callbacks?.onAdFailedToLoad?.(error);
      });
      
      interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        callbacks?.onAdClosed?.();
      });
      
      await interstitial.load();
      */

      return true;
    } catch (error) {
      console.error("[AdMob] Interstitial error:", error);
      callbacks?.onAdFailedToLoad?.(error as Error);
      return false;
    }
  }

  /**
   * Load and show a rewarded ad
   * Returns true if reward was granted
   */
  async showRewarded(callbacks?: AdEventCallbacks): Promise<boolean> {
    if (!MONETIZATION_CONFIG.ENABLE_ADS) {
      console.log("[AdMob] Ads disabled - skipping rewarded");
      // In dev mode, simulate reward for testing
      callbacks?.onRewarded?.({ type: "coins", amount: 1 });
      return true;
    }

    try {
      const adUnitId = getAdUnitId("rewarded");
      console.log("[AdMob] Loading rewarded:", adUnitId);

      // TODO: Uncomment when react-native-google-mobile-ads is installed
      /*
      const { RewardedAd, RewardedAdEventType } = require('react-native-google-mobile-ads');
      
      const rewarded = RewardedAd.createForAdRequest(adUnitId);
      
      return new Promise((resolve) => {
        rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
          callbacks?.onAdLoaded?.();
          rewarded.show();
        });
        
        rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
          callbacks?.onRewarded?.(reward);
          resolve(true);
        });
        
        rewarded.addAdEventListener(RewardedAdEventType.CLOSED, () => {
          callbacks?.onAdClosed?.();
          resolve(false);
        });
        
        rewarded.load();
      });
      */

      return false;
    } catch (error) {
      console.error("[AdMob] Rewarded error:", error);
      callbacks?.onAdFailedToLoad?.(error as Error);
      return false;
    }
  }

  /**
   * Get banner ad unit ID for use in AdBanner component
   */
  getBannerAdUnitId(): string {
    return getAdUnitId("banner");
  }

  /**
   * Check if ads are enabled
   */
  isEnabled(): boolean {
    return MONETIZATION_CONFIG.ENABLE_ADS;
  }

  /**
   * Check if we should show banner on a specific screen
   */
  shouldShowBannerOn(screen: "home" | "cards" | "calendar"): boolean {
    if (!MONETIZATION_CONFIG.ENABLE_ADS) return false;

    switch (screen) {
      case "home":
        return MONETIZATION_CONFIG.SHOW_BANNER_ON_HOME;
      case "cards":
        return MONETIZATION_CONFIG.SHOW_BANNER_ON_CARDS;
      case "calendar":
        return MONETIZATION_CONFIG.SHOW_BANNER_ON_CALENDAR;
      default:
        return false;
    }
  }
}

// Export singleton instance
export const AdMobService = new AdMobServiceClass();
