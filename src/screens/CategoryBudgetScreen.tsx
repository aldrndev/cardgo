import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { useCards } from "../context/CardsContext";
import { storage } from "../utils/storage";
import { formatCurrency } from "../utils/formatters";
import { moderateScale, scale } from "../utils/responsive";
import { getCategoryIcon } from "../utils/categoryIcons";

interface CategoryBudget {
  category: string;
  budget: number;
  alertThreshold: number; // 0-100 percentage
}

export const CategoryBudgetScreen = () => {
  const navigation = useNavigation();
  const { transactions } = useCards();
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [thresholdInput, setThresholdInput] = useState("80");

  // Get all unique categories from transactions
  const categories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((t) => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats).sort();
  }, [transactions]);

  // Calculate current month spending per category
  const categorySpending = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const spending: Record<string, number> = {};
    transactions
      .filter((t) => {
        const date = new Date(t.date);
        return (
          date.getMonth() === currentMonth && date.getFullYear() === currentYear
        );
      })
      .forEach((t) => {
        spending[t.category] = (spending[t.category] || 0) + t.amount;
      });
    return spending;
  }, [transactions]);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    const saved = await storage.getCategoryBudgets();
    setBudgets(saved);
  };

  const saveBudget = async (category: string) => {
    const amount = parseFloat(budgetInput.replace(/[^0-9]/g, ""));
    const threshold = parseInt(thresholdInput) || 80;

    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Masukkan nominal budget yang valid");
      return;
    }

    const existing = budgets.findIndex((b) => b.category === category);
    let newBudgets: CategoryBudget[];

    if (existing >= 0) {
      newBudgets = budgets.map((b, i) =>
        i === existing ? { ...b, budget: amount, alertThreshold: threshold } : b
      );
    } else {
      newBudgets = [
        ...budgets,
        { category, budget: amount, alertThreshold: threshold },
      ];
    }

    await storage.saveCategoryBudgets(newBudgets);
    setBudgets(newBudgets);
    setEditingCategory(null);
    setBudgetInput("");
    setThresholdInput("80");
  };

  const removeBudget = async (category: string) => {
    Alert.alert("Hapus Budget", `Hapus budget untuk kategori "${category}"?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          const newBudgets = budgets.filter((b) => b.category !== category);
          await storage.saveCategoryBudgets(newBudgets);
          setBudgets(newBudgets);
        },
      },
    ]);
  };

  const getBudgetForCategory = (category: string) => {
    return budgets.find((b) => b.category === category);
  };

  const getSpendingPercentage = (category: string) => {
    const budget = getBudgetForCategory(category);
    const spent = categorySpending[category] || 0;
    if (!budget || budget.budget <= 0) return 0;
    return (spent / budget.budget) * 100;
  };

  const formatNumberInput = (text: string) => {
    const num = text.replace(/[^0-9]/g, "");
    if (!num) return "";
    return new Intl.NumberFormat("id-ID").format(parseInt(num));
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Budget per Kategori</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.infoText}>
            Atur batas pengeluaran per kategori. Kamu akan mendapat peringatan
            saat mencapai threshold yang ditentukan.
          </Text>
        </View>

        {/* Categories List */}
        {categories.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="folder-open-outline"
              size={48}
              color={theme.colors.text.tertiary}
            />
            <Text style={styles.emptyTitle}>Belum Ada Kategori</Text>
            <Text style={styles.emptyDesc}>
              Tambahkan transaksi terlebih dahulu untuk melihat kategori.
            </Text>
          </View>
        ) : (
          categories.map((category) => {
            const budget = getBudgetForCategory(category);
            const spent = categorySpending[category] || 0;
            const percentage = getSpendingPercentage(category);
            const isOverThreshold =
              budget && percentage >= budget.alertThreshold;
            const isOverBudget = budget && percentage >= 100;

            return (
              <View key={category} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryInfo}>
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name={getCategoryIcon(category) as any}
                        size={20}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View>
                      <Text style={styles.categoryName}>{category}</Text>
                      <Text style={styles.categorySpent}>
                        Terpakai: {formatCurrency(spent)}
                      </Text>
                    </View>
                  </View>
                  {budget ? (
                    <TouchableOpacity
                      onPress={() => removeBudget(category)}
                      style={styles.removeButton}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={theme.colors.status.error}
                      />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        setEditingCategory(category);
                        setBudgetInput("");
                        setThresholdInput("80");
                      }}
                      style={styles.addButton}
                    >
                      <Ionicons
                        name="add"
                        size={20}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.addButtonText}>Set Budget</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Budget Progress */}
                {budget && (
                  <View style={styles.budgetSection}>
                    <View style={styles.budgetRow}>
                      <Text style={styles.budgetLabel}>
                        Budget: {formatCurrency(budget.budget)}
                      </Text>
                      <Text
                        style={[
                          styles.budgetPercentage,
                          isOverBudget && styles.textDanger,
                          isOverThreshold &&
                            !isOverBudget &&
                            styles.textWarning,
                        ]}
                      >
                        {percentage.toFixed(0)}%
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
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
                    <Text style={styles.thresholdHint}>
                      Alert pada {budget.alertThreshold}%
                    </Text>
                  </View>
                )}

                {/* Edit Form */}
                {editingCategory === category && (
                  <View style={styles.editForm}>
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Budget (Rp)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        keyboardType="numeric"
                        value={formatNumberInput(budgetInput)}
                        onChangeText={(text) =>
                          setBudgetInput(text.replace(/\./g, ""))
                        }
                      />
                    </View>
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Alert Threshold (%)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="80"
                        keyboardType="numeric"
                        value={thresholdInput}
                        onChangeText={setThresholdInput}
                        maxLength={3}
                      />
                    </View>
                    <View style={styles.formButtons}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setEditingCategory(null)}
                      >
                        <Text style={styles.cancelButtonText}>Batal</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={() => saveBudget(category)}
                      >
                        <Text style={styles.saveButtonText}>Simpan</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Edit existing budget */}
                {budget && editingCategory !== category && (
                  <TouchableOpacity
                    onPress={() => {
                      setEditingCategory(category);
                      setBudgetInput(budget.budget.toString());
                      setThresholdInput(budget.alertThreshold.toString());
                    }}
                    style={styles.editButton}
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={14}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.editButtonText}>Edit Budget</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: theme.spacing.m,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.primary + "10",
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.m,
    gap: theme.spacing.s,
  },
  infoText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    flex: 1,
    lineHeight: 18,
  },
  categoryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.small,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.m,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: {
    ...theme.typography.body,
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
  categorySpent: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.primary + "10",
  },
  addButtonText: {
    ...theme.typography.caption,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  removeButton: {
    padding: theme.spacing.s,
  },
  budgetSection: {
    marginTop: theme.spacing.m,
    paddingTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.s,
  },
  budgetLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  budgetPercentage: {
    ...theme.typography.body,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  textWarning: {
    color: theme.colors.status.warning,
  },
  textDanger: {
    color: theme.colors.status.error,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  thresholdHint: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
    fontSize: 10,
  },
  editForm: {
    marginTop: theme.spacing.m,
    paddingTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.m,
  },
  inputRow: {
    gap: theme.spacing.xs,
  },
  inputLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.s,
    padding: theme.spacing.m,
    ...theme.typography.body,
    color: theme.colors.text.primary,
  },
  formButtons: {
    flexDirection: "row",
    gap: theme.spacing.m,
  },
  cancelButton: {
    flex: 1,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.border,
    alignItems: "center",
  },
  cancelButtonText: {
    ...theme.typography.body,
    fontWeight: "600",
    color: theme.colors.text.secondary,
  },
  saveButton: {
    flex: 1,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
  },
  saveButtonText: {
    ...theme.typography.body,
    fontWeight: "600",
    color: "#FFF",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.m,
  },
  editButtonText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
  },
  emptyState: {
    alignItems: "center",
    padding: theme.spacing.xxl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.l,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.m,
  },
  emptyDesc: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.s,
    textAlign: "center",
  },
});
