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
import { useNavigation } from "@react-navigation/native";
import { PieChart, BarChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { useCards } from "../context/CardsContext";
import { colors } from "../constants/colors";
import { formatCurrency } from "../utils/formatters";
import { moderateScale } from "../utils/responsive";

const { width } = Dimensions.get("window");

export const InsightsScreen = () => {
  const navigation = useNavigation();
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
      } else {
        return txDate.getFullYear() === targetYear;
      }
    });
  }, [transactions, selectedPeriod, selectedDate]);

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => theme.colors.primary,
    labelColor: (opacity = 1) => theme.colors.text.secondary,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForBackgroundLines: {
      strokeDasharray: "", // solid lines
      stroke: theme.colors.border,
      strokeWidth: 1,
      strokeOpacity: 0.2,
    },
  };

  // Calculate total spending per category
  const categoryData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    const palette = [
      "#FF6B6B", // Red
      "#4ECDC4", // Teal
      "#45B7D1", // Blue
      "#96CEB4", // Green
      "#FFEEAD", // Yellow
      "#D4A5A5", // Pink
      "#9B59B6", // Purple
      "#34495E", // Dark Blue
    ];

    filteredTransactions.forEach((tx) => {
      if (categoryTotals[tx.category]) {
        categoryTotals[tx.category] += tx.amount;
      } else {
        categoryTotals[tx.category] = tx.amount;
      }
    });

    const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

    return Object.keys(categoryTotals)
      .map((key, index) => ({
        name: key,
        population: categoryTotals[key],
        color: palette[index % palette.length],
        legendFontColor: theme.colors.text.secondary,
        legendFontSize: 12,
        percentage: total > 0 ? (categoryTotals[key] / total) * 100 : 0,
      }))
      .sort((a, b) => b.population - a.population);
  }, [filteredTransactions]);

  // Calculate spending per card (List format)
  const cardSpendingData = useMemo(() => {
    const data: { card: any; amount: number; percentage: number }[] = [];
    const total = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    cards.forEach((card) => {
      if (!card.isArchived) {
        const cardSpending = filteredTransactions
          .filter((tx) => tx.cardId === card.id)
          .reduce((sum, tx) => sum + tx.amount, 0);

        if (cardSpending > 0) {
          data.push({
            card,
            amount: cardSpending,
            percentage: total > 0 ? (cardSpending / total) * 100 : 0,
          });
        }
      }
    });

    return data.sort((a, b) => b.amount - a.amount);
  }, [cards, filteredTransactions]);

  const totalSpending = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [filteredTransactions]);

  return (
    <SafeAreaView style={styles.container}>
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
            Bulan Ini
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
            Tahun Ini
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dateNavigator}>
        <TouchableOpacity
          onPress={() => navigateDate(-1)}
          style={styles.navButton}
        >
          <Ionicons
            name="chevron-back"
            size={moderateScale(24)}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.dateLabel}>
          {selectedPeriod === "month"
            ? selectedDate.toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric",
              })
            : selectedDate.getFullYear()}
        </Text>
        <TouchableOpacity
          onPress={() => navigateDate(1)}
          style={styles.navButton}
        >
          <Ionicons
            name="chevron-forward"
            size={moderateScale(24)}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Pengeluaran</Text>
          <Text style={styles.summaryAmount}>
            {formatCurrency(totalSpending)}
          </Text>
        </View>

        {categoryData.length > 0 ? (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Pengeluaran per Kategori</Text>
            <View style={{ alignItems: "center" }}>
              <PieChart
                data={categoryData}
                width={width - theme.spacing.xl * 2}
                height={200}
                chartConfig={chartConfig}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"0"}
                center={[width / 4, 0]}
                absolute
                hasLegend={false}
              />
            </View>
            <View style={styles.legendContainer}>
              {categoryData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={[
                        styles.legendColor,
                        { backgroundColor: item.color },
                      ]}
                    />
                    <Text style={styles.legendName}>{item.name}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.legendAmount}>
                      {formatCurrency(item.population)}
                    </Text>
                    <Text style={styles.legendPercentage}>
                      {item.percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {cardSpendingData.length > 0 ? (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Pengeluaran per Kartu</Text>
            {cardSpendingData.map((item, index) => (
              <View key={index} style={styles.cardSpendingItem}>
                <View style={styles.cardSpendingHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name="card"
                      size={moderateScale(16)}
                      color={theme.colors.text.secondary}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.cardSpendingName}>
                      {item.card.alias.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.cardSpendingAmount}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${item.percentage}%`,
                        backgroundColor:
                          item.card.colorTheme || theme.colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.cardSpendingPercentage}>
                  {item.percentage.toFixed(1)}% dari total
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons
                name="pie-chart-outline"
                size={moderateScale(48)}
                color={theme.colors.text.tertiary}
              />
            </View>
            <Text style={styles.emptyTitle}>Belum Ada Data</Text>
            <Text style={styles.emptyDescription}>
              Tidak ada transaksi pengeluaran di periode ini. Coba pilih bulan
              lain atau tambah transaksi baru.
            </Text>
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
    justifyContent: "center",
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.l,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.s,
  },
  backButtonText: {
    fontSize: 24,
    color: theme.colors.text.primary,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  content: {
    padding: theme.spacing.m,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.l,
    alignItems: "center",
  },
  summaryLabel: {
    ...theme.typography.body,
    color: theme.colors.text.inverse,
    opacity: 0.9,
    marginBottom: theme.spacing.xs,
  },
  summaryAmount: {
    ...theme.typography.h1,
    color: theme.colors.text.inverse,
    fontSize: 32,
  },
  chartContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.small,
  },
  chartTitle: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.m,
    color: theme.colors.text.primary,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
    marginTop: theme.spacing.l,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.l,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: "dashed",
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.m,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.s,
  },
  emptyDescription: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: "center",
    maxWidth: "80%",
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.m,
    padding: 4,
    borderRadius: theme.borderRadius.l,
    ...theme.shadows.small,
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
    ...theme.typography.caption,
    fontWeight: "600",
    color: theme.colors.text.secondary,
  },
  periodTextActive: {
    color: theme.colors.text.inverse,
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
    ...theme.shadows.small,
  },
  dateLabel: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    minWidth: 150,
    textAlign: "center",
  },
  legendContainer: {
    marginTop: theme.spacing.m,
    gap: theme.spacing.s,
  },
  legendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendName: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontSize: 14,
  },
  legendAmount: {
    ...theme.typography.body,
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
  legendPercentage: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  cardSpendingItem: {
    marginBottom: theme.spacing.m,
  },
  cardSpendingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardSpendingName: {
    ...theme.typography.body,
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
  cardSpendingAmount: {
    ...theme.typography.body,
    fontWeight: "700",
    color: theme.colors.text.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  cardSpendingPercentage: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    marginTop: 2,
    textAlign: "right",
  },
});
