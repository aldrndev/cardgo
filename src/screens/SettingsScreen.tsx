import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
  Platform,
  Linking,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";
import { theme } from "../constants/theme";
import { storage } from "../utils/storage";
import { moderateScale } from "../utils/responsive";
import { useLimitIncrease } from "../context/LimitIncreaseContext";
import { isWeb, platformCapabilities } from "../utils/platform";

import { useCards } from "../context/CardsContext";
import { createBackup, restoreBackup } from "../utils/backup";
import { useAuth } from "../context/AuthContext";
import { BiometricService } from "../services/BiometricService";
import { ExportService } from "../services/ExportService";
import { NotificationService } from "../services/NotificationService";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/types";

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  isDanger?: boolean;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  color?: string;
}

const SettingsItem = ({
  icon,
  label,
  sublabel,
  onPress,
  isDanger,
  rightElement,
  showChevron = true,
  color,
}: SettingsItemProps) => {
  return (
    <TouchableOpacity
      style={styles.settingsItemContainer}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isDanger
              ? theme.colors.status.error + "15"
              : theme.colors.primary + "15",
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={moderateScale(22)}
          color={
            isDanger ? theme.colors.status.error : color || theme.colors.primary
          }
        />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemLabel, isDanger && styles.dangerText]}>
          {label}
        </Text>
        {sublabel && <Text style={styles.itemSublabel}>{sublabel}</Text>}
      </View>
      {rightElement}
      {showChevron && !rightElement && (
        <Ionicons
          name="chevron-forward"
          size={moderateScale(20)}
          color={theme.colors.text.tertiary}
        />
      )}
    </TouchableOpacity>
  );
};

export const SettingsScreen = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const {
    cards,
    transactions,
    subscriptions,
    installmentPlans,
    restoreData,
    refreshCards,
  } = useCards();
  const { getRecordsByCardId } = useLimitIncrease();
  const { hasPin, removePin, refreshBiometricStatus } = useAuth();

  const [biometricEnabled, setBiometricEnabled] = React.useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState<{
    nickname: string;
    joinDate: string;
  } | null>(null);

  const [notificationPrefs, setNotificationPrefs] = React.useState({
    payment: true,
    limitIncrease: true,
    annualFee: true,
    applicationStatus: true,
  });

  React.useEffect(() => {
    checkBiometricStatus();
    loadUserProfile();
    loadNotificationPrefs();
  }, []);

  const loadUserProfile = async () => {
    const profile = await storage.getUserProfile();
    setUserProfile(profile);
  };

  const checkBiometricStatus = async () => {
    // Biometrics not supported on web
    if (!platformCapabilities.biometrics) {
      setIsBiometricSupported(false);
      return;
    }

    const supported = await BiometricService.isSupported();
    setIsBiometricSupported(supported);
    if (supported) {
      const enabled = await BiometricService.isEnabled();
      setBiometricEnabled(enabled);
    }
  };

  const toggleBiometric = async (value: boolean) => {
    if (value) {
      const success = await BiometricService.authenticate();
      if (success) {
        await BiometricService.setEnabled(true);
        setBiometricEnabled(true);
        await refreshBiometricStatus(); // Refresh AuthContext state
      }
    } else {
      await BiometricService.setEnabled(false);
      setBiometricEnabled(false);
      await refreshBiometricStatus(); // Refresh AuthContext state
    }
  };

  const loadNotificationPrefs = async () => {
    const prefs = await storage.getNotificationPreferences();
    setNotificationPrefs(prefs);
  };

  const toggleNotificationPref = async (
    key: keyof typeof notificationPrefs,
    value: boolean
  ) => {
    const newPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(newPrefs);
    await storage.saveNotificationPreferences(newPrefs);

    // Reschedule or cancel notifications based on preference change
    // We need to wait for storage save because NotificationService reads from storage
    // But since we pass newPrefs to storage, it should be fine.
    // However, NotificationService reads from storage asynchronously.
    // To be safe, we rely on the fact that we just saved it.

    if (value) {
      // Enabled: Reschedule
      if (key === "payment") {
        for (const card of cards) {
          await NotificationService.schedulePaymentReminder(card);
        }
      } else if (key === "limitIncrease") {
        for (const card of cards) {
          await NotificationService.scheduleLimitIncreaseReminder(card);
        }
      } else if (key === "annualFee") {
        for (const card of cards) {
          await NotificationService.scheduleAnnualFeeReminder(card);
        }
      }
    } else {
      // Disabled: Cancel
      if (key === "payment") {
        for (const card of cards) {
          await NotificationService.cancelPaymentReminders(card.id);
        }
      } else if (key === "limitIncrease") {
        for (const card of cards) {
          await NotificationService.cancelLimitReminders(card.id);
        }
      } else if (key === "annualFee") {
        for (const card of cards) {
          await NotificationService.cancelAnnualFeeReminders(card.id);
        }
      }
    }
  };

  const handleRestore = async () => {
    await restoreBackup(async (data) => {
      // Restore Cards, Transactions, Subscriptions, Installment Plans
      await restoreData(
        data.cards,
        data.transactions,
        data.subscriptions || [],
        data.installmentPlans || []
      );

      // Restore Limit Increase Records
      if (data.limitIncreaseRecords && data.limitIncreaseRecords.length > 0) {
        await storage.saveLimitIncreaseRecords(data.limitIncreaseRecords);
        // We might need to refresh limit increase context too, but a simple app reload or context refresh would do.
        // Since LimitIncreaseContext loads on mount, we might need to force reload or just rely on next app start.
        // Ideally, we should expose a 'refreshRecords' method in LimitIncreaseContext.
      }

      // Restore settings if needed
      if (data.settings) {
        if (data.settings.notificationPrefs) {
          setNotificationPrefs(data.settings.notificationPrefs);
          await storage.saveNotificationPreferences(
            data.settings.notificationPrefs
          );
        }
      }
    });
  };

  const handleBackup = async () => {
    // We need to fetch all limit increase records.
    // Since we can't easily get them from hook if not exposed, let's fetch from storage directly for backup to be safe.
    const limitIncreaseRecords = await storage.getLimitIncreaseRecords();

    await createBackup(
      cards,
      transactions,
      subscriptions,
      limitIncreaseRecords,
      installmentPlans,
      {
        themeMode: "light",
        notificationsEnabled: notificationPrefs.payment, // Backward compatibility
        notificationPrefs,
      }
    );
  };

  const handleClearData = () => {
    Alert.alert(
      "Hapus Semua Data",
      "Apakah Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            await storage.clearAll();
            refreshCards();
            Alert.alert("Sukses", "Semua data berhasil dihapus");
          },
        },
      ]
    );
  };

  const handleResetOnboarding = async () => {
    await storage.setHasSeenOnboarding(false);
    Alert.alert(
      "Sukses",
      "Onboarding di-reset. Restart aplikasi atau kembali untuk melihatnya."
    );
  };

  const handleAppLock = () => {
    if (hasPin) {
      Alert.alert(
        "Hapus PIN",
        "Apakah Anda yakin ingin menghapus PIN keamanan?",
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Hapus",
            style: "destructive",
            onPress: async () => {
              await removePin();
              Alert.alert("Sukses", "PIN berhasil dihapus");
            },
          },
        ]
      );
    } else {
      navigation.navigate("SetPin");
    }
  };

  const handleExportPDF = async () => {
    try {
      await ExportService.exportToPDF(cards, transactions);
    } catch (error) {
      Alert.alert("Error", "Gagal mengekspor PDF");
    }
  };

  const handleExportCSV = async () => {
    try {
      await ExportService.exportToCSV(cards, transactions);
    } catch (error) {
      Alert.alert("Error", "Gagal mengekspor CSV");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons
              name="person"
              size={moderateScale(40)}
              color={theme.colors.primary}
            />
          </View>
          <View>
            <Text style={styles.profileName}>
              {userProfile?.nickname || "Pengguna Card Go"}
            </Text>
            <Text style={styles.profileSubtitle}>
              Member sejak{" "}
              {userProfile?.joinDate
                ? new Date(userProfile.joinDate).toLocaleDateString("id-ID", {
                    month: "long",
                    year: "numeric",
                  })
                : "2023"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Keamanan</Text>

          {isBiometricSupported && (
            <SettingsItem
              icon="scan-outline"
              label="Biometric Login"
              sublabel="Masuk dengan FaceID/TouchID"
              showChevron={false}
              rightElement={
                <Switch
                  value={biometricEnabled}
                  onValueChange={toggleBiometric}
                  trackColor={{ false: "#767577", true: theme.colors.primary }}
                  thumbColor={biometricEnabled ? "#fff" : "#f4f3f4"}
                />
              }
            />
          )}

          <SettingsItem
            icon={hasPin ? "lock-closed-outline" : "lock-open-outline"}
            label={hasPin ? "Hapus PIN Keamanan" : "Pasang PIN Keamanan"}
            sublabel={
              hasPin
                ? "Nonaktifkan kunci aplikasi"
                : "Amankan aplikasi dengan PIN"
            }
            onPress={handleAppLock}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Backup</Text>

          <SettingsItem
            icon="cloud-outline"
            label="Backup & Export"
            sublabel="Backup, restore, dan export data"
            onPress={() => navigation.navigate("BackupExport")}
          />

          <SettingsItem
            icon="archive-outline"
            label="Kartu Diarsipkan"
            sublabel="Lihat kartu yang tidak aktif"
            onPress={() => navigation.navigate("ArchivedCards")}
          />
        </View>

        {/* PWA Warning - only on web */}
        {isWeb && (
          <View style={styles.pwaWarningSection}>
            <View style={styles.pwaWarningHeader}>
              <Ionicons
                name="warning-outline"
                size={moderateScale(20)}
                color={theme.colors.status.warning}
              />
              <Text style={styles.pwaWarningTitle}>Versi Web (PWA)</Text>
            </View>
            <Text style={styles.pwaWarningText}>
              Data disimpan di browser. Jika browser data di-clear atau storage
              penuh, data bisa hilang. Backup rutin sangat disarankan.
            </Text>
            <View style={styles.pwaWarningFeatures}>
              <View style={styles.pwaFeatureRow}>
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color={theme.colors.status.warning}
                />
                <Text style={styles.pwaFeatureText}>
                  Notifikasi manual via Home Screen
                </Text>
              </View>
              <View style={styles.pwaFeatureRow}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={theme.colors.status.error}
                />
                <Text style={styles.pwaFeatureText}>
                  Biometrik tidak tersedia
                </Text>
              </View>
              <View style={styles.pwaFeatureRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={theme.colors.status.success}
                />
                <Text style={styles.pwaFeatureText}>
                  Backup & Restore tersedia
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.pwaBackupButton}
              onPress={() => navigation.navigate("BackupExport")}
            >
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
              <Text style={styles.pwaBackupButtonText}>Backup Sekarang</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Notifications - only on native platforms */}
        {platformCapabilities.localNotifications && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferensi Notifikasi</Text>
            <SettingsItem
              icon="notifications-outline"
              label="Tagihan Jatuh Tempo"
              sublabel="Ingatkan sebelum tanggal jatuh tempo"
              showChevron={false}
              rightElement={
                <Switch
                  value={notificationPrefs.payment}
                  onValueChange={(val) =>
                    toggleNotificationPref("payment", val)
                  }
                  trackColor={{ false: "#767577", true: theme.colors.primary }}
                  thumbColor={notificationPrefs.payment ? "#fff" : "#f4f3f4"}
                />
              }
            />
            <SettingsItem
              icon="trending-up-outline"
              label="Kenaikan Limit"
              sublabel="Ingatkan jadwal kenaikan limit"
              showChevron={false}
              rightElement={
                <Switch
                  value={notificationPrefs.limitIncrease}
                  onValueChange={(val) =>
                    toggleNotificationPref("limitIncrease", val)
                  }
                  trackColor={{ false: "#767577", true: theme.colors.primary }}
                  thumbColor={
                    notificationPrefs.limitIncrease ? "#fff" : "#f4f3f4"
                  }
                />
              }
            />
            <SettingsItem
              icon="calendar-outline"
              label="Annual Fee"
              sublabel="Ingatkan biaya tahunan kartu"
              showChevron={false}
              rightElement={
                <Switch
                  value={notificationPrefs.annualFee}
                  onValueChange={(val) =>
                    toggleNotificationPref("annualFee", val)
                  }
                  trackColor={{ false: "#767577", true: theme.colors.primary }}
                  thumbColor={notificationPrefs.annualFee ? "#fff" : "#f4f3f4"}
                />
              }
            />
            <SettingsItem
              icon="document-text-outline"
              label="Status Pengajuan"
              sublabel="Update status pengajuan limit"
              showChevron={false}
              rightElement={
                <Switch
                  value={notificationPrefs.applicationStatus}
                  onValueChange={(val) =>
                    toggleNotificationPref("applicationStatus", val)
                  }
                  trackColor={{ false: "#767577", true: theme.colors.primary }}
                  thumbColor={
                    notificationPrefs.applicationStatus ? "#fff" : "#f4f3f4"
                  }
                />
              }
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kustomisasi</Text>
          <SettingsItem
            icon="options-outline"
            label="Preferensi"
            sublabel="Kategori kustom, mata uang, dan lainnya"
            onPress={() => navigation.navigate("Customization")}
          />
          <SettingsItem
            icon="link-outline"
            label="Limit Gabungan"
            sublabel="Kelola kartu dengan limit bersama"
            onPress={() => navigation.navigate("LinkedLimits")}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zona Bahaya</Text>
          <SettingsItem
            icon="refresh-outline"
            label="Reset Onboarding"
            sublabel="Tampilkan ulang intro aplikasi"
            onPress={handleResetOnboarding}
            color={theme.colors.text.secondary}
          />
          <SettingsItem
            icon="trash-outline"
            label="Hapus Semua Data"
            sublabel="Tindakan ini tidak dapat dibatalkan"
            onPress={handleClearData}
            isDanger
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi & Legal</Text>
          <SettingsItem
            icon="shield-checkmark-outline"
            label="Kebijakan Privasi"
            sublabel="Bagaimana kami melindungi data Anda"
            onPress={() => navigation.navigate("PrivacyPolicy")}
          />
          <SettingsItem
            icon="document-text-outline"
            label="Syarat & Ketentuan"
            sublabel="Ketentuan penggunaan aplikasi"
            onPress={() => navigation.navigate("Terms")}
          />
          <SettingsItem
            icon="information-circle-outline"
            label="Tentang Card Go"
            sublabel="Informasi aplikasi dan developer"
            onPress={() => navigation.navigate("About")}
          />
        </View>

        <Text style={styles.versionText}>Versi 1.0.0 • Card Go</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    padding: theme.spacing.s,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  content: {
    padding: theme.spacing.m,
    paddingBottom: 100,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.l,
    marginBottom: theme.spacing.l,
    ...theme.shadows.small,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.m,
  },
  profileName: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  profileSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  section: {
    marginBottom: theme.spacing.l,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.s,
    ...theme.shadows.small,
  },
  sectionTitle: {
    ...theme.typography.h3,
    fontSize: 16,
    marginLeft: theme.spacing.s,
    marginTop: theme.spacing.s,
    marginBottom: theme.spacing.m,
    color: theme.colors.text.primary,
  },
  settingsItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.s,
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + "40",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.m,
  },
  itemContent: {
    flex: 1,
    marginRight: theme.spacing.s,
  },
  itemLabel: {
    ...theme.typography.body,
    fontWeight: "500",
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  itemSublabel: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    fontSize: 11,
  },
  dangerText: {
    color: theme.colors.status.error,
  },
  versionText: {
    textAlign: "center",
    marginTop: theme.spacing.m,
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
  },
  pwaWarningSection: {
    backgroundColor: theme.colors.status.warning + "15",
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.status.warning + "30",
  },
  pwaWarningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.s,
    gap: theme.spacing.s,
  },
  pwaWarningTitle: {
    ...theme.typography.body,
    fontWeight: "600",
    color: theme.colors.status.warning,
  },
  pwaWarningText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    marginBottom: theme.spacing.m,
  },
  pwaWarningFeatures: {
    marginBottom: theme.spacing.m,
    gap: theme.spacing.xs,
  },
  pwaFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.s,
  },
  pwaFeatureText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  pwaBackupButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.s,
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.s,
  },
  pwaBackupButtonText: {
    ...theme.typography.body,
    color: "#fff",
    fontWeight: "600",
  },
});
