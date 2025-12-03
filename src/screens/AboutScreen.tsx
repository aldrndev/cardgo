import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../constants/theme";

export const AboutScreen = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tentang & Privasi</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.appName}>Card Go</Text>
        <Text style={styles.description}>
          Card Go membantu kamu melacak kartu kredit, siklus tagihan, dan
          tanggal jatuh tempo di satu tempat.
        </Text>

        <Text style={styles.sectionHeader}>Kebijakan Privasi</Text>
        <Text style={styles.text}>
          Card Go adalah aplikasi offline-first. Semua data kamu tersimpan
          secara lokal di perangkatmu menggunakan mekanisme penyimpanan yang
          aman.
        </Text>
        <Text style={styles.text}>
          Kami tidak mengumpulkan, mengirimkan, atau menyimpan informasi pribadi
          atau keuangan kamu di server eksternal.
        </Text>
        <Text style={styles.text}>
          Kami secara eksplisit tidak meminta atau menyimpan informasi sensitif
          seperti nomor kartu kredit lengkap, kode CVV, atau PIN. Mohon jangan
          memasukkan informasi tersebut di kolom catatan atau alias.
        </Text>

        <Text style={styles.sectionHeader}>Disclaimer</Text>
        <Text style={styles.text}>
          Aplikasi ini adalah alat pelacak dan tidak berafiliasi dengan bank
          atau lembaga keuangan mana pun. Informasi yang disediakan hanya untuk
          tujuan pelacakan pribadi. Selalu merujuk pada laporan bank resmi kamu
          untuk informasi tagihan yang akurat.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: theme.spacing.m,
  },
  backButtonText: {
    fontSize: 24,
    color: theme.colors.text.primary,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
  },
  content: {
    padding: theme.spacing.m,
  },
  section: {
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    ...theme.shadows.small,
  },
  appName: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.s,
    textAlign: "center",
  },
  version: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    textAlign: "center",
    marginBottom: theme.spacing.m,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  sectionTitle: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.m,
    color: theme.colors.text.primary,
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: theme.spacing.s,
  },
  bullet: {
    marginRight: theme.spacing.s,
    color: theme.colors.primary,
    fontSize: 18,
  },
  bulletText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    flex: 1,
    lineHeight: 22,
  },
  disclaimerText: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    fontStyle: "italic",
    lineHeight: 18,
  },
  sectionHeader: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.s,
    marginTop: theme.spacing.m,
    color: theme.colors.text.primary,
  },
  text: {
    ...theme.typography.body,
    marginBottom: theme.spacing.m,
    lineHeight: 22,
    color: theme.colors.text.secondary,
  },
});
