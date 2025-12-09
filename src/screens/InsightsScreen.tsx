import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { PieChart, LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, Theme } from "../context/ThemeContext";
import { useCards } from "../context/CardsContext";
import { formatCurrency } from "../utils/formatters";
import { moderateScale, scale } from "../utils/responsive";
import { storage } from "../utils/storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/types";
import { HealthScoreService } from "../services/HealthScoreService";
import {
  SpendingInsightsService,
  SpendingInsight,
} from "../services/SpendingInsightsService";

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
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();

  // Dynamic styles based on theme
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [selectedPeriod, setSelectedPeriod] = useState<"month" | "year">(
    "month"
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [categoryBudgets, setCategoryBudgets] = useState<
    { category: string; budget: number; alertThreshold: number }[]
  >([]);

  // Load category budgets
  useEffect(() => {
    const loadBudgets = async () => {
      const budgets = await storage.getCategoryBudgets();
      setCategoryBudgets(budgets);
    };
    loadBudgets();
  }, []);

  // Generate smart spending insights
  const spendingInsights = useMemo(() => {
    return SpendingInsightsService.generateInsights(
      transactions,
      cards,
      categoryBudgets
    );
  }, [transactions, cards, categoryBudgets]);

  const handleInsightPress = (insight: SpendingInsight) => {
    if (insight.type === "budget_warning") {
      navigation.navigate("CategoryBudget");
    } else if (
      ["unusual_spending", "category_trend", "savings_tip"].includes(
        insight.type
      )
    ) {
      navigation.navigate("TransactionsList", {
        initialCategory: insight.category,
      });
    } else if (insight.type === "milestone") {
      // Milestone is about credit limit usage, so go to Cards Tab
      navigation.navigate("CardsTab");
    }
  };

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

        // Calculate remaining limit handling shared limits
        let remainingLimit = card.creditLimit - card.currentUsage;

        if (card.useSharedLimit && card.bankId) {
          const groupCards = cards.filter(
            (c) => c.bankId === card.bankId && c.useSharedLimit && !c.isArchived
          );
          const totalGroupUsage = groupCards.reduce(
            (sum, c) => sum + (c.currentUsage || 0),
            0
          );
          remainingLimit = card.creditLimit - totalGroupUsage;
        }

        return {
          card,
          spending: cardTx.reduce((sum, tx) => sum + tx.amount, 0),
          txCount: cardTx.length,
          usagePercent: (card.currentUsage / card.creditLimit) * 100,
          remainingLimit,
        };
      })
      .filter((d) => d.spending > 0 || d.usagePercent > 0)
      .sort((a, b) => b.spending - a.spending);
  }, [cards, filteredTransactions]);

  // Monthly spending trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const trend: { label: string; amount: number }[] = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();

      const monthTx = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return (
          tDate.getMonth() === targetMonth && tDate.getFullYear() === targetYear
        );
      });

      trend.push({
        label: monthNames[targetMonth],
        amount: monthTx.reduce((sum, t) => sum + t.amount, 0),
      });
    }
    return trend;
  }, [transactions]);

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
    labelColor: () => theme.colors.text.secondary,
    strokeWidth: 2,
    decimalPlaces: 0,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: theme.colors.primary,
    },
  };

  // Use formatCurrency from utils for consistency
  // For short display in charts, use same format as formatCurrency
  const formatCompactCurrency = (amount: number) => {
    if (isNaN(amount) || amount === 0) return "Rp 0";
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? "-" : "";

    if (absAmount >= 1_000_000_000) {
      const val = (absAmount / 1_000_000_000).toFixed(2).replace(/\.00$/, "");
      return `${sign}Rp ${val} M`;
    }
    if (absAmount >= 1_000_000) {
      const val = (absAmount / 1_000_000).toFixed(2).replace(/\.00$/, "");
      return `${sign}Rp ${val} Jt`;
    }
    // For < 1 million, show full format
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace(/Rp\s?/, "Rp ");
  };

  // Calculate Health Score
  const healthScore = useMemo(() => {
    return HealthScoreService.calculateHealthScore(cards, transactions);
  }, [cards, transactions]);

  // Get color based on rating
  const getScoreColor = (rating: string) => {
    switch (rating) {
      case "excellent":
        return "#10B981"; // green
      case "good":
        return "#3B82F6"; // blue
      case "fair":
        return "#F59E0B"; // yellow/orange
      case "poor":
        return "#EF4444"; // red
      default:
        return theme.colors.text.secondary;
    }
  };

  const showHealthScoreInfo = () => {
    Alert.alert(
      "All Credit Health Score",
      "Skor kesehatan kredit Anda dihitung dari:\n\n" +
        "• Penggunaan Limit (40%): Menjaga penggunaan di bawah 30% dari total limit.\n" +
        "• Riwayat Pembayaran (30%): Ketepatan waktu pembayaran tagihan.\n" +
        "• Disiplin Budget (20%): Kepatuhan terhadap budget bulanan.\n" +
        "• Trend (10%): Tren penurunan pengeluaran dalam 3 bulan terakhir.\n\n" +
        `Total Skor: ${healthScore.totalScore}/100\n` +
        `Rating: ${healthScore.rating.toUpperCase()}`,
      [{ text: "Mengerti", style: "default" }]
    );
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
            {formatCurrency(totalSpending, Number.MAX_SAFE_INTEGER)}
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
                {formatCompactCurrency(avgTransaction)}
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

        {/* Smart Spending Insights */}
        <View style={styles.insightsSection}>
          <View style={styles.insightsSectionHeader}>
            <Ionicons name="sparkles" size={20} color={theme.colors.primary} />
            <Text style={styles.insightsSectionTitle}>Smart Insights</Text>
            {spendingInsights.length > 0 && (
              <View style={styles.insightsBadge}>
                <Text style={styles.insightsBadgeText}>
                  {spendingInsights.length}
                </Text>
              </View>
            )}
          </View>
          {spendingInsights.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.insightsScrollContent}
              decelerationRate="fast"
              snapToInterval={scale(240) + theme.spacing.m}
            >
              {spendingInsights.slice(0, 5).map((insight, index) => {
                const severityColor = SpendingInsightsService.getSeverityColor(
                  insight.severity,
                  theme
                );
                const gradientColors: [string, string] =
                  insight.severity === "warning"
                    ? ["#FEF3C7", "#FDE68A"]
                    : insight.severity === "success"
                    ? ["#D1FAE5", "#A7F3D0"]
                    : ["#EEF2FF", "#E0E7FF"];
                const darkGradientColors: [string, string] =
                  insight.severity === "warning"
                    ? ["#78350F", "#92400E"]
                    : insight.severity === "success"
                    ? ["#064E3B", "#065F46"]
                    : ["#312E81", "#3730A3"];

                return (
                  <TouchableOpacity
                    key={insight.id}
                    style={styles.insightCardWrapper}
                    activeOpacity={0.9}
                    onPress={() => handleInsightPress(insight)}
                  >
                    <LinearGradient
                      colors={isDark ? darkGradientColors : gradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.insightCard}
                    >
                      {/* Severity Indicator */}
                      <View
                        style={[
                          styles.insightSeverityDot,
                          { backgroundColor: severityColor },
                        ]}
                      />

                      {/* Icon with Background */}
                      <View
                        style={[
                          styles.insightIconContainer,
                          {
                            backgroundColor: "rgba(255,255,255,0.95)",
                          },
                        ]}
                      >
                        <Ionicons
                          name={insight.icon as any}
                          size={20}
                          color={severityColor}
                        />
                      </View>

                      {/* Content */}
                      <Text
                        style={[
                          styles.insightTitle,
                          isDark && { color: "#FFFFFF" },
                        ]}
                        numberOfLines={2}
                      >
                        {insight.title}
                      </Text>
                      <Text
                        style={[
                          styles.insightDescription,
                          isDark && { color: "rgba(255,255,255,0.8)" },
                        ]}
                        numberOfLines={3}
                      >
                        {insight.description}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.insightsEmptyState}>
              <View style={styles.insightsEmptyIcon}>
                <Ionicons
                  name="sparkles"
                  size={32}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.insightsEmptyTitle}>Belum Ada Insight</Text>
              <Text style={styles.insightsEmptyText}>
                Tambahkan lebih banyak transaksi untuk mendapatkan analisis
                pengeluaran cerdas.
              </Text>
            </View>
          )}
        </View>

        {/* Credit Health Score */}
        <View style={styles.card}>
          <View style={styles.healthScoreHeader}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text style={[styles.cardTitle, { marginBottom: 0 }]}>
                All Credit Health Score
              </Text>
              <TouchableOpacity
                onPress={showHealthScoreInfo}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Score Circle */}
          <View style={styles.scoreContainer}>
            <View
              style={[
                styles.scoreCircle,
                { borderColor: getScoreColor(healthScore.rating) },
              ]}
            >
              <Text
                style={[
                  styles.scoreNumber,
                  { color: getScoreColor(healthScore.rating) },
                ]}
              >
                {healthScore.totalScore}
              </Text>
              <Text style={styles.scoreLabel}>/ 100</Text>
            </View>
          </View>

          {/* Breakdown */}
          <Text style={styles.breakdownTitle}>Rincian Skor</Text>

          {/* Penggunaan Limit */}
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownLabel}>Penggunaan Limit</Text>
              <Text style={styles.breakdownScore}>
                {healthScore.breakdown.creditUtilization.score}/40
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      (healthScore.breakdown.creditUtilization.score / 40) * 100
                    }%`,
                    backgroundColor: getScoreColor(
                      healthScore.breakdown.creditUtilization.rating
                    ),
                  },
                ]}
              />
            </View>
            <Text style={styles.breakdownDetail}>
              {healthScore.breakdown.creditUtilization.percentage.toFixed(1)}%
              dari limit terpakai
            </Text>
          </View>

          {/* Riwayat Pembayaran */}
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownLabel}>Riwayat Pembayaran</Text>
              <Text style={styles.breakdownScore}>
                {healthScore.breakdown.paymentHistory.score}/30
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      (healthScore.breakdown.paymentHistory.score / 30) * 100
                    }%`,
                    backgroundColor: getScoreColor(
                      healthScore.breakdown.paymentHistory.rating
                    ),
                  },
                ]}
              />
            </View>
            <Text style={styles.breakdownDetail}>
              {healthScore.breakdown.paymentHistory.onTimeCount} tepat waktu,{" "}
              {healthScore.breakdown.paymentHistory.lateCount} telat
            </Text>
          </View>

          {/* Disiplin Budget */}
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownLabel}>Disiplin Budget</Text>
              <Text style={styles.breakdownScore}>
                {healthScore.breakdown.spendingDiscipline.score}/20
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      (healthScore.breakdown.spendingDiscipline.score / 20) *
                      100
                    }%`,
                    backgroundColor: getScoreColor(
                      healthScore.breakdown.spendingDiscipline.rating
                    ),
                  },
                ]}
              />
            </View>
            <Text style={styles.breakdownDetail}>
              {healthScore.breakdown.spendingDiscipline.budgetUsage > 0
                ? `${healthScore.breakdown.spendingDiscipline.budgetUsage.toFixed(
                    0
                  )}% dari budget`
                : "Belum ada budget"}
            </Text>
          </View>

          {/* Trend */}
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownLabel}>Trend (3 Bulan)</Text>
              <Text style={styles.breakdownScore}>
                {healthScore.breakdown.trend.score}/10
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(healthScore.breakdown.trend.score / 10) * 100}%`,
                    backgroundColor:
                      healthScore.breakdown.trend.direction === "improving"
                        ? "#10B981"
                        : healthScore.breakdown.trend.direction === "declining"
                        ? "#EF4444"
                        : "#6B7280",
                  },
                ]}
              />
            </View>
            <Text style={styles.breakdownDetail}>
              Spending{" "}
              {healthScore.breakdown.trend.direction === "improving"
                ? "menurun ✓"
                : healthScore.breakdown.trend.direction === "declining"
                ? "meningkat ↑"
                : "stabil"}
            </Text>
          </View>
        </View>

        {/* Weekly Trend */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tren 7 Hari Terakhir</Text>
          <View style={styles.chartBars}>
            {weeklyTrend.map((item, index) => (
              <View key={index} style={styles.barColumn}>
                <Text style={styles.barValue}>
                  {item.amount > 0 ? formatCompactCurrency(item.amount) : "-"}
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
                      {formatCompactCurrency(item.population)}
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

        {/* Monthly Spending Trend */}
        {monthlyTrend.some((m) => m.amount > 0) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tren Pengeluaran 6 Bulan</Text>
            <View style={{ paddingRight: 8 }}>
              <LineChart
                data={{
                  labels: monthlyTrend.map((m) => m.label),
                  datasets: [
                    {
                      data: monthlyTrend.map((m) => m.amount || 0),
                      strokeWidth: 2,
                    },
                  ],
                }}
                width={width - 48}
                height={180}
                chartConfig={{
                  ...chartConfig,
                  backgroundGradientFrom: theme.colors.surface,
                  backgroundGradientTo: theme.colors.surface,
                  propsForLabels: {
                    fontSize: 10,
                  },
                }}
                bezier
                style={{
                  borderRadius: theme.borderRadius.m,
                }}
                withInnerLines={false}
                withOuterLines={false}
                formatYLabel={(value) => {
                  const num = parseFloat(value);
                  const absNum = Math.abs(num);
                  const sign = num < 0 ? "-" : "";
                  if (absNum >= 1000000000)
                    return `${sign}Rp ${(absNum / 1000000000).toFixed(1)} M`;
                  if (absNum >= 1000000)
                    return `${sign}Rp ${(absNum / 1000000).toFixed(0)} Jt`;
                  if (absNum >= 1000)
                    return `${sign}Rp ${(absNum / 1000).toFixed(0)} Rb`;
                  return `${sign}Rp ${absNum}`;
                }}
              />
            </View>
            <View style={styles.trendSummary}>
              <View style={styles.trendItem}>
                <Text style={styles.trendLabel}>Tertinggi</Text>
                <Text style={styles.trendValue}>
                  {formatCompactCurrency(
                    Math.max(...monthlyTrend.map((m) => m.amount))
                  )}
                </Text>
              </View>
              <View style={styles.trendItem}>
                <Text style={styles.trendLabel}>Rata-rata</Text>
                <Text style={styles.trendValue}>
                  {formatCompactCurrency(
                    monthlyTrend.reduce((sum, m) => sum + m.amount, 0) / 6
                  )}
                </Text>
              </View>
              <View style={styles.trendItem}>
                <Text style={styles.trendLabel}>Terendah</Text>
                <Text style={styles.trendValue}>
                  {formatCompactCurrency(
                    Math.min(
                      ...monthlyTrend
                        .filter((m) => m.amount > 0)
                        .map((m) => m.amount)
                    ) || 0
                  )}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Budget per Kategori */}
        {categoryBudgets.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Budget Kategori</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("CategoryBudget" as never)}
              >
                <Text style={styles.seeAllText}>Kelola</Text>
              </TouchableOpacity>
            </View>
            {categoryBudgets.slice(0, 5).map((budget) => {
              // Calculate current month spending for this category
              const now = new Date();
              const currentMonthSpending = transactions
                .filter((t) => {
                  const tDate = new Date(t.date);
                  return (
                    t.category === budget.category &&
                    tDate.getMonth() === now.getMonth() &&
                    tDate.getFullYear() === now.getFullYear()
                  );
                })
                .reduce((sum, t) => sum + t.amount, 0);

              const percentage =
                budget.budget > 0
                  ? (currentMonthSpending / budget.budget) * 100
                  : 0;
              const isOverThreshold = percentage >= budget.alertThreshold;
              const isOverBudget = percentage >= 100;

              return (
                <View key={budget.category} style={styles.budgetItem}>
                  <View style={styles.budgetHeader}>
                    <Text style={styles.budgetCategory}>{budget.category}</Text>
                    <Text
                      style={[
                        styles.budgetPercentage,
                        isOverBudget && { color: theme.colors.status.error },
                        isOverThreshold &&
                          !isOverBudget && {
                            color: theme.colors.status.warning,
                          },
                      ]}
                    >
                      {percentage.toFixed(0)}%
                    </Text>
                  </View>
                  <View style={styles.budgetProgressBg}>
                    <View
                      style={[
                        styles.budgetProgressFill,
                        {
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: isOverBudget
                            ? theme.colors.status.error
                            : isOverThreshold
                            ? theme.colors.status.warning
                            : theme.colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.budgetDetails}>
                    <Text style={styles.budgetSpent}>
                      {formatCompactCurrency(currentMonthSpending)}
                    </Text>
                    <Text style={styles.budgetLimit}>
                      dari {formatCompactCurrency(budget.budget)}
                    </Text>
                  </View>
                </View>
              );
            })}
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
                    {formatCompactCurrency(item.spending)}
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
                <View style={styles.usageInfoContainer}>
                  <View>
                    <Text style={styles.usageLabel}>Sisa Limit</Text>
                    <Text style={styles.usageValue}>
                      {formatCurrency(
                        item.remainingLimit,
                        Number.MAX_SAFE_INTEGER
                      )}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.usageLabel}>Total Transaksi</Text>
                    <Text style={styles.usageValue}>
                      {item.txCount} transaksi
                    </Text>
                  </View>
                </View>
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

const getStyles = (theme: Theme) =>
  StyleSheet.create({
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
      color: theme.colors.text.secondary,
      fontWeight: "500",
    },
    usageInfoContainer: {
      marginTop: 4,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    usageLabel: {
      fontSize: moderateScale(10),
      color: theme.colors.text.tertiary,
      marginBottom: 2,
    },
    usageValue: {
      fontSize: moderateScale(11),
      color: theme.colors.text.secondary,
      fontWeight: "500",
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
    trendSummary: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: theme.spacing.m,
      paddingTop: theme.spacing.m,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    trendItem: {
      alignItems: "center",
    },
    trendLabel: {
      fontSize: moderateScale(11),
      color: theme.colors.text.tertiary,
      marginBottom: theme.spacing.xs,
    },
    trendValue: {
      fontSize: moderateScale(14),
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.m,
    },
    seeAllText: {
      fontSize: moderateScale(13),
      fontWeight: "600",
      color: theme.colors.primary,
    },
    budgetItem: {
      marginBottom: theme.spacing.m,
    },
    budgetHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.xs,
    },
    budgetCategory: {
      fontSize: moderateScale(14),
      fontWeight: "500",
      color: theme.colors.text.primary,
    },
    budgetPercentage: {
      fontSize: moderateScale(14),
      fontWeight: "700",
      color: theme.colors.primary,
    },
    budgetProgressBg: {
      height: 6,
      backgroundColor: theme.colors.border,
      borderRadius: 3,
      overflow: "hidden",
    },
    budgetProgressFill: {
      height: "100%",
      borderRadius: 3,
    },
    budgetDetails: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: theme.spacing.xs,
    },
    budgetSpent: {
      fontSize: moderateScale(12),
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
    budgetLimit: {
      fontSize: moderateScale(12),
      color: theme.colors.text.tertiary,
    },
    // Health Score Styles
    healthScoreHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.m,
    },
    ratingBadge: {
      paddingHorizontal: moderateScale(12),
      paddingVertical: moderateScale(4),
      borderRadius: theme.borderRadius.m,
    },
    ratingText: {
      fontSize: moderateScale(10),
      fontWeight: "700",
      textTransform: "uppercase",
    },
    scoreContainer: {
      alignItems: "center",
      paddingVertical: theme.spacing.l,
    },
    scoreCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    scoreNumber: {
      fontSize: moderateScale(40),
      fontWeight: "700",
    },
    scoreLabel: {
      fontSize: moderateScale(14),
      color: theme.colors.text.tertiary,
    },
    breakdownTitle: {
      fontSize: moderateScale(14),
      fontWeight: "600",
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.m,
      marginTop: theme.spacing.s,
    },
    breakdownItem: {
      marginBottom: theme.spacing.m,
    },
    breakdownHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: theme.spacing.xs,
    },
    breakdownLabel: {
      fontSize: moderateScale(12),
      color: theme.colors.text.secondary,
    },
    breakdownScore: {
      fontSize: moderateScale(12),
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
    progressBar: {
      height: 6,
      backgroundColor: theme.colors.border,
      borderRadius: 3,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 3,
    },
    breakdownDetail: {
      fontSize: moderateScale(11),
      color: theme.colors.text.tertiary,
      marginTop: theme.spacing.xs,
    },
    recommendationsContainer: {
      marginTop: theme.spacing.l,
      paddingTop: theme.spacing.m,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    recommendationsTitle: {
      fontSize: moderateScale(14),
      fontWeight: "600",
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.s,
    },
    recommendationItem: {
      flexDirection: "row",
      marginBottom: theme.spacing.xs,
      paddingRight: theme.spacing.m,
    },
    recommendationBullet: {
      fontSize: moderateScale(14),
      color: theme.colors.text.secondary,
      marginRight: theme.spacing.xs,
    },
    recommendationText: {
      flex: 1,
      fontSize: moderateScale(12),
      color: theme.colors.text.secondary,
      lineHeight: 18,
    },
    // Smart Insights Styles
    insightsSection: {
      marginTop: theme.spacing.m,
      marginBottom: theme.spacing.m,
    },
    insightsSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: theme.spacing.m,
      paddingHorizontal: theme.spacing.m,
    },
    insightsSectionTitle: {
      fontSize: moderateScale(16),
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
    insightsBadge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    insightsBadgeText: {
      color: "#FFFFFF",
      fontSize: moderateScale(11),
      fontWeight: "600",
    },
    insightsScrollContent: {
      paddingHorizontal: theme.spacing.m,
      gap: theme.spacing.m,
    },
    insightCardWrapper: {
      width: scale(240),
      minHeight: scale(150),
      borderRadius: theme.borderRadius.l,
      marginRight: theme.spacing.m,
      ...theme.shadows.medium,
    },
    insightCard: {
      flex: 1,
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.m,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
    },
    insightIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.background,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.s,
    },
    insightTitle: {
      fontSize: moderateScale(14),
      fontWeight: "700",
      color: theme.colors.text.primary,
      marginBottom: 6,
      letterSpacing: 0.2,
    },
    insightDescription: {
      fontSize: moderateScale(12),
      color: theme.colors.text.secondary,
      lineHeight: 17,
      opacity: 0.9,
    },
    insightCategoryBadge: {
      alignSelf: "flex-start",
      backgroundColor: "rgba(0,0,0,0.1)",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    insightCategoryText: {
      fontSize: moderateScale(10),
      color: theme.colors.text.primary,
      fontWeight: "600",
    },
    // Additional Insight Card Styles
    insightSeverityDot: {
      position: "absolute",
      top: 14,
      right: 14,
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.5)",
    },
    insightBottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "auto",
    },
    insightActionIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    // Empty State for Insights
    insightsEmptyState: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.m,
      padding: theme.spacing.l,
      marginHorizontal: theme.spacing.m,
      alignItems: "center",
      ...theme.shadows.small,
    },
    insightsEmptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.m,
    },
    insightsEmptyTitle: {
      ...theme.typography.body,
      fontWeight: "600",
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    insightsEmptyText: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      textAlign: "center",
      lineHeight: 18,
    },
  });
