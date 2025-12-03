import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Calendar, DateData } from "react-native-calendars";
import { theme } from "../constants/theme";
import { useCards } from "../context/CardsContext";
import { useLimitIncrease } from "../context/LimitIncreaseContext";
import { Card } from "../types/card";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { formatCurrency } from "../utils/formatters";
import { CARD_THEMES } from "../types/card";

export const CalendarScreen = () => {
  const navigation = useNavigation();
  const { cards } = useCards();
  const { getRecordsByCardId } = useLimitIncrease();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const jumpToToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12

    // Helper to format date string YYYY-MM-DD
    const formatDate = (year: number, month: number, day: number) => {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
        2,
        "0"
      )}`;
    };

    cards.forEach((card) => {
      if (card.isArchived) return;

      // Mark Due Date for current month
      const dueDate = formatDate(currentYear, currentMonth, card.dueDay);
      if (!marks[dueDate]) {
        marks[dueDate] = { dots: [] };
      }
      marks[dueDate].dots.push({
        key: `due-${card.id}`,
        color: theme.colors.status.error,
      });

      // Mark Billing Date for current month
      const billingDate = formatDate(
        currentYear,
        currentMonth,
        card.billingCycleDay
      );
      if (!marks[billingDate]) {
        marks[billingDate] = { dots: [] };
      }
      // Avoid duplicate dots if billing and due date are same (unlikely but possible)
      if (
        !marks[billingDate].dots.find((d: any) => d.key === `bill-${card.id}`)
      ) {
        marks[billingDate].dots.push({
          key: `bill-${card.id}`,
          color: theme.colors.status.info,
        });
      }

      // Mark Annual Fee
      if (card.isAnnualFeeReminderEnabled && card.expiryMonth) {
        // Fee is 1st of next month after expiry
        // Mark for current year and next year
        [0, 1].forEach((offset) => {
          let m = card.expiryMonth! + 1;
          let y = currentYear + offset;
          if (m > 12) {
            m = 1;
            y++;
          }

          const feeDate = formatDate(y, m, 1);
          if (!marks[feeDate]) {
            marks[feeDate] = { dots: [] };
          }
          if (
            !marks[feeDate].dots.find((d: any) => d.key === `fee-${card.id}`)
          ) {
            marks[feeDate].dots.push({
              key: `fee-${card.id}`,
              color: theme.colors.status.warning,
            });
          }
        });
      }

      // Mark Limit Increase
      if (card.isLimitIncreaseReminderEnabled) {
        let limitDateStr: string | null = null;
        const records = getRecordsByCardId(card.id);

        if (records.length > 0) {
          const sortedRecords = records.sort((a, b) => {
            const dateA = a.actionDate || a.requestDate;
            const dateB = b.actionDate || b.requestDate;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          });
          const latestRecord = sortedRecords[0];
          const baseDateStr =
            latestRecord.actionDate || latestRecord.requestDate;
          const baseDate = new Date(baseDateStr);
          baseDate.setMonth(baseDate.getMonth() + latestRecord.frequency);
          limitDateStr = formatDate(
            baseDate.getFullYear(),
            baseDate.getMonth() + 1,
            baseDate.getDate()
          );
        } else if (card.nextLimitIncreaseDate) {
          limitDateStr = card.nextLimitIncreaseDate.split("T")[0];
        }

        if (limitDateStr) {
          if (!marks[limitDateStr]) {
            marks[limitDateStr] = { dots: [] };
          }
          if (
            !marks[limitDateStr].dots.find(
              (d: any) => d.key === `limit-${card.id}`
            )
          ) {
            marks[limitDateStr].dots.push({
              key: `limit-${card.id}`,
              color: theme.colors.status.success,
            });
          }
        }
      }
    });

    // Mark selected date
    if (marks[selectedDate]) {
      marks[selectedDate].selected = true;
      marks[selectedDate].selectedColor = theme.colors.primary;
    } else {
      marks[selectedDate] = {
        selected: true,
        selectedColor: theme.colors.primary,
      };
    }

    return marks;
  }, [cards, selectedDate]);

  const eventsOnSelectedDate = useMemo(() => {
    const dateParts = selectedDate.split("-");
    const day = parseInt(dateParts[2]);

    const dueCards = cards.filter((c) => !c.isArchived && c.dueDay === day);
    const billingCards = cards.filter(
      (c) => !c.isArchived && c.billingCycleDay === day
    );

    const feeCards = cards.filter((c) => {
      if (!c.isArchived && c.isAnnualFeeReminderEnabled && c.expiryMonth) {
        const [y, m, d] = selectedDate.split("-").map(Number);
        let targetMonth = c.expiryMonth + 1;
        if (targetMonth > 12) targetMonth = 1;
        return d === 1 && m === targetMonth;
      }
      return false;
    });

    const limitCards = cards.filter((c) => {
      if (!c.isArchived && c.isLimitIncreaseReminderEnabled) {
        let limitDateStr: string | null = null;
        const records = getRecordsByCardId(c.id);

        if (records.length > 0) {
          const sortedRecords = records.sort((a, b) => {
            const dateA = a.actionDate || a.requestDate;
            const dateB = b.actionDate || b.requestDate;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          });
          const latestRecord = sortedRecords[0];
          const baseDateStr =
            latestRecord.actionDate || latestRecord.requestDate;
          const baseDate = new Date(baseDateStr);
          baseDate.setMonth(baseDate.getMonth() + latestRecord.frequency);
          // Format manually to match selectedDate
          limitDateStr = `${baseDate.getFullYear()}-${String(
            baseDate.getMonth() + 1
          ).padStart(2, "0")}-${String(baseDate.getDate()).padStart(2, "0")}`;
        } else if (c.nextLimitIncreaseDate) {
          limitDateStr = c.nextLimitIncreaseDate.split("T")[0];
        }

        return limitDateStr === selectedDate;
      }
      return false;
    });

    return { dueCards, billingCards, feeCards, limitCards };
  }, [cards, selectedDate]);

  const renderCardItem = (
    card: Card,
    type: "due" | "billing" | "fee" | "limit"
  ) => {
    let gradientColors = [theme.colors.primary, "#3730A3"]; // Hardcoded dark variant for now
    if (card.themeId) {
      const themeOption = CARD_THEMES.find((t) => t.id === card.themeId);
      if (themeOption) gradientColors = themeOption.colors;
    } else if (card.colorTheme) {
      gradientColors = [card.colorTheme, card.colorTheme];
    }

    return (
      <TouchableOpacity
        key={card.id}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("CardDetail", { cardId: card.id })}
      >
        <LinearGradient
          colors={gradientColors as any}
          style={styles.eventItem}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.eventContent}>
            <View style={styles.eventLeft}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={
                    type === "due"
                      ? "alert-circle"
                      : type === "billing"
                      ? "document-text"
                      : type === "fee"
                      ? "wallet"
                      : "trending-up"
                  }
                  size={20}
                  color="#FFFFFF"
                />
              </View>
              <View>
                <Text style={styles.cardName}>{card.alias.toUpperCase()}</Text>
                <Text style={styles.eventType}>
                  {type === "due"
                    ? "Jatuh Tempo"
                    : type === "billing"
                    ? "Cetak Tagihan"
                    : type === "fee"
                    ? "Annual Fee"
                    : "Kenaikan Limit"}
                </Text>
              </View>
            </View>
            {type === "due" && (
              <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>Tagihan</Text>
                <Text style={styles.amount}>
                  {formatCurrency(card.statementAmount || 0)}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const totalDueOnDate = useMemo(() => {
    return eventsOnSelectedDate.dueCards.reduce(
      (sum, card) => sum + (card.statementAmount || 0),
      0
    );
  }, [eventsOnSelectedDate]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Kalender Tagihan</Text>
        <TouchableOpacity onPress={jumpToToday} style={styles.todayButton}>
          <Text style={styles.todayButtonText}>Hari Ini</Text>
        </TouchableOpacity>
      </View>

      <Calendar
        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        markingType={"multi-dot"}
        theme={{
          backgroundColor: theme.colors.background,
          calendarBackground: theme.colors.background,
          textSectionTitleColor: theme.colors.text.tertiary,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: theme.colors.text.inverse,
          todayTextColor: theme.colors.primary,
          dayTextColor: theme.colors.text.primary,
          textDisabledColor: theme.colors.text.tertiary + "40",
          dotColor: theme.colors.primary,
          selectedDotColor: theme.colors.text.inverse,
          arrowColor: theme.colors.primary,
          monthTextColor: theme.colors.text.primary,
          indicatorColor: theme.colors.primary,
          textDayFontWeight: "500",
          textMonthFontWeight: "700",
          textDayHeaderFontWeight: "600",
          textDayFontSize: 14,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 12,
        }}
        enableSwipeMonths={true}
      />

      <ScrollView style={styles.eventsContainer}>
        <Text style={styles.dateTitle}>
          {new Date(selectedDate).toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>

        {eventsOnSelectedDate.dueCards.length === 0 &&
        eventsOnSelectedDate.billingCards.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color={theme.colors.text.tertiary}
            />
            <Text style={styles.noEventsText}>Tidak ada agenda hari ini</Text>
          </View>
        ) : (
          <>
            {totalDueOnDate > 0 && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryLabel}>Total Jatuh Tempo</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(totalDueOnDate)}
                </Text>
              </View>
            )}
            {eventsOnSelectedDate.dueCards.map((card) =>
              renderCardItem(card, "due")
            )}
            {eventsOnSelectedDate.billingCards.map((card) =>
              renderCardItem(card, "billing")
            )}
          </>
        )}

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.dot,
                { backgroundColor: theme.colors.status.error },
              ]}
            />
            <Text style={styles.legendText}>Jatuh Tempo</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.dot,
                { backgroundColor: theme.colors.status.info },
              ]}
            />
            <Text style={styles.legendText}>Cetak Tagihan</Text>
          </View>
        </View>
        {eventsOnSelectedDate.feeCards.length > 0 && (
          <View style={styles.eventSection}>
            <Text style={styles.sectionTitle}>Annual Fee</Text>
            {eventsOnSelectedDate.feeCards.map((card) =>
              renderCardItem(card, "fee")
            )}
          </View>
        )}

        {eventsOnSelectedDate.limitCards.length > 0 && (
          <View style={styles.eventSection}>
            <Text style={styles.sectionTitle}>Kenaikan Limit</Text>
            {eventsOnSelectedDate.limitCards.map((card) =>
              renderCardItem(card, "limit")
            )}
          </View>
        )}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.primary + "10",
    borderRadius: 16,
  },
  todayButtonText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  eventsContainer: {
    flex: 1,
    padding: theme.spacing.m,
  },
  dateTitle: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.m,
    color: theme.colors.text.primary,
    textTransform: "capitalize",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.s,
  },
  noEventsText: {
    ...theme.typography.body,
    color: theme.colors.text.tertiary,
  },
  eventItem: {
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.small,
    overflow: "hidden",
  },
  eventContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.m,
  },
  eventLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.m,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: {
    ...theme.typography.body,
    fontWeight: "700",
    color: "#FFFFFF",
    fontSize: 15,
  },
  eventType: {
    ...theme.typography.caption,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amountLabel: {
    ...theme.typography.caption,
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 10,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  amount: {
    ...theme.typography.body,
    fontWeight: "700",
    color: "#FFFFFF",
    fontSize: 16,
  },
  eventSection: {
    marginBottom: theme.spacing.l,
  },
  sectionTitle: {
    ...theme.typography.body,
    fontWeight: "700",
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.s,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.m,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.status.error,
    ...theme.shadows.small,
  },
  summaryLabel: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  summaryValue: {
    ...theme.typography.h3,
    color: theme.colors.status.error,
  },
  legendContainer: {
    flexDirection: "row",
    marginTop: theme.spacing.l,
    gap: theme.spacing.l,
    justifyContent: "center",
    paddingBottom: theme.spacing.xl,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  backButton: {
    padding: theme.spacing.s,
  },
});
