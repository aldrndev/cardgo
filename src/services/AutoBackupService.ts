import AsyncStorage from "@react-native-async-storage/async-storage";
import { createInternalBackup } from "../utils/backup";
import * as FileSystem from "expo-file-system/legacy";

const AUTO_BACKUP_ENABLED_KEY = "@card_go_auto_backup_enabled";
const AUTO_BACKUP_TIME_KEY = "@card_go_auto_backup_time"; // timestamp of prefered hour (we only use hour/minute)
const LAST_BACKUP_TIMESTAMP_KEY = "@card_go_last_auto_backup";
const MAX_BACKUPS_RETAINED = 5;

const AUTO_BACKUP_FREQUENCY_KEY = "@card_go_auto_backup_frequency";

export type AutoBackupFrequency = "daily" | "3days" | "weekly" | "monthly";

export const AutoBackupService = {
  /**
   * Initialize auto backup service
   */
  init: async () => {
    try {
      await AutoBackupService.checkAndRunBackup();
    } catch (error) {
      console.error("AutoBackupService init failed:", error);
    }
  },

  /**
   * Enable/Disable
   */
  setEnabled: async (enabled: boolean) => {
    await AsyncStorage.setItem(
      AUTO_BACKUP_ENABLED_KEY,
      JSON.stringify(enabled)
    );
  },

  isEnabled: async (): Promise<boolean> => {
    const val = await AsyncStorage.getItem(AUTO_BACKUP_ENABLED_KEY);
    return val ? JSON.parse(val) : false;
  },

  /**
   * Preferred Time
   */
  setPreferredTime: async (date: Date) => {
    await AsyncStorage.setItem(AUTO_BACKUP_TIME_KEY, date.toISOString());
  },

  getPreferredTime: async (): Promise<Date | null> => {
    const val = await AsyncStorage.getItem(AUTO_BACKUP_TIME_KEY);
    return val ? new Date(val) : null;
  },

  /**
   * Frequency
   */
  setFrequency: async (frequency: AutoBackupFrequency) => {
    await AsyncStorage.setItem(AUTO_BACKUP_FREQUENCY_KEY, frequency);
  },

  getFrequency: async (): Promise<AutoBackupFrequency> => {
    const val = await AsyncStorage.getItem(AUTO_BACKUP_FREQUENCY_KEY);
    return (val as AutoBackupFrequency) || "daily";
  },

  /**
   * Check logic
   */
  checkAndRunBackup: async () => {
    const enabled = await AutoBackupService.isEnabled();
    if (!enabled) return;

    const lastBackupStr = await AsyncStorage.getItem(LAST_BACKUP_TIMESTAMP_KEY);
    const lastBackupTime = lastBackupStr
      ? new Date(lastBackupStr).getTime()
      : 0;
    const now = new Date();

    // Determine interval in ms
    const frequency = await AutoBackupService.getFrequency();
    const oneDay = 24 * 60 * 60 * 1000;
    let intervalMs = oneDay;

    switch (frequency) {
      case "daily":
        intervalMs = oneDay;
        break;
      case "3days":
        intervalMs = 3 * oneDay;
        break;
      case "weekly":
        intervalMs = 7 * oneDay;
        break;
      case "monthly":
        intervalMs = 30 * oneDay;
        break;
      default:
        intervalMs = oneDay;
    }

    const preferredTimeObj = await AutoBackupService.getPreferredTime();
    let shouldRun = false;

    // Logic: Has enough time passed since last backup?
    const timeSinceLastBackup = now.getTime() - lastBackupTime;

    // If time elapsed is greater than interval
    if (timeSinceLastBackup >= intervalMs) {
      if (preferredTimeObj) {
        // Check if we are past the preferred time of day TODAY
        const targetTimeToday = new Date();
        targetTimeToday.setHours(
          preferredTimeObj.getHours(),
          preferredTimeObj.getMinutes(),
          0,
          0
        );

        if (now.getTime() >= targetTimeToday.getTime()) {
          shouldRun = true;
        } else {
          // We passed the interval (e.g. it's day 2), but it's morning (9AM) and preferred is 2PM.
          // We wait until 2PM today.
          // EXCEPT if we are waaaay past due (e.g. 2 days overdue), running now is better than waiting.
          // But generally "Day T+Interval" @ "PreferredTime" is the goal.

          // Let's keep it simple: if > interval, we are candidate.
          // If now < targetTime, we only run if we are significantly late (> interval + 12h)
          // Otherwise wait for targetTime.
          if (timeSinceLastBackup > intervalMs + 12 * 60 * 60 * 1000) {
            shouldRun = true;
          }
        }
      } else {
        // No time preference, just run if interval passed
        shouldRun = true;
      }
    }

    if (shouldRun) {
      const path = await createInternalBackup();
      if (path) {
        await AsyncStorage.setItem(
          LAST_BACKUP_TIMESTAMP_KEY,
          now.toISOString()
        );
        await AutoBackupService.cleanupOldBackups();
      }
    }
  },

  cleanupOldBackups: async () => {
    try {
      const backupDir = FileSystem.documentDirectory + "backups/";
      const dirInfo = await FileSystem.getInfoAsync(backupDir);
      if (!dirInfo.exists) return;

      const files = await FileSystem.readDirectoryAsync(backupDir);
      const backupFiles = files.filter((f) => f.startsWith("auto-backup-"));

      if (backupFiles.length > MAX_BACKUPS_RETAINED) {
        backupFiles.sort();
        const toDelete = backupFiles.slice(
          0,
          backupFiles.length - MAX_BACKUPS_RETAINED
        );
        for (const file of toDelete) {
          await FileSystem.deleteAsync(backupDir + file, { idempotent: true });
          console.log("AutoBackup: Deleted old backup", file);
        }
      }
    } catch (e) {
      console.warn("AutoBackup cleanup failed:", e);
    }
  },
};
