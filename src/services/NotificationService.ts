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

  // ===== GROUPED NOTIFICATIONS =====
  // Schedule grouped payment reminders for cards with same due date
  async scheduleGroupedPaymentReminders(cards: Card[]) {
    // Cancel all existing payment notifications first
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.identifier.startsWith("payment-group-")) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    const prefs = await storage.getNotificationPreferences();
    if (!prefs.payment) return;

    // Filter active unpaid cards
    const activeCards = cards.filter((c) => !c.isArchived && !c.isPaid);
    if (activeCards.length === 0) return;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Group cards by due day
    const cardsByDueDay: { [key: number]: Card[] } = {};
    activeCards.forEach((card) => {
      if (!cardsByDueDay[card.dueDay]) {
        cardsByDueDay[card.dueDay] = [];
      }
      cardsByDueDay[card.dueDay].push(card);
    });

    // Schedule grouped notifications for each due day
    for (const [dueDayStr, dueDayCards] of Object.entries(cardsByDueDay)) {
      const dueDay = parseInt(dueDayStr);
      let dueDate = new Date(currentYear, currentMonth, dueDay);

      // If due date has passed this month, schedule for next month
      if (dueDate < today) {
        dueDate = new Date(currentYear, currentMonth + 1, dueDay);
      }

      const cardNames = dueDayCards.map((c) => c.alias).join(", ");
      const cardCount = dueDayCards.length;
      const cardIds = dueDayCards.map((c) => c.id);

      const scheduleGrouped = async (
        daysBefore: number,
        title: string,
        bodyTemplate: string
      ) => {
        const triggerDate = new Date(dueDate);
        triggerDate.setDate(dueDate.getDate() - daysBefore);
        triggerDate.setHours(9, 0, 0, 0);

        if (triggerDate > today) {
          const body =
            cardCount === 1
              ? `Tagihan ${cardNames} jatuh tempo ${bodyTemplate}.`
              : `${cardCount} kartu jatuh tempo ${bodyTemplate}: ${cardNames}`;

          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data: { cardIds, type: "payment-group", dueDay },
            },
            trigger: { type: "date", date: triggerDate } as any,
            identifier: `payment-group-${dueDay}-${daysBefore}days`,
          });
        }
      };

      await scheduleGrouped(
        7,
        "Pengingat Tagihan",
        `dalam 7 hari (Tgl ${dueDay})`
      );
      await scheduleGrouped(
        3,
        "Pengingat Tagihan",
        `dalam 3 hari (Tgl ${dueDay})`
      );
      await scheduleGrouped(
        1,
        "Tagihan Jatuh Tempo Besok!",
        `besok (Tgl ${dueDay})`
      );

      // On due date
      const onDueDate = new Date(dueDate);
      onDueDate.setHours(8, 0, 0, 0);

      if (onDueDate > today) {
        const body =
          cardCount === 1
            ? `Segera bayar tagihan ${cardNames} hari ini!`
            : `${cardCount} kartu jatuh tempo hari ini: ${cardNames}`;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Tagihan Jatuh Tempo Hari Ini!",
            body,
            data: { cardIds, type: "payment-group", dueDay },
          },
          trigger: { type: "date", date: onDueDate } as any,
          identifier: `payment-group-${dueDay}-today`,
        });
      }
    }
  },

  // Schedule grouped limit increase reminders
  async scheduleGroupedLimitReminders(cards: Card[]) {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.identifier.startsWith("limit-group-")) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    const prefs = await storage.getNotificationPreferences();
    if (!prefs.limitIncrease) return;

    const activeCards = cards.filter(
      (c) =>
        !c.isArchived &&
        c.isLimitIncreaseReminderEnabled &&
        c.nextLimitIncreaseDate
    );
    if (activeCards.length === 0) return;

    const today = new Date();

    // Group cards by next limit increase date
    const cardsByDate: { [key: string]: Card[] } = {};
    activeCards.forEach((card) => {
      const dateStr = card.nextLimitIncreaseDate!.split("T")[0];
      if (!cardsByDate[dateStr]) {
        cardsByDate[dateStr] = [];
      }
      cardsByDate[dateStr].push(card);
    });

    for (const [dateStr, dateCards] of Object.entries(cardsByDate)) {
      const targetDate = new Date(dateStr);
      if (targetDate < today) continue;

      const cardNames = dateCards.map((c) => c.alias).join(", ");
      const cardCount = dateCards.length;
      const cardIds = dateCards.map((c) => c.id);

      const scheduleGrouped = async (daysBefore: number) => {
        const triggerDate = new Date(targetDate);
        triggerDate.setDate(targetDate.getDate() - daysBefore);
        triggerDate.setHours(10, 0, 0, 0);

        if (triggerDate > today) {
          const body =
            cardCount === 1
              ? `Kamu bisa ajukan kenaikan limit ${cardNames} dalam ${daysBefore} hari lagi.`
              : `${cardCount} kartu bisa ajukan kenaikan limit dalam ${daysBefore} hari: ${cardNames}`;

          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Pengingat Kenaikan Limit",
              body,
              data: { cardIds, type: "limit-group" },
            },
            trigger: { type: "date", date: triggerDate } as any,
            identifier: `limit-group-${dateStr}-${daysBefore}days`,
          });
        }
      };

      await scheduleGrouped(7);
      await scheduleGrouped(3);
      await scheduleGrouped(1);

      // On target date
      const onTargetDate = new Date(targetDate);
      onTargetDate.setHours(10, 0, 0, 0);

      if (onTargetDate > today) {
        const body =
          cardCount === 1
            ? `Yeayy hari ini kamu sudah bisa ajukan kenaikan limit ${cardNames}!`
            : `${cardCount} kartu sudah bisa ajukan kenaikan limit hari ini: ${cardNames}`;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Hari Ini: Ajukan Kenaikan Limit!",
            body,
            data: { cardIds, type: "limit-group" },
          },
          trigger: { type: "date", date: onTargetDate } as any,
          identifier: `limit-group-${dateStr}-today`,
        });
      }
    }
  },

  // Schedule grouped annual fee reminders
  async scheduleGroupedAnnualFeeReminders(cards: Card[]) {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.identifier.startsWith("annual-group-")) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    const prefs = await storage.getNotificationPreferences();
    if (!prefs.annualFee) return;

    const activeCards = cards.filter(
      (c) => !c.isArchived && c.isAnnualFeeReminderEnabled && c.expiryMonth
    );
    if (activeCards.length === 0) return;

    const today = new Date();
    const currentYear = today.getFullYear();

    // Group cards by expiry month
    const cardsByMonth: { [key: number]: Card[] } = {};
    activeCards.forEach((card) => {
      if (!cardsByMonth[card.expiryMonth!]) {
        cardsByMonth[card.expiryMonth!] = [];
      }
      cardsByMonth[card.expiryMonth!].push(card);
    });

    for (const [monthStr, monthCards] of Object.entries(cardsByMonth)) {
      const expiryMonth = parseInt(monthStr);
      let targetDate = new Date(currentYear, expiryMonth - 1, 1);

      if (targetDate < today) {
        targetDate = new Date(currentYear + 1, expiryMonth - 1, 1);
      }

      const cardNames = monthCards.map((c) => c.alias).join(", ");
      const cardCount = monthCards.length;
      const cardIds = monthCards.map((c) => c.id);
      const monthName = targetDate.toLocaleDateString("id-ID", {
        month: "long",
      });

      const scheduleGrouped = async (daysBefore: number) => {
        const triggerDate = new Date(targetDate);
        triggerDate.setDate(targetDate.getDate() - daysBefore);
        triggerDate.setHours(11, 0, 0, 0);

        if (triggerDate > today) {
          const body =
            cardCount === 1
              ? `Annual Fee ${cardNames} akan ditagihkan dalam ${daysBefore} hari.`
              : `${cardCount} kartu annual fee ditagihkan dalam ${daysBefore} hari: ${cardNames}`;

          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Pengingat Annual Fee",
              body,
              data: { cardIds, type: "annual-group" },
            },
            trigger: { type: "date", date: triggerDate } as any,
            identifier: `annual-group-${expiryMonth}-${daysBefore}days`,
          });
        }
      };

      await scheduleGrouped(7);
      await scheduleGrouped(3);
      await scheduleGrouped(1);

      // On target date
      const onTargetDate = new Date(targetDate);
      onTargetDate.setHours(11, 0, 0, 0);

      if (onTargetDate > today) {
        const body =
          cardCount === 1
            ? `Annual Fee ${cardNames} ditagihkan bulan ${monthName} ini.`
            : `${cardCount} kartu annual fee ditagihkan bulan ini (${monthName}): ${cardNames}`;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Annual Fee Ditagihkan Bulan Ini",
            body,
            data: { cardIds, type: "annual-group" },
          },
          trigger: { type: "date", date: onTargetDate } as any,
          identifier: `annual-group-${expiryMonth}-today`,
        });
      }
    }
  },

  // Schedule grouped limit increase STATUS reminders (after 7 days from request)
  async scheduleGroupedStatusReminders(
    records: {
      id: string;
      cardId: string;
      requestDate: string;
      status: string;
    }[],
    cards: Card[]
  ) {
    // Cancel existing grouped status notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.identifier.startsWith("status-group-")) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    const prefs = await storage.getNotificationPreferences();
    if (!prefs.applicationStatus) return;

    // Filter only pending records
    const pendingRecords = records.filter((r) => r.status === "pending");
    if (pendingRecords.length === 0) return;

    const today = new Date();

    // Group records by reminder date (7 days after request)
    const recordsByReminderDate: { [key: string]: typeof pendingRecords } = {};
    pendingRecords.forEach((record) => {
      const requestDate = new Date(record.requestDate);
      const reminderDate = new Date(requestDate);
      reminderDate.setDate(requestDate.getDate() + 7);
      const dateStr = reminderDate.toISOString().split("T")[0];

      if (!recordsByReminderDate[dateStr]) {
        recordsByReminderDate[dateStr] = [];
      }
      recordsByReminderDate[dateStr].push(record);
    });

    for (const [dateStr, dateRecords] of Object.entries(
      recordsByReminderDate
    )) {
      const triggerDate = new Date(dateStr);
      triggerDate.setHours(12, 0, 0, 0);

      if (triggerDate <= today) continue; // Past date

      const cardNames = dateRecords
        .map((r) => cards.find((c) => c.id === r.cardId)?.alias || "Unknown")
        .join(", ");
      const recordCount = dateRecords.length;
      const recordIds = dateRecords.map((r) => r.id);

      const body =
        recordCount === 1
          ? `Sudah 7 hari sejak pengajuan kenaikan limit ${cardNames}. Update statusnya!`
          : `${recordCount} pengajuan kenaikan limit perlu dicek statusnya: ${cardNames}`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Cek Status Kenaikan Limit",
          body,
          data: { recordIds, type: "status-group" },
        },
        trigger: { type: "date", date: triggerDate } as any,
        identifier: `status-group-${dateStr}`,
      });
    }
  },

  // Helper: Reschedule all grouped notifications
  async rescheduleAllGroupedNotifications(
    cards: Card[],
    limitRecords?: {
      id: string;
      cardId: string;
      requestDate: string;
      status: string;
    }[]
  ) {
    await this.scheduleGroupedPaymentReminders(cards);
    await this.scheduleGroupedLimitReminders(cards);
    await this.scheduleGroupedAnnualFeeReminders(cards);

    if (limitRecords) {
      await this.scheduleGroupedStatusReminders(limitRecords, cards);
    }
  },
};
