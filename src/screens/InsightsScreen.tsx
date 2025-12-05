import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { PieChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { useCards } from "../context/CardsContext";
import { formatCurrency } from "../utils/formatters";
import { moderateScale, scale } from "../utils/responsive";

const { width } = Dimensions.get("window");

// Distinct color palette
const COLOR_PALETTE = [
  "#FF6B6B",
  "#845EC2",
  "#F9A826",
  "#2ECC71",
  "#3498DB",
  "#E74C3C",
  "#9B59B6",
  "#1ABC9C",
  "#F39C12",
  "#D35400",
];

export const InsightsScreen = () => {
  const { cards, transactions } = useCards();
  const [selectedPeriod, setSelectedPeriod] = useState<"month" | "year">(
    "month"
  );
  const [selectedDate, setSelectedDate] = useState(new Date());

  const navigateDate = (direction: -1 | 1) => {
    const newDate = new Date(selectedDate);
    if (selectedPeriod === "month") {
      newDate.setMonth(newDate.getMonth() + direction);
    } else {
      newDate.setFullYear(newDate.getFullYear() + direction);
    }
    setSelectedDate(newDate);
  };

  // Filter transactions by period
  const filteredTransactions = useMemo(() => {
    const targetMonth = selectedDate.getMonth();
    const targetYear = selectedDate.getFullYear();

    return transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      if (selectedPeriod === "month") {
        return (
          txDate.getMonth() === targetMonth &&
          txDate.getFullYear() === targetYear
        );
      }
      return txDate.getFullYear() === targetYear;
    });
  }, [transactions, selectedPeriod, selectedDate]);

  // Previous period transactions for comparison
  const prevPeriodTransactions = useMemo(() => {
    const prevDate = new Date(selectedDate);
    if (selectedPeriod === "month") {
      prevDate.setMonth(prevDate.getMonth() - 1);
    } else {
      prevDate.setFullYear(prevDate.getFullYear() - 1);
    }
    const targetMonth = prevDate.getMonth();
    const targetYear = prevDate.getFullYear();

    return transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      if (selectedPeriod === "month") {
        return (
          txDate.getMonth() === targetMonth &&
          txDate.getFullYear() === targetYear
        );
      }
      return txDate.getFullYear() === targetYear;
    });
  }, [transactions, selectedPeriod, selectedDate]);

  // Total spending
  const totalSpending = filteredTransactions.reduce(
    (sum, tx) => sum + tx.amount,
    0
  );
  const prevTotalSpending = prevPeriodTransactions.reduce(
    (sum, tx) => sum + tx.amount,
    0
  );
  const changePercent =
    prevTotalSpending > 0
      ? ((totalSpending - prevTotalSpending) / prevTotalSpending) * 100
      : 0;
  const avgTransaction =
    filteredTransactions.length > 0
      ? totalSpending / filteredTransactions.length
      : 0;

  // Weekly trend (last 7 days)
  const weeklyTrend = useMemo(() => {
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayTx = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return tDate.toDateString() === date.toDateString();
      });
      trend.push({
        label: dayNames[date.getDay()],
        amount: dayTx.reduce((sum, t) => sum + t.amount, 0),
      });
    }
    return trend;
  }, [transactions]);

  const maxTrendValue = Math.max(...weeklyTrend.map((t) => t.amount), 1);

  // Category breakdown
  const categoryData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    filteredTransactions.forEach((tx) => {
      const cat = tx.category || "Other";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + tx.amount;
    });

    return Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount], index) => ({
        name,
        population: amount,
        color: COLOR_PALETTE[index % COLOR_PALETTE.length],
        legendFontColor: theme.colors.text.secondary,
        legendFontSize: 12,
        percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0,
      }));
  }, [filteredTransactions, totalSpending]);

  // Card spending with limit usage
  const cardSpendingData = useMemo(() => {
    return cards
      .filter((c) => !c.isArchived)
      .map((card) => {
        const cardTx = filteredTransactions.filter(
          (tx) => tx.cardId === card.id
        );
        return {
          card,
          spending: cardTx.reduce((sum, tx) => sum + tx.amount, 0),
          txCount: cardTx.length,
          usagePercent: (card.currentUsage / card.creditLimit) * 100,
        };
      })
      .filter((d) => d.spending > 0 || d.usagePercent > 0)
      .sort((a, b) => b.spending - a.spending);
  }, [cards, filteredTransactions]);

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: () => theme.colors.primary,
    labelColor: () => theme.colors.text.secondary,
  };

  const formatShortCurrency = (amount: number) => {
    if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1)}jt`;
    if (amount >= 1000) return `Rp ${(amount / 1000).toFixed(0)}rb`;
    return `Rp ${amount}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === "month" && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod("month")}
        >
          <Text
            style={[
              styles.periodText,
              selectedPeriod === "month" && styles.periodTextActive,
            ]}
          >
            Bulanan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === "year" && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod("year")}
        >
          <Text
            style={[
              styles.periodText,
              selectedPeriod === "year" && styles.periodTextActive,
            ]}
          >
            Tahunan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Navigator */}
      <View style={styles.dateNavigator}>
        <TouchableOpacity
          onPress={() => navigateDate(-1)}
          style={styles.navButton}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.dateLabel}>
          {selectedPeriod === "month"
            ? selectedDate.toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric",
              })
            : selectedDate.getFullYear().toString()}
        </Text>
        <TouchableOpacity
          onPress={() => navigateDate(1)}
          style={styles.navButton}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Summary Card */}
        <LinearGradient
          colors={["#00A896", "#028090"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryLabel}>Total Pengeluaran</Text>
          <Text style={styles.summaryAmount}>
            {formatCurrency(totalSpending)}
          </Text>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {filteredTransactions.length}
              </Text>
              <Text style={styles.statLabel}>Transaksi</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatShortCurrency(avgTransaction)}
              </Text>
              <Text style={styles.statLabel}>Rata-rata</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.changeRow}>
                <Ionicons
                  name={changePercent >= 0 ? "arrow-up" : "arrow-down"}
                  size={14}
                  color="#FFF"
                />
                <Text style={styles.statValue}>
                  {Math.abs(changePercent).toFixed(0)}%
                </Text>
              </View>
              <Text style={styles.statLabel}>vs Sebelum</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Weekly Trend */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tren 7 Hari Terakhir</Text>
          <View style={styles.chartBars}>
            {weeklyTrend.map((item, index) => (
              <View key={index} style={styles.barColumn}>
                <Text style={styles.barValue}>
                  {item.amount > 0 ? formatShortCurrency(item.amount) : "-"}
                </Text>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height:
                          item.amount > 0
                            ? `${Math.max(
                                (item.amount / maxTrendValue) * 100,
                                8
                              )}%`
                            : 4,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Kategori Pengeluaran</Text>
            <View
              style={{ alignItems: "center", marginBottom: theme.spacing.m }}
            >
              <PieChart
                data={categoryData}
                width={width - 80}
                height={180}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="50"
                hasLegend={false}
                absolute
              />
            </View>
            <View style={styles.legendList}>
              {categoryData.slice(0, 5).map((item, index) => (
                <View key={index} style={styles.legendRow}>
                  <View style={styles.legendLeft}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: item.color },
                      ]}
                    />
                    <Text style={styles.legendName} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                  <View style={styles.legendRight}>
                    <Text style={styles.legendAmount}>
                      {formatShortCurrency(item.population)}
                    </Text>
                    <Text style={styles.legendPercent}>
                      {item.percentage.toFixed(0)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Card Usage */}
        {cardSpendingData.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Penggunaan Kartu</Text>
            {cardSpendingData.slice(0, 4).map((item) => (
              <View key={item.card.id} style={styles.cardUsageItem}>
                <View style={styles.cardUsageHeader}>
                  <View style={styles.cardNameRow}>
                    <View
                      style={[
                        styles.cardDot,
                        {
                          backgroundColor:
                            item.card.colorTheme || theme.colors.primary,
                        },
                      ]}
                    />
                    <Text style={styles.cardUsageName} numberOfLines={1}>
                      {item.card.alias}
                    </Text>
                  </View>
                  <Text style={styles.cardUsageSpending}>
                    {formatShortCurrency(item.spending)}
                  </Text>
                </View>
                <View style={styles.usageBarBg}>
                  <View
                    style={[
                      styles.usageBarFill,
                      {
                        width: `${Math.min(item.usagePercent, 100)}%`,
                        backgroundColor:
                          item.usagePercent > 80
                            ? theme.colors.status.error
                            : item.usagePercent > 50
                            ? theme.colors.status.warning
                            : theme.colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.usageText}>
                  {item.usagePercent.toFixed(0)}% limit • {item.txCount}{" "}
                  transaksi
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {categoryData.length === 0 && cardSpendingData.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name="pie-chart-outline"
              size={48}
              color={theme.colors.text.tertiary}
            />
            <Text style={styles.emptyTitle}>Belum Ada Data</Text>
            <Text style={styles.emptyDesc}>
              Tidak ada transaksi di periode ini
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.m,
    padding: 4,
    borderRadius: theme.borderRadius.l,
  },
  periodButton: {
    flex: 1,
    paddingVertical: theme.spacing.m,
    alignItems: "center",
    borderRadius: theme.borderRadius.m,
  },
  periodButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  periodText: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: theme.colors.text.secondary,
  },
  periodTextActive: {
    color: "#FFF",
  },
  dateNavigator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.m,
  },
  navButton: {
    padding: theme.spacing.s,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
  },
  dateLabel: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: theme.colors.text.primary,
  },
  content: {
    paddingHorizontal: theme.spacing.m,
  },
  summaryCard: {
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.m,
  },
  summaryLabel: {
    fontSize: moderateScale(13),
    color: "rgba(255,255,255,0.8)",
  },
  summaryAmount: {
    fontSize: moderateScale(28),
    fontWeight: "700",
    color: "#FFF",
    marginTop: theme.spacing.xs,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: theme.spacing.m,
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#FFF",
  },
  statLabel: {
    fontSize: moderateScale(11),
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
  },
  cardTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.m,
  },
  chartBars: {
    flexDirection: "row",
    height: scale(130),
    gap: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
  },
  barValue: {
    fontSize: moderateScale(8),
    color: theme.colors.text.tertiary,
    marginBottom: 4,
    height: 20,
    textAlign: "center",
  },
  barWrapper: {
    flex: 1,
    width: "75%",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: moderateScale(11),
    color: theme.colors.text.secondary,
    marginTop: 6,
    fontWeight: "500",
  },
  legendList: {
    gap: theme.spacing.s,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.xs,
  },
  legendLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: theme.spacing.s,
  },
  legendName: {
    fontSize: moderateScale(14),
    color: theme.colors.text.primary,
    flex: 1,
  },
  legendRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.m,
  },
  legendAmount: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: theme.colors.text.primary,
    minWidth: 65,
    textAlign: "right",
  },
  legendPercent: {
    fontSize: moderateScale(12),
    color: theme.colors.text.secondary,
    minWidth: 30,
    textAlign: "right",
  },
  cardUsageItem: {
    marginBottom: theme.spacing.m,
    paddingBottom: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cardUsageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  cardNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.s,
  },
  cardUsageName: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: theme.colors.text.primary,
    flex: 1,
  },
  cardUsageSpending: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: theme.colors.text.primary,
  },
  usageBarBg: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    marginVertical: theme.spacing.xs,
  },
  usageBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  usageText: {
    fontSize: moderateScale(11),
    color: theme.colors.text.tertiary,
  },
  emptyState: {
    alignItems: "center",
    padding: theme.spacing.xxl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.l,
  },
  emptyTitle: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: theme.colors.text.primary,
    marginTop: theme.spacing.m,
  },
  emptyDesc: {
    fontSize: moderateScale(14),
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.s,
    textAlign: "center",
  },
});
