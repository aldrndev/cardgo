import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Card } from "../types/card";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export const NotificationService = {
  async requestPermissions() {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("payment-reminders", {
        name: "Payment Reminders",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  },

  async schedulePaymentReminder(card: Card) {
    // Cancel existing notifications for this card to avoid duplicates
    await this.cancelRemindersForCard(card.id);

    if (card.isArchived || card.isPaid) return;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Calculate due date for this month
    let dueDate = new Date(currentYear, currentMonth, card.dueDay);

    // If due date has passed for this month, schedule for next month
    if (dueDate < today) {
      dueDate = new Date(currentYear, currentMonth + 1, card.dueDay);
    }

    // Schedule 3 days before
    const threeDaysBefore = new Date(dueDate);
    threeDaysBefore.setDate(dueDate.getDate() - 3);
    threeDaysBefore.setHours(9, 0, 0, 0); // 9 AM

    if (threeDaysBefore > today) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Pengingat Tagihan",
          body: `Tagihan ${card.alias} jatuh tempo dalam 3 hari (Tgl ${card.dueDay}).`,
          data: { cardId: card.id },
        },
        trigger: threeDaysBefore as any,
        identifier: `reminder-${card.id}-3days`,
      });
    }

    // Schedule 1 day before
    const oneDayBefore = new Date(dueDate);
    oneDayBefore.setDate(dueDate.getDate() - 1);
    oneDayBefore.setHours(9, 0, 0, 0); // 9 AM

    if (oneDayBefore > today) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Tagihan Jatuh Tempo Besok!",
          body: `Jangan lupa bayar tagihan ${card.alias} besok (Tgl ${card.dueDay}).`,
          data: { cardId: card.id },
        },
        trigger: oneDayBefore as any,
        identifier: `reminder-${card.id}-1day`,
      });
    }

    // Schedule on due date
    const onDueDate = new Date(dueDate);
    onDueDate.setHours(8, 0, 0, 0); // 8 AM

    if (onDueDate > today) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Tagihan Jatuh Tempo Hari Ini!",
          body: `Segera bayar tagihan ${card.alias} hari ini untuk menghindari denda.`,
          data: { cardId: card.id },
        },
        trigger: onDueDate as any,
        identifier: `reminder-${card.id}-today`,
      });
    }
  },

  async cancelRemindersForCard(cardId: string) {
    await Notifications.cancelScheduledNotificationAsync(
      `reminder-${cardId}-3days`
    );
    await Notifications.cancelScheduledNotificationAsync(
      `reminder-${cardId}-1day`
    );
    await Notifications.cancelScheduledNotificationAsync(
      `reminder-${cardId}-today`
    );

    // Also try to cancel by iterating (since identifiers might not be perfectly reliable if not set explicitly in all versions)
    // But setting identifier in scheduleNotificationAsync is the best way.
    // Note: Expo managed workflow might generate unique IDs, so we might need to store them.
    // For simplicity in this offline app, we'll rely on the identifier we set.
    // However, expo-notifications `identifier` in trigger is for *getting* it,
    // `scheduleNotificationAsync` returns the ID. We should probably store these IDs in the card or async storage if we want to be 100% sure.
    // But for now, let's use a simpler approach: Cancel all and reschedule all might be too heavy.
    // Let's try to use the identifier pattern if supported, otherwise we might need to store notification IDs.
    // Actually, `identifier` option in `scheduleNotificationAsync` request is supported.
  },

  async cancelAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
};
