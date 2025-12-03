import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { Card } from "../types/card";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const registerForPushNotificationsAsync = async () => {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      // alert('Failed to get push token for push notification!');
      return;
    }
    // token = (await Notifications.getExpoPushTokenAsync({ projectId: Constants.expoConfig.extra.eas.projectId })).data;
  } else {
    // alert('Must use physical device for Push Notifications');
  }

  return token;
};

export const scheduleCardReminder = async (card: Card) => {
  // Cancel existing notifications for this card to avoid duplicates
  await cancelCardReminder(card.id);

  if (card.isArchived) return;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Schedule for the next due date
  // Logic: Find the next occurrence of the due day
  let dueDate = new Date(currentYear, currentMonth, card.dueDay);
  if (dueDate < today) {
    dueDate = new Date(currentYear, currentMonth + 1, card.dueDay);
  }

  // Reminder 3 days before due date
  const reminderDate = new Date(dueDate);
  reminderDate.setDate(dueDate.getDate() - 3);
  reminderDate.setHours(9, 0, 0, 0); // 9 AM

  if (reminderDate < today) {
    // If 3 days before is already passed for this month, schedule for next month
    const nextMonthDueDate = new Date(
      currentYear,
      currentMonth + 1,
      card.dueDay
    );
    reminderDate.setTime(nextMonthDueDate.getTime());
    reminderDate.setDate(nextMonthDueDate.getDate() - 3);
    reminderDate.setHours(9, 0, 0, 0);
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Pengingat Tagihan Kartu Kredit",
      body: `Tagihan ${card.alias} jatuh tempo dalam 3 hari (Tgl ${card.dueDay}). Jangan lupa bayar!`,
      data: { cardId: card.id },
    },
    trigger: {
      type: "date",
      date: reminderDate,
    } as any,
    identifier: `reminder-${card.id}`,
  });
};

export const cancelCardReminder = async (cardId: string) => {
  await Notifications.cancelScheduledNotificationAsync(`reminder-${cardId}`);
};
