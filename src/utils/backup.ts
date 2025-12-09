import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { Alert } from "react-native";
import { Card, Transaction } from "../types/card";
import { storage } from "./storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Subscription } from "../types/subscription";
import { LimitIncreaseRecord } from "../types/limitIncrease";

// Full backup data interface - includes ALL app data
interface BackupData {
  version: number;
  timestamp: string;
  cards: Card[];
  transactions: Transaction[];
  subscriptions: Subscription[];
  limitIncreaseRecords: LimitIncreaseRecord[];
  installmentPlans: any[];
  settings: {
    themeMode: "light" | "dark" | "system";
    notificationsEnabled: boolean;
    notificationPrefs?: {
      payment: boolean;
      limitIncrease: boolean;
      annualFee: boolean;
      applicationStatus: boolean;
    };
  };
  // NEW: Additional data for full backup
  userProfile?: {
    nickname: string;
    joinDate: string;
  };
  customCategories?: { name: string; icon: string }[];
  accentColor?: string;
  categoryBudgets?: {
    category: string;
    budget: number;
    alertThreshold: number;
  }[];
  linkedLimitGroups?: any[];
  defaultCurrency?: string;
}

const CURRENT_VERSION = 3; // Version 3 includes full backup data
const ACCENT_COLOR_KEY = "@card_go_accent_color";

/**
 * Create a FULL backup of all app data
 * This includes ALL user data for complete migration to a new device
 */
/**
 * Create backup data object containing all app data
 */
export const createBackupData = async (): Promise<BackupData> => {
  const [
    cards,
    transactions,
    subscriptions,
    limitIncreaseRecords,
    installmentPlans,
    notificationPrefs,
    userProfile,
    customCategories,
    accentColor,
    categoryBudgets,
    linkedLimitGroups,
    defaultCurrency,
  ] = await Promise.all([
    storage.getCards(),
    storage.getTransactions(),
    storage.getSubscriptions(),
    storage.getLimitIncreaseRecords(),
    storage.getInstallmentPlans(),
    storage.getNotificationPreferences(),
    storage.getUserProfile(),
    storage.getCustomCategories(),
    AsyncStorage.getItem(ACCENT_COLOR_KEY),
    storage.getCategoryBudgets(),
    storage.getLinkedLimitGroups(),
    storage.getDefaultCurrency(),
  ]);

  return {
    version: CURRENT_VERSION,
    timestamp: new Date().toISOString(),
    cards,
    transactions,
    subscriptions,
    limitIncreaseRecords,
    installmentPlans,
    settings: {
      themeMode: "light",
      notificationsEnabled: notificationPrefs.payment,
      notificationPrefs,
    },
    userProfile: userProfile ?? undefined,
    customCategories:
      customCategories.length > 0 ? customCategories : undefined,
    accentColor: accentColor ?? undefined,
    categoryBudgets: categoryBudgets.length > 0 ? categoryBudgets : undefined,
    linkedLimitGroups:
      linkedLimitGroups.length > 0 ? linkedLimitGroups : undefined,
    defaultCurrency: defaultCurrency !== "IDR" ? defaultCurrency : undefined,
  };
};

/**
 * Internal backup - saves to 'backups' folder without user interaction
 * Returns the file path if successful
 */
export const createInternalBackup = async (): Promise<string | null> => {
  try {
    const backupData = await createBackupData();
    const backupDir = FileSystem.documentDirectory + "backups/";

    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(backupDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `auto-backup-${timestamp}.json`;
    const fileUri = backupDir + fileName;

    await FileSystem.writeAsStringAsync(
      fileUri,
      JSON.stringify(backupData, null, 2),
      {
        encoding: "utf8",
      }
    );

    return fileUri;
  } catch (error) {
    console.error("Internal backup failed:", error);
    return null;
  }
};

/**
 * Create a FULL backup of all app data and share it
 */
export const createFullBackup = async (): Promise<void> => {
  console.log("=== createFullBackup called ===");
  try {
    const backupData = await createBackupData();

    const fileName = `cardgo-backup-${new Date()
      .toISOString()
      .split("T")[0]
      .replace(/-/g, "")}.json`;
    const fileUri = (FileSystem as any).documentDirectory + fileName;

    await FileSystem.writeAsStringAsync(
      fileUri,
      JSON.stringify(backupData, null, 2),
      {
        encoding: "utf8",
      }
    );

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/json",
        dialogTitle: "Simpan Backup Card Go",
      });
    } else {
      Alert.alert("Error", "Sharing tidak tersedia di perangkat ini");
    }
  } catch (error) {
    console.error("Backup failed:", error);
    Alert.alert("Error", "Gagal membuat backup");
  }
};

/**
 * Restore a FULL backup - restores ALL app data
 * Can be called from Settings or Onboarding
 */
export const restoreFullBackup = async (
  onSuccess?: () => void,
  skipConfirmation: boolean = false
): Promise<boolean> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return false;
    }

    const fileUri = result.assets[0].uri;
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: "utf8",
    });

    const data = JSON.parse(fileContent);

    if (!isValidBackup(data)) {
      Alert.alert("Error", "Format file backup tidak valid");
      return false;
    }

    const doRestore = async (): Promise<boolean> => {
      try {
        // Restore Cards
        if (data.cards && data.cards.length > 0) {
          await storage.saveCards(data.cards);
        }

        // Restore Transactions
        if (data.transactions && data.transactions.length > 0) {
          await storage.saveTransactions(data.transactions);
        }

        // Restore Subscriptions
        if (data.subscriptions && data.subscriptions.length > 0) {
          await storage.saveSubscriptions(data.subscriptions);
        }

        // Restore Installment Plans
        if (data.installmentPlans && data.installmentPlans.length > 0) {
          await storage.saveInstallmentPlans(data.installmentPlans);
        }

        // Restore Limit Increase Records
        if (data.limitIncreaseRecords && data.limitIncreaseRecords.length > 0) {
          await storage.saveLimitIncreaseRecords(data.limitIncreaseRecords);
        }

        // Restore Notification Preferences
        if (data.settings?.notificationPrefs) {
          await storage.saveNotificationPreferences(
            data.settings.notificationPrefs
          );
        }

        // Restore User Profile
        if (data.userProfile) {
          await storage.saveUserProfile(data.userProfile);
        }

        // Restore Custom Categories
        if (data.customCategories && data.customCategories.length > 0) {
          await storage.saveCustomCategories(data.customCategories);
        }

        // Restore Accent Color
        if (data.accentColor) {
          await AsyncStorage.setItem(ACCENT_COLOR_KEY, data.accentColor);
        }

        // Restore Category Budgets
        if (data.categoryBudgets && data.categoryBudgets.length > 0) {
          await storage.saveCategoryBudgets(data.categoryBudgets);
        }

        // Restore Linked Limit Groups
        if (data.linkedLimitGroups && data.linkedLimitGroups.length > 0) {
          await storage.saveLinkedLimitGroups(data.linkedLimitGroups);
        }

        // Restore Default Currency
        if (data.defaultCurrency) {
          await storage.saveDefaultCurrency(data.defaultCurrency);
        }

        if (onSuccess) {
          onSuccess();
        }
        return true;
      } catch (error) {
        console.error("Restore failed:", error);
        Alert.alert("Error", "Gagal restore data");
        return false;
      }
    };

    if (skipConfirmation) {
      // For onboarding - restore directly
      const success = await doRestore();
      if (success) {
        Alert.alert("Berhasil", "Data berhasil di-restore dari backup");
      }
      return success;
    } else {
      // For settings - show confirmation
      return new Promise((resolve) => {
        const backupDate = new Date(data.timestamp).toLocaleDateString(
          "id-ID",
          {
            day: "numeric",
            month: "long",
            year: "numeric",
          }
        );

        const itemCount = [
          data.cards?.length ? `${data.cards.length} kartu` : null,
          data.transactions?.length
            ? `${data.transactions.length} transaksi`
            : null,
          data.subscriptions?.length
            ? `${data.subscriptions.length} langganan`
            : null,
        ]
          .filter(Boolean)
          .join(", ");

        Alert.alert(
          "Restore Backup",
          `Backup dari ${backupDate}\n${itemCount}\n\nData saat ini akan ditimpa. Lanjutkan?`,
          [
            { text: "Batal", style: "cancel", onPress: () => resolve(false) },
            {
              text: "Restore",
              style: "destructive",
              onPress: async () => {
                const success = await doRestore();
                if (success) {
                  Alert.alert("Berhasil", "Data berhasil di-restore");
                }
                resolve(success);
              },
            },
          ]
        );
      });
    }
  } catch (error) {
    console.error("Restore failed:", error);
    Alert.alert("Error", "Gagal membaca file backup");
    return false;
  }
};

// Legacy functions for backward compatibility
export const createBackup = async (
  cards: Card[],
  transactions: Transaction[],
  subscriptions: Subscription[],
  limitIncreaseRecords: LimitIncreaseRecord[],
  installmentPlans: any[],
  settings: BackupData["settings"]
) => {
  // Use the new full backup instead
  await createFullBackup();
};

export const restoreBackup = async (
  onRestore: (data: BackupData) => Promise<void>
) => {
  await restoreFullBackup();
};

export const restoreData = async (
  cards: Card[],
  transactions: Transaction[],
  subscriptions: Subscription[],
  installmentPlans: any[]
) => {
  await storage.saveCards(cards);
  await storage.saveTransactions(transactions);
  await storage.saveSubscriptions(subscriptions);
  await storage.saveInstallmentPlans(installmentPlans);
};

const isValidBackup = (data: any): data is BackupData => {
  return (
    data &&
    typeof data.version === "number" &&
    Array.isArray(data.cards) &&
    Array.isArray(data.transactions) &&
    (data.subscriptions === undefined || Array.isArray(data.subscriptions)) &&
    (data.limitIncreaseRecords === undefined ||
      Array.isArray(data.limitIncreaseRecords)) &&
    (data.installmentPlans === undefined ||
      Array.isArray(data.installmentPlans)) &&
    typeof data.settings === "object"
  );
};
