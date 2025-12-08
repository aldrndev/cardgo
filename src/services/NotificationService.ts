import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Card } from "../types/card";
import { storage } from "../utils/storage";

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
    await this.cancelPaymentReminders(card.id);

    const prefs = await storage.getNotificationPreferences();
    if (!prefs.payment) return;

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

    const schedule = async (
      daysBefore: number,
      title: string,
      body: string
    ) => {
      const triggerDate = new Date(dueDate);
      triggerDate.setDate(dueDate.getDate() - daysBefore);
      triggerDate.setHours(9, 0, 0, 0); // 9 AM

      if (triggerDate > today) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: { cardId: card.id, type: "payment" },
          },
          trigger: {
            type: "date",
            date: triggerDate,
          } as any,
          identifier: `payment-${card.id}-${daysBefore}days`,
        });
      }
    };

    // Schedule 7 days before
    await schedule(
      7,
      "Pengingat Tagihan",
      `Tagihan ${card.alias} (${card.bankName}) jatuh tempo dalam 7 hari (Tgl ${card.dueDay}).`
    );

    // Schedule 3 days before
    await schedule(
      3,
      "Pengingat Tagihan",
      `Tagihan ${card.alias} (${card.bankName}) jatuh tempo dalam 3 hari (Tgl ${card.dueDay}).`
    );

    // Schedule 1 day before
    await schedule(
      1,
      "Tagihan Jatuh Tempo Besok!",
      `Jangan lupa bayar tagihan ${card.alias} (${card.bankName}) besok (Tgl ${card.dueDay}).`
    );

    // Schedule on due date
    const onDueDate = new Date(dueDate);
    onDueDate.setHours(8, 0, 0, 0); // 8 AM

    if (onDueDate > today) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Tagihan Jatuh Tempo Hari Ini!",
          body: `Segera bayar tagihan ${card.alias} (${card.bankName}) hari ini untuk menghindari denda.`,
          data: { cardId: card.id, type: "payment" },
        },
        trigger: {
          type: "date",
          date: onDueDate,
        } as any,
        identifier: `payment-${card.id}-today`,
      });
    }
  },

  async scheduleLimitIncreaseReminder(card: Card) {
    // Cancel existing
    await this.cancelLimitReminders(card.id);

    const prefs = await storage.getNotificationPreferences();
    if (!prefs.limitIncrease) return;

    if (
      !card.isLimitIncreaseReminderEnabled ||
      !card.nextLimitIncreaseDate ||
      card.isArchived
    )
      return;

    const today = new Date();
    const targetDate = new Date(card.nextLimitIncreaseDate);

    if (targetDate < today) return; // Date passed

    const schedule = async (daysBefore: number) => {
      const triggerDate = new Date(targetDate);
      triggerDate.setDate(targetDate.getDate() - daysBefore);
      triggerDate.setHours(10, 0, 0, 0); // 10 AM

      if (triggerDate > today) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Pengingat Kenaikan Limit",
            body: `Kamu bisa mengajukan kenaikan limit untuk ${card.alias} (${card.bankName}) dalam ${daysBefore} hari lagi.`,
            data: { cardId: card.id, type: "limit" },
          },
          trigger: {
            type: "date",
            date: triggerDate,
          } as any,
          identifier: `limit-${card.id}-${daysBefore}days`,
        });
      }
    };

    await schedule(7);
    await schedule(3);
    await schedule(1);

    // Schedule on the day
    const onTargetDate = new Date(targetDate);
    onTargetDate.setHours(10, 0, 0, 0);

    if (onTargetDate > today) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Hari Ini: Ajukan Kenaikan Limit!",
          body: `Yeayy hari ini kamu sudah bisa mengajukan kenaikan limit ${card.alias} (${card.bankName}).`,
          data: { cardId: card.id, type: "limit" },
        },
        trigger: {
          type: "date",
          date: onTargetDate,
        } as any,
        identifier: `limit-${card.id}-today`,
      });
    }
  },

  async scheduleAnnualFeeReminder(card: Card) {
    // Cancel existing
    await this.cancelAnnualFeeReminders(card.id);

    const prefs = await storage.getNotificationPreferences();
    if (!prefs.annualFee) return;

    if (
      !card.isAnnualFeeReminderEnabled ||
      !card.expiryMonth ||
      card.isArchived
    )
      return;

    const today = new Date();
    const currentYear = today.getFullYear();
    // expiryMonth is 1-12, Date month is 0-11
    let targetDate = new Date(currentYear, card.expiryMonth - 1, 1);

    // If passed this year, schedule for next year
    if (targetDate < today) {
      targetDate = new Date(currentYear + 1, card.expiryMonth - 1, 1);
    }

    const schedule = async (daysBefore: number) => {
      const triggerDate = new Date(targetDate);
      triggerDate.setDate(targetDate.getDate() - daysBefore);
      triggerDate.setHours(11, 0, 0, 0); // 11 AM

      if (triggerDate > today) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Pengingat Annual Fee",
            body: `Annual Fee untuk ${card.alias} (${card.bankName}) akan ditagihkan dalam ${daysBefore} hari.`,
            data: { cardId: card.id, type: "annual" },
          },
          trigger: {
            type: "date",
            date: triggerDate,
          } as any,
          identifier: `annual-${card.id}-${daysBefore}days`,
        });
      }
    };

    await schedule(7);
    await schedule(3);
    await schedule(1);

    // Schedule on the day
    const onTargetDate = new Date(targetDate);
    onTargetDate.setHours(11, 0, 0, 0);

    if (onTargetDate > today) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Annual Fee Ditagihkan Hari Ini",
          body: `Annual Fee untuk ${card.alias} (${card.bankName}) akan ditagihkan hari ini.`,
          data: { cardId: card.id, type: "annual" },
        },
        trigger: {
          type: "date",
          date: onTargetDate,
        } as any,
        identifier: `annual-${card.id}-today`,
      });
    }
  },

  async scheduleLimitIncreaseStatusReminder(
    recordId: string,
    cardName: string,
    cardId: string
  ) {
    const prefs = await storage.getNotificationPreferences();
    if (!prefs.applicationStatus) return;

    const today = new Date();
    const triggerDate = new Date(today);
    triggerDate.setDate(today.getDate() + 7); // Remind after 7 days
    triggerDate.setHours(12, 0, 0, 0);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Cek Status Kenaikan Limit",
        body: `Sudah 7 hari sejak pengajuan kenaikan limit ${cardName}. Update statusnya sekarang di aplikasi!`,
        data: { recordId, type: "limit_status", cardId },
      },
      trigger: {
        type: "date",
        date: triggerDate,
      } as any,
      identifier: `limit-status-${recordId}`,
    });
  },

  async cancelLimitIncreaseStatusReminder(recordId: string) {
    await Notifications.cancelScheduledNotificationAsync(
      `limit-status-${recordId}`
    );
  },

  async cancelPaymentReminders(cardId: string) {
    await Notifications.cancelScheduledNotificationAsync(
      `payment-${cardId}-7days`
    );
    await Notifications.cancelScheduledNotificationAsync(
      `payment-${cardId}-3days`
    );
    await Notifications.cancelScheduledNotificationAsync(
      `payment-${cardId}-1day`
    );
    await Notifications.cancelScheduledNotificationAsync(
      `payment-${cardId}-today`
    );
  },

  async cancelLimitReminders(cardId: string) {
    await Notifications.cancelScheduledNotificationAsync(
      `limit-${cardId}-7days`
    );
    await Notifications.cancelScheduledNotificationAsync(
      `limit-${cardId}-3days`
    );
    await Notifications.cancelScheduledNotificationAsync(
      `limit-${cardId}-1day`
    );
    await Notifications.cancelScheduledNotificationAsync(
      `limit-${cardId}-today`
    );
  },

  async cancelAnnualFeeReminders(cardId: string) {
    await Notifications.cancelScheduledNotificationAsync(
      `annual-${cardId}-7days`
    );
    await Notifications.cancelScheduledNotificationAsync(
      `annual-${cardId}-3days`
    );
    await Notifications.cancelScheduledNotificationAsync(
      `annual-${cardId}-1day`
    );
    await Notifications.cancelScheduledNotificationAsync(
      `annual-${cardId}-today`
    );
  },

  async cancelRemindersForCard(cardId: string) {
    await this.cancelPaymentReminders(cardId);
    await this.cancelLimitReminders(cardId);
    await this.cancelAnnualFeeReminders(cardId);
  },

  async cancelAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  // Category Budget Alerts
  async checkCategoryBudgetAlerts(
    transactions: any[],
    showNotification: boolean = true
  ) {
    const budgets = await storage.getCategoryBudgets();
    if (budgets.length === 0) return [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const alertsTriggered: { category: string; percentage: number }[] = [];

    for (const budget of budgets) {
      // Calculate current month spending for this category
      const monthSpending = transactions
        .filter((t) => {
          const tDate = new Date(t.date);
          return (
            t.category === budget.category &&
            tDate.getMonth() === currentMonth &&
            tDate.getFullYear() === currentYear
          );
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const percentage =
        budget.budget > 0 ? (monthSpending / budget.budget) * 100 : 0;

      // Check if threshold exceeded
      if (percentage >= budget.alertThreshold) {
        alertsTriggered.push({
          category: budget.category,
          percentage: Math.round(percentage),
        });

        if (showNotification) {
          // Check if we already sent notification for this category this month
          const notifKey = `budget-alert-${budget.category}-${currentYear}-${currentMonth}`;
          const alreadySent = await storage.getNotificationSent(notifKey);

          if (!alreadySent) {
            const isOverBudget = percentage >= 100;
            await Notifications.scheduleNotificationAsync({
              content: {
                title: isOverBudget
                  ? `⚠️ Budget ${budget.category} Terlampaui!`
                  : `📊 Budget ${budget.category} Hampir Habis`,
                body: isOverBudget
                  ? `Pengeluaran ${budget.category} sudah ${Math.round(
                      percentage
                    )}% dari budget. Pertimbangkan untuk mengurangi pengeluaran.`
                  : `Pengeluaran ${budget.category} sudah ${Math.round(
                      percentage
                    )}% dari budget (threshold: ${budget.alertThreshold}%).`,
                data: { type: "budget-alert", category: budget.category },
              },
              trigger: null, // Immediate notification
            });

            // Mark as sent for this month
            await storage.setNotificationSent(notifKey, true);
          }
        }
      }
    }

    return alertsTriggered;
  },

  // Reset budget notification flags at start of new month
  async resetMonthlyBudgetAlerts() {
    const budgets = await storage.getCategoryBudgets();
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    for (const budget of budgets) {
      const notifKey = `budget-alert-${
        budget.category
      }-${prevMonth.getFullYear()}-${prevMonth.getMonth()}`;
      await storage.setNotificationSent(notifKey, false);
    }
  },
};
