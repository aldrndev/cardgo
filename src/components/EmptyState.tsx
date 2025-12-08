import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme, Theme } from "../context/ThemeContext";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/types";
import { LinearGradient } from "expo-linear-gradient";
import { scale, moderateScale, verticalScale } from "../utils/responsive";

type EmptyStateNavigationProp = StackNavigationProp<RootStackParamList>;

const FEATURES = [
  { icon: "card-outline", text: "Kelola kartu" },
  { icon: "calendar-outline", text: "Pantau jatuh tempo" },
  { icon: "shield-checkmark-outline", text: "100% offline" },
];

export const EmptyState = ({
  message = "Belum ada kartu kredit yang ditambahkan",
}: {
  message?: string;
}) => {
  const navigation = useNavigation<EmptyStateNavigationProp>();
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      {/* Decorative background elements */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />

      {/* Icon */}
      <View style={styles.iconContainer}>
        <Ionicons
          name="card"
          size={moderateScale(56)}
          color={theme.colors.primary}
        />
      </View>

      {/* Welcome Text */}
      <Text style={styles.title}>Mulai Kelola Kartu Kreditmu</Text>
      <Text style={styles.subtitle}>
        Pantau limit, tagihan, dan jatuh tempo dengan mudah
      </Text>

      {/* Features Row */}
      <View style={styles.featuresRow}>
        {FEATURES.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons
              name={feature.icon as any}
              size={moderateScale(14)}
              color={theme.colors.primary}
            />
            <Text style={styles.featureText}>{feature.text}</Text>
          </View>
        ))}
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("AddEditCard", {})}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[theme.colors.primary, "#7C3AED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          <Ionicons
            name="add-circle"
            size={moderateScale(20)}
            color={theme.colors.text.inverse}
            style={{ marginRight: scale(8) }}
          />
          <Text style={styles.buttonText}>Tambah Kartu Pertama</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Bottom hint */}
      <View style={styles.hintContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={moderateScale(12)}
          color={theme.colors.text.tertiary}
        />
        <Text style={styles.hintText}>Data tersimpan aman di perangkatmu</Text>
      </View>
    </View>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: scale(24),
      paddingTop: verticalScale(16),
      paddingBottom: verticalScale(100),
    },
    decorativeCircle1: {
      position: "absolute",
      top: verticalScale(0),
      right: scale(-30),
      width: scale(100),
      height: scale(100),
      borderRadius: scale(50),
      backgroundColor: theme.colors.primary + "10",
    },
    decorativeCircle2: {
      position: "absolute",
      bottom: verticalScale(20),
      left: scale(-20),
      width: scale(80),
      height: scale(80),
      borderRadius: scale(40),
      backgroundColor: theme.colors.primary + "08",
    },
    iconContainer: {
      width: scale(100),
      height: scale(100),
      borderRadius: scale(50),
      backgroundColor: theme.colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: verticalScale(24),
    },
    title: {
      ...theme.typography.h2,
      fontSize: moderateScale(20),
      color: theme.colors.text.primary,
      marginBottom: verticalScale(8),
      textAlign: "center",
      fontWeight: "700",
    },
    subtitle: {
      ...theme.typography.body,
      fontSize: moderateScale(14),
      textAlign: "center",
      color: theme.colors.text.secondary,
      marginBottom: verticalScale(24),
      lineHeight: moderateScale(20),
      paddingHorizontal: scale(16),
    },
    featuresRow: {
      flexDirection: "row",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: scale(8),
      marginBottom: verticalScale(24),
    },
    featureItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.primary + "10",
      paddingVertical: verticalScale(6),
      paddingHorizontal: scale(10),
      borderRadius: scale(16),
      gap: scale(4),
    },
    featureText: {
      ...theme.typography.caption,
      fontSize: moderateScale(12),
      color: theme.colors.primary,
      fontWeight: "600",
    },
    button: {
      width: "100%",
      borderRadius: scale(14),
      overflow: "hidden",
      ...theme.shadows.medium,
    },
    buttonGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: verticalScale(14),
      paddingHorizontal: scale(20),
    },
    buttonText: {
      ...theme.typography.button,
      color: "#FFFFFF",
      fontSize: moderateScale(15),
      fontWeight: "700",
    },
    hintContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: verticalScale(24),
      gap: scale(6),
    },
    hintText: {
      ...theme.typography.caption,
      fontSize: moderateScale(12),
      color: theme.colors.text.tertiary,
    },
  });
