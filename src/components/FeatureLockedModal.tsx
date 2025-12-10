import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, Theme } from "../context/ThemeContext";
import { PRICING } from "../constants/premiumConfig";
import { moderateScale, scale, verticalScale } from "../utils/responsive";

interface FeatureLockedModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  featureName?: string;
  featureDescription?: string;
}

export const FeatureLockedModal: React.FC<FeatureLockedModalProps> = ({
  visible,
  onClose,
  onUpgrade,
  featureName = "Fitur Premium",
  featureDescription = "Fitur ini hanya tersedia untuk pengguna Premium.",
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Lock Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name="lock-closed"
              size={moderateScale(48)}
              color={theme.colors.primary}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>{featureName}</Text>

          {/* Description */}
          <Text style={styles.description}>{featureDescription}</Text>

          {/* Premium Benefits */}
          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <Ionicons
                name="checkmark-circle"
                size={moderateScale(20)}
                color={theme.colors.success}
              />
              <Text style={styles.benefitText}>Unlimited kartu kredit</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons
                name="checkmark-circle"
                size={moderateScale(20)}
                color={theme.colors.success}
              />
              <Text style={styles.benefitText}>Export PDF & CSV</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons
                name="checkmark-circle"
                size={moderateScale(20)}
                color={theme.colors.success}
              />
              <Text style={styles.benefitText}>Backup & Restore</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons
                name="checkmark-circle"
                size={moderateScale(20)}
                color={theme.colors.success}
              />
              <Text style={styles.benefitText}>Tanpa iklan</Text>
            </View>
          </View>

          {/* Price hint */}
          <Text style={styles.priceHint}>
            Mulai dari {formatCurrency(PRICING.MONTHLY)}/bulan
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={onUpgrade}
              activeOpacity={0.8}
            >
              <Ionicons name="diamond" size={moderateScale(20)} color="#FFF" />
              <Text style={styles.upgradeButtonText}>Upgrade ke Premium</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>Nanti Saja</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: scale(24),
    },
    container: {
      width: "100%",
      maxWidth: moderateScale(340),
      backgroundColor: theme.colors.surface,
      borderRadius: moderateScale(24),
      padding: scale(24),
      alignItems: "center",
    },
    iconContainer: {
      width: moderateScale(88),
      height: moderateScale(88),
      borderRadius: moderateScale(44),
      backgroundColor: theme.colors.primary + "15",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: verticalScale(16),
    },
    title: {
      fontSize: moderateScale(22),
      fontWeight: "700",
      color: theme.colors.text.primary,
      marginBottom: verticalScale(8),
      textAlign: "center",
    },
    description: {
      fontSize: moderateScale(14),
      color: theme.colors.text.secondary,
      textAlign: "center",
      marginBottom: verticalScale(20),
      lineHeight: moderateScale(20),
    },
    benefitsContainer: {
      width: "100%",
      marginBottom: verticalScale(16),
    },
    benefitItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: verticalScale(10),
    },
    benefitText: {
      fontSize: moderateScale(14),
      color: theme.colors.text.primary,
      marginLeft: scale(10),
    },
    priceHint: {
      fontSize: moderateScale(13),
      color: theme.colors.text.secondary,
      marginBottom: verticalScale(20),
    },
    buttonContainer: {
      width: "100%",
    },
    upgradeButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
      paddingVertical: verticalScale(14),
      borderRadius: moderateScale(12),
      marginBottom: verticalScale(12),
    },
    upgradeButtonText: {
      color: "#FFF",
      fontSize: moderateScale(16),
      fontWeight: "600",
      marginLeft: scale(8),
    },
    closeButton: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: verticalScale(12),
    },
    closeButtonText: {
      color: theme.colors.text.secondary,
      fontSize: moderateScale(14),
    },
  });
