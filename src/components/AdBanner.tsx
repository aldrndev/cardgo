/**
 * AdBanner Component
 *
 * A wrapper component for displaying banner ads.
 * Only shows ads for free tier users when ads are enabled.
 */

import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { MONETIZATION_CONFIG, getAdUnitId } from "../config/monetization";
import { usePremium } from "../context/PremiumContext";
import { moderateScale } from "../utils/responsive";

interface AdBannerProps {
  // Optional style overrides
  containerStyle?: object;
}

export const AdBanner: React.FC<AdBannerProps> = ({ containerStyle }) => {
  const { isPremium } = usePremium();

  // Don't show ads if:
  // 1. Ads are disabled
  // 2. User is premium
  if (!MONETIZATION_CONFIG.ENABLE_ADS || isPremium) {
    return null;
  }

  const adUnitId = getAdUnitId("banner");

  // TODO: Uncomment when react-native-google-mobile-ads is installed
  /*
  const { BannerAd, BannerAdSize } = require('react-native-google-mobile-ads');
  
  return (
    <View style={[styles.container, containerStyle]}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => console.log('[AdBanner] Loaded')}
        onAdFailedToLoad={(error) => console.log('[AdBanner] Failed:', error)}
      />
    </View>
  );
  */

  // Placeholder banner for development
  if (__DEV__) {
    return (
      <View style={[styles.container, styles.placeholder, containerStyle]}>
        <View style={styles.placeholderInner}>
          {/* Placeholder text would go here but we keep it minimal */}
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  placeholder: {
    height: moderateScale(50),
    backgroundColor: "#f0f0f0",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  placeholderInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AdBanner;
