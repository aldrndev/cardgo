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
import { useTheme, Theme } from "../context/ThemeContext";
import { useCards } from "../context/CardsContext";
import { storage } from "../utils/storage";
import { formatCurrency } from "../utils/formatters";
import { moderateScale, scale } from "../utils/responsive";
import { getCategoryIcon } from "../utils/categoryIcons";
import { usePremium } from "../context/PremiumContext";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/types";

interface CategoryBudget {
  category: string;
  budget: number;
  alertThreshold: number; // 0-100 percentage
}

export const CategoryBudgetScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { transactions } = useCards();
  const { theme, isDark } = useTheme();
  const { canUseCategoryBudget } = usePremium();

  // Dynamic styles based on theme
  const styles = useMemo(() => getStyles(theme), [theme]);

  // ALL HOOKS MUST BE BEFORE ANY CONDITIONAL RETURNS
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [thresholdInput, setThresholdInput] = useState("80");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Get categories that have active budgets
  const categories = useMemo(() => {
    return budgets.map((b) => b.category).sort();
  }, [budgets]);

  // Categories available to add (from transactions, not yet budgeted)
  const availableCategories = useMemo(() => {
    const transactionCategories = new Set(transactions.map((t) => t.category));
    return Array.from(transactionCategories)
      .filter(
        (c): c is string =>
          typeof c === "string" &&
          !!c &&
          !budgets.some(
            (b) => b.category.toLowerCase().trim() === c.toLowerCase().trim()
          )
      )
      .sort();
  }, [transactions, budgets]);

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

  // Premium check - show locked state for free users
  if (!canUseCategoryBudget()) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
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
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.lockedContainer}>
          <View style={styles.lockedIconContainer}>
            <Ionicons name="diamond" size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.lockedTitle}>Category Budget</Text>
          <Text style={styles.lockedDescription}>
            Atur batas pengeluaran per kategori dan dapatkan peringatan
            otomatis. Upgrade ke Premium untuk membuka fitur ini.
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.navigate("Paywall")}
          >
            <Ionicons name="diamond" size={18} color="#FFF" />
            <Text style={styles.upgradeButtonText}>Upgrade ke Premium</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
    setIsAddingNew(false);
    setNewCategoryName("");
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
        <TouchableOpacity
          style={styles.headerAddButton}
          onPress={() => {
            setIsAddingNew(true);
            setNewCategoryName("");
            setBudgetInput("");
            setThresholdInput("80");
          }}
        >
          <Ionicons name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
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

        {/* Add New Category Form */}
        {isAddingNew && (
          <View style={[styles.categoryCard, { marginBottom: 16 }]}>
            <Text style={styles.sectionTitle}>Tambah Budget Baru</Text>

            {!newCategoryName ? (
              <View>
                <Text style={[styles.inputLabel, { marginBottom: 12 }]}>
                  Pilih Kategori dari Transaksi:
                </Text>
                {availableCategories.length === 0 ? (
                  <View
                    style={{
                      padding: theme.spacing.m,
                      backgroundColor: theme.colors.surface,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      borderRadius: theme.borderRadius.m,
                      borderStyle: "dashed",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        ...theme.typography.caption,
                        color: theme.colors.text.tertiary,
                        textAlign: "center",
                      }}
                    >
                      Semua kategori dari transaksi Anda sudah memiliki budget.
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {availableCategories.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: theme.colors.surface,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 20,
                          gap: 6,
                        }}
                        onPress={() => setNewCategoryName(cat)}
                      >
                        <Ionicons
                          name={getCategoryIcon(cat).iconName as any}
                          size={16}
                          color={
                            getCategoryIcon(cat).iconColor ||
                            theme.colors.primary
                          }
                        />
                        <Text
                          style={{
                            ...theme.typography.caption,
                            color: theme.colors.text.primary,
                            fontWeight: "600",
                          }}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.editForm}>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Kategori Terpilih</Text>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: theme.spacing.m,
                      backgroundColor: theme.colors.background,
                      borderRadius: theme.borderRadius.m,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor:
                            getCategoryIcon(newCategoryName).iconColor + "20",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons
                          name={
                            getCategoryIcon(newCategoryName).iconName as any
                          }
                          size={18}
                          color={
                            getCategoryIcon(newCategoryName).iconColor ||
                            theme.colors.primary
                          }
                        />
                      </View>
                      <Text
                        style={{
                          ...theme.typography.body,
                          fontWeight: "600",
                          color: theme.colors.text.primary,
                        }}
                      >
                        {newCategoryName}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setNewCategoryName("")}>
                      <Text
                        style={{
                          color: theme.colors.primary,
                          fontWeight: "600",
                          fontSize: 12,
                        }}
                      >
                        Ganti
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

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
                    autoFocus
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
                    onPress={() => setIsAddingNew(false)}
                  >
                    <Text style={styles.cancelButtonText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => saveBudget(newCategoryName)}
                  >
                    <Text style={styles.saveButtonText}>Simpan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Categories List */}
        {categories.length === 0 && !isAddingNew ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="folder-open-outline"
              size={48}
              color={theme.colors.text.tertiary}
            />
            <Text style={styles.emptyTitle}>Belum Ada Kategori</Text>
            <Text style={styles.emptyDesc}>
              Tambahkan transaksi atau buat kategori baru untuk mulai budgeting.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setIsAddingNew(true)}
            >
              <Text style={styles.emptyButtonText}>Buat Kategori Baru</Text>
            </TouchableOpacity>
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
                        name={getCategoryIcon(category).iconName as any}
                        size={20}
                        color={
                          getCategoryIcon(category).iconColor ||
                          theme.colors.primary
                        }
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

const getStyles = (theme: Theme) =>
  StyleSheet.create({
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
    headerAddButton: {
      padding: theme.spacing.xs,
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
      height: 6,
      backgroundColor: theme.colors.border,
      borderRadius: 3,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 3,
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
      marginBottom: theme.spacing.m,
    },
    inputLabel: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.m,
      padding: theme.spacing.s,
      ...theme.typography.body,
      color: theme.colors.text.primary,
    },
    formButtons: {
      flexDirection: "row",
      gap: theme.spacing.m,
      marginTop: theme.spacing.xs,
    },
    cancelButton: {
      flex: 1,
      padding: theme.spacing.s,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: theme.borderRadius.m,
      backgroundColor: theme.colors.border,
    },
    cancelButtonText: {
      ...theme.typography.body,
      color: theme.colors.text.secondary,
    },
    saveButton: {
      flex: 1,
      padding: theme.spacing.s,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: theme.borderRadius.m,
      backgroundColor: theme.colors.primary,
    },
    saveButtonText: {
      ...theme.typography.body,
      color: "#FFFFFF",
      fontWeight: "600",
    },
    editButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.m,
      paddingTop: theme.spacing.m,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    editButtonText: {
      ...theme.typography.caption,
      color: theme.colors.primary,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.xl,
      marginTop: theme.spacing.xl,
    },
    emptyTitle: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
      marginTop: theme.spacing.m,
      marginBottom: theme.spacing.xs,
    },
    emptyDesc: {
      ...theme.typography.body,
      color: theme.colors.text.secondary,
      textAlign: "center",
      marginBottom: theme.spacing.l,
    },
    emptyButton: {
      marginTop: theme.spacing.m,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.l,
      paddingVertical: theme.spacing.s,
      borderRadius: theme.borderRadius.round,
    },
    emptyButtonText: {
      color: "#FFFFFF",
      fontWeight: "600",
      fontSize: moderateScale(14),
    },
    sectionTitle: {
      fontSize: moderateScale(16),
      fontWeight: "700",
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.m,
    },
    lockedContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: scale(40),
    },
    lockedIconContainer: {
      width: scale(100),
      height: scale(100),
      borderRadius: scale(50),
      backgroundColor: theme.colors.primary + "15",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: scale(24),
    },
    lockedTitle: {
      fontSize: moderateScale(22),
      fontWeight: "700",
      color: theme.colors.text.primary,
      marginBottom: scale(12),
      textAlign: "center",
    },
    lockedDescription: {
      fontSize: moderateScale(14),
      color: theme.colors.text.secondary,
      textAlign: "center",
      lineHeight: moderateScale(22),
      marginBottom: scale(32),
    },
    upgradeButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      paddingHorizontal: scale(28),
      paddingVertical: scale(14),
      borderRadius: scale(25),
      gap: scale(8),
    },
    upgradeButtonText: {
      fontSize: moderateScale(15),
      fontWeight: "600",
      color: "#FFF",
    },
  });
