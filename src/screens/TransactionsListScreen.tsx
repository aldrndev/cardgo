import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SectionList,
  ScrollView,
  TextInput,
  Animated,
  Modal,
  FlatList,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../constants/theme";
import { useCards } from "../context/CardsContext";
import { RootStackParamList } from "../navigation/types";
import { Transaction } from "../types/card";
import { formatCurrency, formatForeignCurrency } from "../utils/formatters";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { getBillingCycleRange } from "../utils/billingCycle";
import { getCategoryIcon } from "../utils/categoryIcons";
import { FloatingActionButton } from "../components/FloatingActionButton";

type TransactionsListScreenRouteProp = RouteProp<
  RootStackParamList,
  "TransactionsList"
>;

type TransactionsListScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "TransactionsList"
>;

const categories = [
  "Makanan & Minuman",
  "Transportasi",
  "Belanja",
  "Tagihan",
  "Hiburan",
  "Kesehatan",
  "Pendidikan",
  "Lainnya",
];

const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const TransactionsListScreen = () => {
  const navigation = useNavigation<TransactionsListScreenNavigationProp>();
  const route = useRoute<TransactionsListScreenRouteProp>();
  const { cardId } = route.params;
  const { cards, transactions, deleteTransaction } = useCards();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "all" | "month" | "custom"
  >("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const card = cardId ? cards.find((c) => c.id === cardId) : null;

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter((t) =>
      cardId ? t.cardId === cardId : true
    );

    if (searchQuery) {
      filtered = filtered.filter((t) =>
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    if (selectedPeriod === "month") {
      if (card) {
        // Use Smart Billing Cycle for specific card
        const { startDate, endDate } = getBillingCycleRange(
          card.billingCycleDay
        );
        filtered = filtered.filter((t) => {
          const tDate = new Date(t.date);
          return tDate >= startDate && tDate <= endDate;
        });
      } else {
        // Use Calendar Month for "All Transactions"
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        filtered = filtered.filter((t) => {
          const date = new Date(t.date);
          return (
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear
          );
        });
      }
    } else if (selectedPeriod === "custom") {
      // Filter by selected month and year
      filtered = filtered.filter((t) => {
        const date = new Date(t.date);
        return (
          date.getMonth() === selectedMonth &&
          date.getFullYear() === selectedYear
        );
      });
    }

    return filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [
    transactions,
    cardId,
    selectedCategory,
    selectedPeriod,
    searchQuery,
    card,
    selectedMonth,
    selectedYear,
  ]);

  const sections = useMemo(() => {
    const grouped = filteredTransactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let title = date.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      if (date.toDateString() === today.toDateString()) {
        title = "Hari Ini";
      } else if (date.toDateString() === yesterday.toDateString()) {
        title = "Kemarin";
      }

      if (!acc[title]) {
        acc[title] = [];
      }
      acc[title].push(transaction);
      return acc;
    }, {} as Record<string, Transaction[]>);

    return Object.keys(grouped).map((title) => ({
      title,
      data: grouped[title],
    }));
  }, [filteredTransactions]);

  const totalSpending = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const handleDelete = (id: string) => {
    Alert.alert(
      "Hapus Transaksi",
      "Apakah Anda yakin ingin menghapus transaksi ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            await deleteTransaction(id);
          },
        },
      ]
    );
  };

  const renderRightActions = (id: string) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDelete(id)}
      >
        <Ionicons name="trash-outline" size={24} color="white" />
      </TouchableOpacity>
    );
  };

  const getPeriodText = () => {
    if (selectedPeriod === "custom") {
      return `${monthNames[selectedMonth]} ${selectedYear}`;
    } else if (selectedPeriod === "month") {
      return card ? "Siklus Ini" : "Bulan Ini";
    }
    return "Semua Waktu";
  };

  const renderTransactionRow = (
    item: Transaction,
    index: number,
    dayData: Transaction[]
  ) => {
    const { iconName, iconColor } = getCategoryIcon(item.category);
    const itemCard = cards.find((c) => c.id === item.cardId);
    const isLast = index === dayData.length - 1;

    return (
      <Swipeable
        key={item.id}
        renderRightActions={() => renderRightActions(item.id)}
      >
        <TouchableOpacity
          style={[styles.transactionRow, !isLast && styles.rowSeparator]}
          activeOpacity={0.7}
        >
          {/* Icon */}
          <View
            style={[styles.iconSquircle, { backgroundColor: iconColor + "15" }]}
          >
            <Ionicons name={iconName} size={28} color={iconColor} />
          </View>

          {/* Content */}
          <View style={styles.rowContent}>
            <View style={styles.rowTop}>
              <Text style={styles.rowTitle}>{item.description}</Text>
              <View style={{ alignItems: "flex-end" }}>
                {item.currency &&
                item.currency !== "IDR" &&
                item.originalAmount ? (
                  <>
                    <Text style={styles.rowAmount}>
                      {formatForeignCurrency(
                        item.originalAmount,
                        item.currency
                      )}
                    </Text>
                    <Text style={[styles.rowSubtitle, { fontSize: 11 }]}>
                      ≈ {formatCurrency(item.amount)}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.rowAmount}>
                    {formatCurrency(item.amount)}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.rowBottom}>
              <Text style={styles.rowSubtitle}>
                {new Date(item.date).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              {item.installmentId && (
                <View style={styles.miniBadge}>
                  <Text style={styles.miniBadgeText}>Cicilan</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const renderDayCard = ({
    item,
  }: {
    item: { title: string; data: Transaction[] };
  }) => {
    const dayTotal = item.data.reduce((sum, t) => sum + t.amount, 0);

    return (
      <View>
        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle}>{item.title}</Text>
          <View style={styles.swipeHintContainer}>
            <Text style={styles.swipeHintText}>Geser ke kiri untuk hapus</Text>
            <Ionicons
              name="arrow-forward"
              size={12}
              color={theme.colors.text.tertiary}
            />
          </View>
        </View>
        <View style={styles.dayCard}>
          <View style={styles.dayContent}>
            {item.data.map((transaction, index) =>
              renderTransactionRow(transaction, index, item.data)
            )}
          </View>
        </View>
      </View>
    );
  };

  // ... inside return ...

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
        <Text style={styles.title}>
          {card ? `Transaksi ${card.alias}` : "Semua Transaksi"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.summaryWrapper}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryContent}>
            <View>
              <Text style={styles.summaryLabel}>Total Pengeluaran</Text>
              <Text style={styles.summaryAmount}>
                {formatCurrency(totalSpending)}
              </Text>
            </View>
            <View style={styles.summaryBadge}>
              <Ionicons name="receipt-outline" size={16} color="white" />
              <Text style={styles.summaryBadgeText}>
                {filteredTransactions.length}
              </Text>
            </View>
          </View>
          <View style={styles.summaryFooter}>
            <Text style={styles.summaryPeriod}>{getPeriodText()}</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color={theme.colors.text.tertiary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari transaksi..."
          placeholderTextColor={theme.colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedPeriod === "month" && styles.filterChipActive,
            ]}
            onPress={() => setSelectedPeriod("month")}
          >
            <Text
              style={[
                styles.filterText,
                selectedPeriod === "month" && styles.filterTextActive,
              ]}
            >
              {card ? "Siklus Ini" : "Bulan Ini"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedPeriod === "custom" && styles.filterChipActive,
            ]}
            onPress={() => setShowMonthPicker(true)}
          >
            <Text
              style={[
                styles.filterText,
                selectedPeriod === "custom" && styles.filterTextActive,
              ]}
            >
              Pilih Bulan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedPeriod === "all" && styles.filterChipActive,
            ]}
            onPress={() => setSelectedPeriod("all")}
          >
            <Text
              style={[
                styles.filterText,
                selectedPeriod === "all" && styles.filterTextActive,
              ]}
            >
              Semua
            </Text>
          </TouchableOpacity>
          <View style={styles.verticalDivider} />
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCategory !== null && styles.filterChipActive,
            ]}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Text
              style={[
                styles.filterText,
                selectedCategory !== null && styles.filterTextActive,
              ]}
            >
              {selectedCategory || "Pilih Kategori"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <FlatList
        data={sections}
        renderItem={renderDayCard}
        keyExtractor={(item) => item.title}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="receipt-outline"
              size={64}
              color={theme.colors.text.tertiary}
            />
            <Text style={styles.emptyText}>Belum ada transaksi</Text>
          </View>
        }
      />

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.monthPickerModal}>
            <Text style={styles.modalTitle}>Pilih Bulan & Tahun</Text>

            {/* Year Selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.yearScroll}
              contentContainerStyle={styles.yearScrollContent}
            >
              {[
                now.getFullYear(),
                now.getFullYear() - 1,
                now.getFullYear() - 2,
              ].map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearChip,
                    selectedYear === year && styles.yearChipActive,
                  ]}
                  onPress={() => setSelectedYear(year)}
                >
                  <Text
                    style={[
                      styles.yearText,
                      selectedYear === year && styles.yearTextActive,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Month Grid */}
            <View style={styles.monthGrid}>
              {monthNames.map((month, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.monthChip,
                    selectedMonth === index && styles.monthChipActive,
                  ]}
                  onPress={() => setSelectedMonth(index)}
                >
                  <Text
                    style={[
                      styles.monthText,
                      selectedMonth === index && styles.monthTextActive,
                    ]}
                  >
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowMonthPicker(false)}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  setSelectedPeriod("custom");
                  setShowMonthPicker(false);
                }}
              >
                <Text style={styles.confirmButtonText}>Terapkan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.monthPickerModal}>
            <Text style={styles.modalTitle}>Pilih Kategori</Text>

            <CategoryPickerContent
              currentCategory={selectedCategory}
              onSelect={(cat) => {
                setSelectedCategory(cat);
                setShowCategoryPicker(false);
              }}
              onClose={() => setShowCategoryPicker(false)}
            />
          </View>
        </View>
      </Modal>
      <FloatingActionButton
        onPress={() =>
          navigation.navigate("AddTransaction", { cardId: cardId || "" })
        }
      />
    </SafeAreaView>
  );
};

const CategoryPickerContent = ({
  currentCategory,
  onSelect,
  onClose,
}: {
  currentCategory: string | null;
  onSelect: (cat: string | null) => void;
  onClose: () => void;
}) => {
  const [tempCategory, setTempCategory] = useState<string | null>(
    currentCategory
  );

  return (
    <>
      <View style={styles.categoryGrid}>
        <TouchableOpacity
          style={styles.categoryItem}
          onPress={() => setTempCategory(null)}
        >
          <View
            style={[
              styles.categoryIcon,
              tempCategory === null && styles.categoryIconActive,
            ]}
          >
            <Ionicons
              name="grid-outline"
              size={24}
              color={
                tempCategory === null
                  ? theme.colors.text.inverse
                  : theme.colors.text.primary
              }
            />
          </View>
          <Text
            style={[
              styles.categoryLabel,
              tempCategory === null && styles.categoryLabelActive,
            ]}
          >
            Semua
          </Text>
        </TouchableOpacity>

        {categories.map((cat) => {
          const { iconName, iconColor } = getCategoryIcon(cat);
          const isSelected = tempCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={styles.categoryItem}
              onPress={() => setTempCategory(cat)}
            >
              <View
                style={[
                  styles.categoryIcon,
                  isSelected && { backgroundColor: iconColor },
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={24}
                  color={isSelected ? "#FFF" : iconColor}
                />
              </View>
              <Text
                style={[
                  styles.categoryLabel,
                  isSelected && styles.categoryLabelActive,
                ]}
                numberOfLines={1}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.modalActions}>
        <TouchableOpacity
          style={[styles.modalButton, styles.cancelButton]}
          onPress={onClose}
        >
          <Text style={styles.cancelButtonText}>Batal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalButton, styles.confirmButton]}
          onPress={() => onSelect(tempCategory)}
        >
          <Text style={styles.confirmButtonText}>Terapkan</Text>
        </TouchableOpacity>
      </View>
    </>
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
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.s,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: 12,
    borderRadius: 16,
    ...theme.shadows.small,
    marginTop: 20,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text.primary,
    padding: 0,
  },
  summaryWrapper: {
    paddingHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.m,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 20,
    ...theme.shadows.medium,
  },
  summaryContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  summaryLabel: {
    ...theme.typography.caption,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
  },
  summaryAmount: {
    ...theme.typography.h2,
    color: "white",
    fontSize: 28,
  },
  summaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  summaryBadgeText: {
    ...theme.typography.caption,
    color: "white",
    fontWeight: "600",
  },
  summaryFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryPeriod: {
    ...theme.typography.caption,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  filtersContainer: {
    paddingVertical: theme.spacing.s,
    // borderBottomWidth: 1,
    // borderBottomColor: theme.colors.border,
  },
  filtersContent: {
    paddingHorizontal: theme.spacing.l,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: "600",
  },
  filterTextActive: {
    color: theme.colors.text.inverse,
  },
  verticalDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
    alignSelf: "center",
    marginHorizontal: 4,
  },
  listContent: {
    padding: theme.spacing.m,
    paddingBottom: 100,
  },
  dayCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    marginBottom: 20,
    ...theme.shadows.small,
    overflow: "hidden",
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  dayTitle: {
    ...theme.typography.body,
    fontWeight: "700",
    color: theme.colors.text.primary,
    fontSize: 15,
  },
  dayTotal: {
    ...theme.typography.caption,
    fontWeight: "700",
    color: theme.colors.text.secondary,
  },
  dayContent: {
    paddingVertical: 4,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
  },
  rowSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + "40",
  },
  iconSquircle: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  rowContent: {
    flex: 1,
    gap: 4,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowTitle: {
    ...theme.typography.body,
    fontWeight: "600",
    color: theme.colors.text.primary,
    fontSize: 16, // Increased from 15
    flex: 1,
    marginRight: 8,
  },
  rowAmount: {
    ...theme.typography.body,
    fontWeight: "700",
    color: theme.colors.text.primary,
    fontSize: 14,
  },
  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    fontSize: 12,
    flex: 1,
  },
  miniBadge: {
    backgroundColor: theme.colors.primary + "15",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  miniBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.s,
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    ...theme.typography.body,
    fontWeight: "700",
    color: theme.colors.text.primary,
    marginRight: 12,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  swipeHintContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  swipeHintText: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    fontSize: 10,
  },

  deleteAction: {
    backgroundColor: theme.colors.status.error,
    justifyContent: "center",
    alignItems: "center",
    width: 50,
    height: 50,
    borderRadius: 30,
    alignSelf: "center",
    marginRight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.m,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  monthPickerModal: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.l,
    paddingBottom: 40,
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.m,
    textAlign: "center",
  },
  yearScroll: {
    marginBottom: theme.spacing.m,
  },
  yearScrollContent: {
    gap: 8,
  },
  yearChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  yearChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  yearText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    fontWeight: "600",
  },
  yearTextActive: {
    color: theme.colors.text.inverse,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: theme.spacing.l,
  },
  monthChip: {
    width: "30%",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  monthChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  monthText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: "600",
  },
  monthTextActive: {
    color: theme.colors.text.inverse,
  },
  modalActions: {
    flexDirection: "row",
    gap: theme.spacing.m,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonText: {
    ...theme.typography.button,
    color: theme.colors.text.secondary,
  },
  confirmButtonText: {
    ...theme.typography.button,
    color: theme.colors.text.inverse,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "flex-start",
  },
  categoryItem: {
    width: "29%", // 3 columns
    alignItems: "center",
    marginBottom: 16,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryIconActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: "center",
    fontSize: 11,
  },
  categoryLabelActive: {
    color: theme.colors.primary,
    fontWeight: "bold",
  },
});
