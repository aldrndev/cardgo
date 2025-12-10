import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, Theme } from "../context/ThemeContext";
import { usePremium } from "../context/PremiumContext";
import { PRICING, SubscriptionType } from "../constants/premiumConfig";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/types";
import { useNavigation } from "@react-navigation/native";
import { moderateScale, scale, verticalScale } from "../utils/responsive";

type PaywallScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Paywall"
>;

interface PricingCardProps {
  title: string;
  price: string;
  period: string;
  savings?: string;
  isPopular?: boolean;
  onSelect: () => void;
  theme: Theme;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  period,
  savings,
  isPopular,
  onSelect,
  theme,
}) => {
  const styles = getStyles(theme);

  return (
    <TouchableOpacity
      style={[styles.pricingCard, isPopular && styles.popularCard]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      {isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>TERPOPULER</Text>
        </View>
      )}
      <Text style={[styles.pricingTitle, isPopular && styles.popularText]}>
        {title}
      </Text>
      <Text style={[styles.pricingPrice, isPopular && styles.popularText]}>
        {price}
      </Text>
      <Text style={[styles.pricingPeriod, isPopular && styles.popularPeriod]}>
        {period}
      </Text>
      {savings && <Text style={styles.savingsText}>{savings}</Text>}
    </TouchableOpacity>
  );
};

export const PaywallScreen: React.FC = () => {
  const { theme } = useTheme();
  const { setPremiumStatus, isPremium, clearPremiumStatus } = usePremium();
  const navigation = useNavigation<PaywallScreenNavigationProp>();
  const styles = getStyles(theme);

  // Dev mode: tap hero icon 5 times to unlock
  const [devTapCount, setDevTapCount] = useState(0);
  const DEV_TAP_THRESHOLD = 5;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDevTap = () => {
    const newCount = devTapCount + 1;
    setDevTapCount(newCount);

    if (newCount >= DEV_TAP_THRESHOLD) {
      setDevTapCount(0);

      if (isPremium) {
        // Already premium - ask to reset
        Alert.alert("🔧 Dev Mode", "Kamu sudah Premium. Reset ke Free?", [
          { text: "Batal", style: "cancel" },
          {
            text: "Reset",
            style: "destructive",
            onPress: async () => {
              await clearPremiumStatus();
              Alert.alert("✅ Reset", "Status kembali ke Free tier.");
            },
          },
        ]);
      } else {
        // Not premium - offer to activate
        Alert.alert("🔧 Dev Mode", "Pilih paket untuk testing:", [
          { text: "Batal", style: "cancel" },
          {
            text: "Monthly",
            onPress: async () => {
              await setPremiumStatus("monthly", getExpiryDate(30));
              Alert.alert("✅ Activated", "Premium Monthly aktif (30 hari)");
              navigation.goBack();
            },
          },
          {
            text: "Lifetime",
            onPress: async () => {
              await setPremiumStatus("lifetime");
              Alert.alert("✅ Activated", "Premium Lifetime aktif!");
              navigation.goBack();
            },
          },
        ]);
      }
    }
  };

  const getExpiryDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  };

  const handleSelectPlan = async (type: SubscriptionType) => {
    // Show info that this requires Google Play integration
    Alert.alert(
      "Google Play Billing",
      "Pembayaran akan diproses melalui Google Play Store.\n\n" +
        "💡 Untuk testing, tap icon diamond 5x untuk aktifkan dev mode.",
      [{ text: "OK" }]
    );
  };

  const handleRestorePurchases = async () => {
    Alert.alert(
      "Restore Purchases",
      "Fitur ini akan mengecek pembelian sebelumnya dari Google Play.\n\n" +
        "💡 Untuk testing, tap icon diamond 5x.",
      [{ text: "OK" }]
    );
  };

  const features = [
    { icon: "infinite", text: "Unlimited kartu kredit" },
    { icon: "notifications", text: "Semua jenis notifikasi" },
    { icon: "document-text", text: "Export PDF & CSV" },
    { icon: "cloud-upload", text: "Backup & Restore" },
    { icon: "bar-chart", text: "Advanced Insights" },
    { icon: "color-palette", text: "Custom Themes" },
    { icon: "pie-chart", text: "Category Budget" },
    { icon: "ban", text: "Tanpa iklan" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="close"
            size={moderateScale(24)}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrade ke Premium</Text>
        <View style={{ width: moderateScale(40) }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero - Tap 5x for dev mode */}
        <View style={styles.heroSection}>
          <TouchableOpacity
            style={styles.heroIcon}
            onPress={handleDevTap}
            activeOpacity={0.8}
          >
            <Ionicons
              name="diamond"
              size={moderateScale(48)}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Card Go Premium</Text>
          <Text style={styles.heroSubtitle}>
            Unlock semua fitur untuk tracking kartu kredit yang lebih powerful
          </Text>
          {devTapCount > 0 && devTapCount < DEV_TAP_THRESHOLD && (
            <Text style={styles.devHint}>
              {DEV_TAP_THRESHOLD - devTapCount} tap lagi...
            </Text>
          )}
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons
                  name={feature.icon as any}
                  size={moderateScale(20)}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>

        {/* Pricing Cards */}
        <View style={styles.pricingSection}>
          <PricingCard
            title="Bulanan"
            price={formatCurrency(PRICING.MONTHLY)}
            period="per bulan"
            onSelect={() => handleSelectPlan("monthly")}
            theme={theme}
          />

          <PricingCard
            title="Tahunan"
            price={formatCurrency(PRICING.YEARLY)}
            period="per tahun"
            savings="Hemat Rp 60.000"
            isPopular
            onSelect={() => handleSelectPlan("yearly")}
            theme={theme}
          />

          <PricingCard
            title="Lifetime"
            price={formatCurrency(PRICING.LIFETIME)}
            period="sekali bayar"
            savings="Akses selamanya!"
            onSelect={() => handleSelectPlan("lifetime")}
            theme={theme}
          />
        </View>

        {/* Subscription Note */}
        <Text style={styles.subscriptionNote}>
          Langganan bulanan & tahunan termasuk 14 hari free trial.{"\n"}
          Anda dapat membatalkan kapan saja.
        </Text>

        {/* Restore Purchases */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
        >
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: scale(16),
      paddingVertical: verticalScale(12),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    closeButton: {
      width: moderateScale(40),
      height: moderateScale(40),
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: moderateScale(18),
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: scale(24),
    },
    heroSection: {
      alignItems: "center",
      marginBottom: verticalScale(32),
    },
    heroIcon: {
      width: moderateScale(88),
      height: moderateScale(88),
      borderRadius: moderateScale(44),
      backgroundColor: theme.colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: verticalScale(16),
    },
    heroTitle: {
      fontSize: moderateScale(26),
      fontWeight: "700",
      color: theme.colors.text.primary,
      marginBottom: verticalScale(8),
    },
    heroSubtitle: {
      fontSize: moderateScale(14),
      color: theme.colors.text.secondary,
      textAlign: "center",
      lineHeight: moderateScale(20),
    },
    devHint: {
      marginTop: verticalScale(8),
      fontSize: moderateScale(12),
      color: theme.colors.text.tertiary,
      fontStyle: "italic",
    },
    featuresSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: moderateScale(16),
      padding: scale(16),
      marginBottom: verticalScale(24),
    },
    featureItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: verticalScale(12),
    },
    featureIconContainer: {
      width: moderateScale(32),
      height: moderateScale(32),
      borderRadius: moderateScale(8),
      backgroundColor: theme.colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
      marginRight: scale(12),
    },
    featureText: {
      fontSize: moderateScale(14),
      color: theme.colors.text.primary,
    },
    pricingSection: {
      marginBottom: verticalScale(16),
    },
    pricingCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: moderateScale(16),
      padding: scale(20),
      marginBottom: verticalScale(12),
      borderWidth: 2,
      borderColor: "transparent",
    },
    popularCard: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    popularBadge: {
      position: "absolute",
      top: -verticalScale(10),
      right: scale(16),
      backgroundColor: theme.colors.success,
      paddingHorizontal: scale(10),
      paddingVertical: verticalScale(4),
      borderRadius: moderateScale(10),
    },
    popularBadgeText: {
      color: "#FFF",
      fontSize: moderateScale(10),
      fontWeight: "700",
    },
    pricingTitle: {
      fontSize: moderateScale(16),
      fontWeight: "600",
      color: theme.colors.text.primary,
      marginBottom: verticalScale(4),
    },
    pricingPrice: {
      fontSize: moderateScale(24),
      fontWeight: "700",
      color: theme.colors.text.primary,
    },
    pricingPeriod: {
      fontSize: moderateScale(13),
      color: theme.colors.text.secondary,
    },
    popularText: {
      color: "#FFF",
    },
    popularPeriod: {
      color: "rgba(255,255,255,0.8)",
    },
    savingsText: {
      fontSize: moderateScale(12),
      color: theme.colors.success,
      marginTop: verticalScale(4),
      fontWeight: "500",
    },
    subscriptionNote: {
      fontSize: moderateScale(12),
      color: theme.colors.text.secondary,
      textAlign: "center",
      lineHeight: moderateScale(18),
      marginBottom: verticalScale(16),
    },
    restoreButton: {
      alignItems: "center",
      paddingVertical: verticalScale(12),
    },
    restoreButtonText: {
      fontSize: moderateScale(14),
      color: theme.colors.primary,
    },
  });

export default PaywallScreen;
