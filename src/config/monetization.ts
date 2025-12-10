/**
 * Monetization Configuration
 *
 * Toggle flags to enable/disable monetization features.
 * Set to true when app goes to production and AdMob/Billing are approved.
 */

export const MONETIZATION_CONFIG = {
  // ========== MASTER TOGGLES ==========
  // Set these to true when ready for production
  ENABLE_ADS: false,
  ENABLE_BILLING: false,

  // ========== ADMOB AD UNIT IDs ==========
  // Test IDs (Google's official test IDs - always work)
  TEST_BANNER_ID: "ca-app-pub-3940256099942544/6300978111",
  TEST_INTERSTITIAL_ID: "ca-app-pub-3940256099942544/1033173712",
  TEST_REWARDED_ID: "ca-app-pub-3940256099942544/5224354917",

  // Production IDs (replace with your real AdMob IDs)
  PROD_BANNER_ID: "ca-app-pub-XXXXX/XXXXX",
  PROD_INTERSTITIAL_ID: "ca-app-pub-XXXXX/XXXXX",
  PROD_REWARDED_ID: "ca-app-pub-XXXXX/XXXXX",

  // Use test IDs in development
  USE_TEST_ADS: __DEV__,

  // ========== BILLING SKUs ==========
  // These must match your Google Play Console in-app products
  SKU_MONTHLY: "premium_monthly",
  SKU_YEARLY: "premium_yearly",
  SKU_LIFETIME: "premium_lifetime",

  // ========== AD PLACEMENT CONFIG ==========
  // Where to show banner ads (for free tier)
  SHOW_BANNER_ON_HOME: true,
  SHOW_BANNER_ON_CARDS: false,
  SHOW_BANNER_ON_CALENDAR: false,

  // Interstitial frequency (show every N screen opens)
  INTERSTITIAL_FREQUENCY: 5,
};

// Helper to get the correct ad unit ID
export const getAdUnitId = (
  type: "banner" | "interstitial" | "rewarded"
): string => {
  const config = MONETIZATION_CONFIG;
  const useTest = config.USE_TEST_ADS || !config.ENABLE_ADS;

  switch (type) {
    case "banner":
      return useTest ? config.TEST_BANNER_ID : config.PROD_BANNER_ID;
    case "interstitial":
      return useTest
        ? config.TEST_INTERSTITIAL_ID
        : config.PROD_INTERSTITIAL_ID;
    case "rewarded":
      return useTest ? config.TEST_REWARDED_ID : config.PROD_REWARDED_ID;
  }
};
