import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";

export const AboutScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Tentang Card Go</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* App Info */}
        <View style={styles.appInfoCard}>
          <Text style={styles.appIcon}>💳</Text>
          <Text style={styles.appName}>Card Go</Text>
          <Text style={styles.appVersion}>Versi 1.0.0</Text>
          <Text style={styles.description}>
            Aplikasi pelacak kartu kredit yang aman dan offline-first untuk
            memantau limit, tagihan, dan jatuh tempo.
          </Text>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="shield-checkmark"
              size={20}
              color={theme.colors.status.success}
            />
            <Text style={styles.sectionTitle}>Kebijakan Privasi</Text>
          </View>
          <Text style={styles.text}>
            Card Go adalah aplikasi offline-first. Semua data kamu tersimpan
            secara lokal di perangkatmu menggunakan mekanisme penyimpanan yang
            aman.
          </Text>
          <Text style={styles.text}>
            Kami tidak mengumpulkan, mengirimkan, atau menyimpan informasi
            pribadi atau keuangan kamu di server eksternal.
          </Text>
          <View style={styles.warningBox}>
            <Ionicons
              name="warning"
              size={18}
              color={theme.colors.status.warning}
            />
            <Text style={styles.warningText}>
              Kami tidak meminta atau menyimpan informasi sensitif seperti nomor
              kartu kredit lengkap, CVV, atau PIN.
            </Text>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Fitur Utama</Text>
          </View>
          <View style={styles.featureList}>
            <FeatureItem icon="card" text="Kelola multiple kartu kredit" />
            <FeatureItem icon="calendar" text="Pantau jatuh tempo & billing" />
            <FeatureItem icon="notifications" text="Pengingat pembayaran" />
            <FeatureItem icon="trending-up" text="Tracking kenaikan limit" />
            <FeatureItem icon="repeat" text="Kelola langganan otomatis" />
            <FeatureItem icon="download" text="Backup & Export data" />
          </View>
        </View>

        {/* Disclaimer Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="information-circle"
              size={20}
              color={theme.colors.text.tertiary}
            />
            <Text style={styles.sectionTitle}>Disclaimer</Text>
          </View>
          <Text style={styles.disclaimerText}>
            Aplikasi ini adalah alat pelacak dan tidak berafiliasi dengan bank
            atau lembaga keuangan mana pun. Informasi yang disediakan hanya
            untuk tujuan pelacakan pribadi. Selalu merujuk pada laporan bank
            resmi untuk informasi tagihan yang akurat.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ for Better Finance</Text>
          <Text style={styles.copyright}>© 2025 Card Go</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const FeatureItem = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.featureItem}>
    <Ionicons name={icon as any} size={18} color={theme.colors.primary} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: theme.spacing.m,
    paddingBottom: theme.spacing.xl,
  },
  appInfoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.xl,
    alignItems: "center",
    marginBottom: theme.spacing.m,
    ...theme.shadows.small,
  },
  appIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.s,
  },
  appName: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  appVersion: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.m,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.m,
    ...theme.shadows.small,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.m,
    gap: theme.spacing.s,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  text: {
    ...theme.typography.body,
    marginBottom: theme.spacing.m,
    lineHeight: 22,
    color: theme.colors.text.secondary,
  },
  warningBox: {
    flexDirection: "row",
    backgroundColor: theme.colors.status.warning + "15",
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    gap: theme.spacing.s,
  },
  warningText: {
    ...theme.typography.caption,
    color: theme.colors.status.warning,
    flex: 1,
    lineHeight: 18,
  },
  featureList: {
    gap: theme.spacing.s,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.m,
    paddingVertical: theme.spacing.xs,
  },
  featureText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  disclaimerText: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    fontStyle: "italic",
    lineHeight: 18,
  },
  footer: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
  },
  footerText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  copyright: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
  },
});
