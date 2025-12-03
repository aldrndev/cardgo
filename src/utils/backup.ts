import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { Alert } from "react-native";
import { Card, Transaction } from "../types/card";
import { storage } from "./storage";

import { Subscription } from "../types/subscription";
import { LimitIncreaseRecord } from "../types/limitIncrease";

interface BackupData {
  version: number;
  timestamp: string;
  cards: Card[];
  transactions: Transaction[];
  subscriptions: Subscription[];
  limitIncreaseRecords: LimitIncreaseRecord[];
  installmentPlans: any[]; // Replace with proper type if available
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
}

const CURRENT_VERSION = 2; // Incremented version

export const createBackup = async (
  cards: Card[],
  transactions: Transaction[],
  subscriptions: Subscription[],
  limitIncreaseRecords: LimitIncreaseRecord[],
  installmentPlans: any[],
  settings: BackupData["settings"]
) => {
  try {
    const backupData: BackupData = {
      version: CURRENT_VERSION,
      timestamp: new Date().toISOString(),
      cards,
      transactions,
      subscriptions,
      limitIncreaseRecords,
      installmentPlans,
      settings,
    };

    const fileName = `cardgo-backup-${new Date()
      .toISOString()
      .split("T")[0]
      .replace(/-/g, "")}.json`;
    const fileUri = (FileSystem as any).documentDirectory + fileName;

    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backupData), {
      encoding: "utf8",
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      Alert.alert("Error", "Sharing is not available on this device");
    }
  } catch (error) {
    console.error("Backup failed:", error);
    Alert.alert("Error", "Failed to create backup");
  }
};

export const restoreBackup = async (
  onRestore: (data: BackupData) => Promise<void>
) => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return;
    }

    const fileUri = result.assets[0].uri;
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: "utf8",
    });

    const data = JSON.parse(fileContent);

    if (!isValidBackup(data)) {
      Alert.alert("Error", "Invalid backup file format");
      return;
    }

    Alert.alert(
      "Restore Backup",
      `This will overwrite your current data with backup from ${new Date(
        data.timestamp
      ).toLocaleDateString()}. Are you sure?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          style: "destructive",
          onPress: async () => {
            try {
              await onRestore(data);
              Alert.alert("Success", "Data restored successfully");
            } catch (error) {
              console.error("Restore failed:", error);
              Alert.alert("Error", "Failed to restore data");
            }
          },
        },
      ]
    );
  } catch (error) {
    console.error("Restore failed:", error);
    Alert.alert("Error", "Failed to read backup file");
  }
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
