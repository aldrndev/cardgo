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
import { useCards } from "../context/CardsContext";
import { createBackup, restoreBackup } from "../utils/backup";
import { useAuth } from "../context/AuthContext";
import { BiometricService } from "../services/BiometricService";
import { ExportService } from "../services/ExportService";
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
          size={22}
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
          size={20}
          color={theme.colors.text.tertiary}
        />
      )}
    </TouchableOpacity>
  );
};

export const SettingsScreen = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { cards, transactions, restoreData, refreshCards } = useCards();
  const { hasPin, removePin } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState<{
    nickname: string;
    joinDate: string;
  } | null>(null);

  React.useEffect(() => {
    checkNotificationStatus();
    checkBiometricStatus();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const profile = await storage.getUserProfile();
    setUserProfile(profile);
  };

  const checkBiometricStatus = async () => {
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
      }
    } else {
      await BiometricService.setEnabled(false);
      setBiometricEnabled(false);
    }
  };

  const checkNotificationStatus = async () => {
    // In a real app, we would check actual permission status
    // For now, we'll assume true if we can get permissions
    // const { status } = await Notifications.getPermissionsAsync();
    // setNotificationsEnabled(status === 'granted');
    setNotificationsEnabled(true); // Default to true for UI demo
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      // Request permissions
      // await registerForPushNotificationsAsync();
      setNotificationsEnabled(true);
    } else {
      // Open settings to disable
      Alert.alert(
        "Matikan Notifikasi",
        "Untuk mematikan notifikasi, silakan pergi ke Pengaturan perangkat Anda.",
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Buka Pengaturan",
            onPress: () => {
              if (Platform.OS === "ios") {
                Linking.openURL("app-settings:");
              } else {
                Linking.openSettings();
              }
            },
          },
        ]
      );
      // We don't set false here because we can't force it without system change
    }
  };

  const handleRestore = async () => {
    await restoreBackup(async (data) => {
      await restoreData(data.cards, data.transactions);
      // Restore settings if needed
      if (data.settings) {
        // We might want to restore theme and notifications here
        // For now, let's just restore notifications preference
        // Theme is already static light mode, so no theme to restore
        // setNotificationsEnabled(data.settings.notificationsEnabled);
      }
    });
  };

  const handleBackup = async () => {
    await createBackup(cards, transactions, {
      themeMode: "light", // Static for now
      notificationsEnabled,
    });
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
            <Ionicons name="person" size={40} color={theme.colors.primary} />
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
            icon="cloud-upload-outline"
            label="Backup Data"
            sublabel="Simpan data ke file JSON"
            onPress={handleBackup}
          />

          <SettingsItem
            icon="cloud-download-outline"
            label="Restore Data"
            sublabel="Kembalikan data dari file JSON"
            onPress={handleRestore}
          />

          <SettingsItem
            icon="document-text-outline"
            label="Ekspor Laporan"
            sublabel="Unduh laporan PDF"
            onPress={handleExportPDF}
          />

          <SettingsItem
            icon="grid-outline"
            label="Ekspor Transaksi"
            sublabel="Unduh data CSV untuk Excel"
            onPress={handleExportCSV}
          />

          <SettingsItem
            icon="archive-outline"
            label="Kartu Diarsipkan"
            sublabel="Lihat kartu yang tidak aktif"
            onPress={() => navigation.navigate("ArchivedCards")}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferensi</Text>
          <SettingsItem
            icon="notifications-outline"
            label="Notifikasi"
            sublabel="Ingatkan tagihan jatuh tempo"
            showChevron={false}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: "#767577", true: theme.colors.primary }}
                thumbColor={notificationsEnabled ? "#fff" : "#f4f3f4"}
              />
            }
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
});
