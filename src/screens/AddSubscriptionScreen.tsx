import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme, Theme } from "../context/ThemeContext";
import { useCards } from "../context/CardsContext";
import { Ionicons } from "@expo/vector-icons";
import { scale, moderateScale } from "../utils/responsive";
import { CATEGORIES, categorizeTransaction } from "../utils/categorizer";
import { storage } from "../utils/storage";
import { getCategoryIcon } from "../utils/categoryIcons";
import {
  parseAmount,
  formatNumberInput,
  formatCurrency,
} from "../utils/formatters";
import * as Haptics from "expo-haptics";
import { CURRENCIES, Currency } from "../constants/currencies";

export const AddSubscriptionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { cardId: paramCardId } = route.params || {};
  const { cards, addSubscription } = useCards();
  const { theme, isDark } = useTheme();

  // Dynamic styles based on theme
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [cardId, setCardId] = useState(paramCardId || cards[0]?.id || "");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [billingDay, setBillingDay] = useState("1");
  const [category, setCategory] = useState("Hiburan");

  const [currency, setCurrency] = useState("IDR");
  const [exchangeRate, setExchangeRate] = useState("");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [searchCurrency, setSearchCurrency] = useState("");

  // Custom Categories
  const [customCategories, setCustomCategories] = useState<
    { name: string; icon: string }[]
  >([]);

  useEffect(() => {
    const loadCustomCategories = async () => {
      const cats = await storage.getCustomCategories();
      setCustomCategories(cats || []);
    };
    loadCustomCategories();
  }, []);

  const handleNameChange = (text: string) => {
    setName(text);
    const suggestedCategory = categorizeTransaction(text);
    if (suggestedCategory !== "Lainnya") {
      setCategory(suggestedCategory);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Validasi Gagal", "Mohon isi Nama Langganan");
      return;
    }
    if (!amount) {
      Alert.alert("Validasi Gagal", "Mohon isi Nominal Tagihan");
      return;
    }
    if (!cardId) {
      Alert.alert("Validasi Gagal", "Mohon pilih Kartu Kredit");
      return;
    }
    // Description is optional - nama layanan sudah cukup sebagai identifikasi

    if (currency !== "IDR" && !exchangeRate) {
      Alert.alert("Validasi Gagal", "Mohon masukkan nilai tukar (kurs).");
      return;
    }

    const numericAmount = parseAmount(amount);
    const numericRate = currency === "IDR" ? 1 : parseAmount(exchangeRate);
    const finalAmount = numericAmount * numericRate;
    const day = parseInt(billingDay);

    if (day < 1 || day > 31) {
      Alert.alert("Error", "Tanggal tagihan tidak valid (1-31).");
      return;
    }

    // Calculate next billing date
    const today = new Date();
    let nextDate = new Date(today.getFullYear(), today.getMonth(), day);

    // If billing day for this month has passed, move to next month
    if (nextDate <= today) {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }

    // Adjust for yearly
    if (billingCycle === "yearly") {
      // Simple logic: if yearly, set to next year same date if passed, or this year if not
      // But usually yearly subs start "now". Let's assume next billing is next month/year relative to start.
      // For simplicity, let's stick to the calculated nextDate based on day.
    }

    try {
      await addSubscription({
        name,
        amount: finalAmount,
        cardId,
        currency,
        originalAmount: currency !== "IDR" ? numericAmount : undefined,
        exchangeRate: currency !== "IDR" ? numericRate : undefined,
        billingCycle,
        billingDay: day,
        nextBillingDate: nextDate.toISOString(),
        category,
        isActive: true,
        // description: undefined, // description removed
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Gagal menyimpan langganan.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="close"
            size={moderateScale(24)}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Tambah Langganan</Text>
        <View style={{ width: scale(24) }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Card Selector (only if no paramCardId) */}
          {!paramCardId && (
            <View style={styles.cardSelectorContainer}>
              <Text style={styles.sectionLabel}>Pilih Kartu</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardSelectorContent}
              >
                {cards.map((card) => (
                  <TouchableOpacity
                    key={card.id}
                    style={[
                      styles.cardOption,
                      cardId === card.id && {
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.primary,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => setCardId(card.id)}
                  >
                    <Ionicons
                      name="card"
                      size={moderateScale(20)}
                      color={
                        cardId === card.id
                          ? "#FFFFFF"
                          : theme.colors.text.tertiary
                      }
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        styles.cardOptionText,
                        cardId === card.id && {
                          color: "#FFFFFF",
                          fontWeight: "600",
                        },
                      ]}
                    >
                      {card.alias}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Currency Selector */}
          <TouchableOpacity
            style={[styles.inputContainer, { marginBottom: theme.spacing.l }]}
            onPress={() => setShowCurrencyPicker(true)}
          >
            <Ionicons
              name="flag-outline"
              size={moderateScale(20)}
              color={theme.colors.text.secondary}
              style={styles.inputIcon}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Mata Uang</Text>
              <Text style={styles.textInput}>
                {CURRENCIES.find((c) => c.code === currency)?.flag}{" "}
                {CURRENCIES.find((c) => c.code === currency)?.code} -{" "}
                {CURRENCIES.find((c) => c.code === currency)?.name}
              </Text>
            </View>
            <Ionicons
              name="chevron-down"
              size={20}
              color={theme.colors.text.secondary}
            />
          </TouchableOpacity>

          {/* Currency Picker Modal */}
          <Modal
            visible={showCurrencyPicker}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowCurrencyPicker(false)}
          >
            <SafeAreaView
              style={{ flex: 1, backgroundColor: theme.colors.background }}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Pilih Mata Uang</Text>
                <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.colors.text.primary}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color={theme.colors.text.secondary}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Cari mata uang..."
                  placeholderTextColor={theme.colors.text.tertiary}
                  value={searchCurrency}
                  onChangeText={setSearchCurrency}
                  autoFocus={false}
                />
              </View>
              <ScrollView contentContainerStyle={styles.currencyList}>
                {CURRENCIES.filter(
                  (c) =>
                    c.code
                      .toLowerCase()
                      .includes(searchCurrency.toLowerCase()) ||
                    c.name.toLowerCase().includes(searchCurrency.toLowerCase())
                ).map((c) => (
                  <TouchableOpacity
                    key={c.code}
                    style={styles.currencyItem}
                    onPress={() => {
                      setCurrency(c.code);
                      setShowCurrencyPicker(false);
                      setSearchCurrency("");
                    }}
                  >
                    <Text style={styles.currencyFlag}>{c.flag}</Text>
                    <View>
                      <Text style={styles.currencyCode}>{c.code}</Text>
                      <Text style={styles.currencyName}>{c.name}</Text>
                    </View>
                    {currency === c.code && (
                      <Ionicons
                        name="checkmark"
                        size={24}
                        color={theme.colors.primary}
                        style={{ marginLeft: "auto" }}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </SafeAreaView>
          </Modal>

          {/* Amount Input - Hero Element */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Biaya Langganan</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencyPrefix}>{currency}</Text>
              <TextInput
                style={styles.amountInput}
                value={formatNumberInput(amount)}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, "");
                  setAmount(cleaned ? parseInt(cleaned).toString() : "");
                }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.colors.text.tertiary}
                autoFocus
              />
            </View>
            {currency !== "IDR" && amount && exchangeRate && (
              <Text style={styles.amountEquivalent}>
                ≈ Rp{" "}
                {(
                  parseAmount(amount) * parseAmount(exchangeRate)
                ).toLocaleString("id-ID")}
              </Text>
            )}

            {/* Exchange Rate Input - Only if currency != IDR */}
            {currency !== "IDR" && (
              <View style={styles.exchangeRateContainer}>
                <Text style={styles.inputLabel}>Nilai Tukar (Ke IDR)</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { borderBottomWidth: 1, borderColor: theme.colors.border },
                  ]}
                  placeholder="Contoh: 15000"
                  placeholderTextColor={theme.colors.text.tertiary}
                  keyboardType="numeric"
                  value={formatNumberInput(exchangeRate)}
                  onChangeText={(text) =>
                    setExchangeRate(parseAmount(text).toString())
                  }
                />
              </View>
            )}
          </View>

          <Text style={styles.sectionLabel}>Detail Langganan</Text>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="create-outline"
              size={moderateScale(20)}
              color={theme.colors.text.secondary}
              style={styles.inputIcon}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Nama Layanan</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Netflix, Spotify"
                value={name}
                onChangeText={handleNameChange}
                placeholderTextColor={theme.colors.text.tertiary}
              />
            </View>
          </View>

          {/* Billing Day & Cycle */}
          <View style={{ flexDirection: "row", gap: theme.spacing.m }}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Ionicons
                name="calendar-outline"
                size={moderateScale(20)}
                color={theme.colors.text.secondary}
                style={styles.inputIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Tgl Tagihan</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Tgl 1-31"
                  value={billingDay}
                  onChangeText={(text) => {
                    const val = parseInt(text);
                    if (!text || (val >= 1 && val <= 31)) {
                      setBillingDay(text);
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholderTextColor={theme.colors.text.tertiary}
                />
              </View>
            </View>
          </View>

          {/* Cycle Selection */}
          <View style={styles.cycleContainer}>
            <TouchableOpacity
              style={[
                styles.cycleButton,
                billingCycle === "monthly" && styles.cycleButtonActive,
              ]}
              onPress={() => setBillingCycle("monthly")}
            >
              <Text
                style={[
                  styles.cycleText,
                  billingCycle === "monthly" && styles.cycleTextActive,
                ]}
              >
                Bulanan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.cycleButton,
                billingCycle === "yearly" && styles.cycleButtonActive,
              ]}
              onPress={() => setBillingCycle("yearly")}
            >
              <Text
                style={[
                  styles.cycleText,
                  billingCycle === "yearly" && styles.cycleTextActive,
                ]}
              >
                Tahunan
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category Selector */}
          <View style={styles.categoryHeader}>
            <Text style={styles.sectionLabel}>Kategori</Text>
            <View style={styles.swipeHintContainer}>
              <Text style={styles.swipeHintText}>Geser untuk lainnya</Text>
              <Ionicons
                name="arrow-forward"
                size={moderateScale(12)}
                color={theme.colors.text.tertiary}
              />
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            {CATEGORIES.map((cat) => {
              const { iconName, iconColor } = getCategoryIcon(cat);
              const isSelected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryOption,
                    isSelected && {
                      backgroundColor: iconColor + "20",
                      borderColor: iconColor,
                    },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <View
                    style={[
                      styles.categoryIconContainer,
                      isSelected
                        ? { backgroundColor: iconColor }
                        : { backgroundColor: theme.colors.background },
                    ]}
                  >
                    <Ionicons
                      name={iconName}
                      size={moderateScale(18)}
                      color={isSelected ? "#FFFFFF" : iconColor}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected && {
                        color: theme.colors.text.primary,
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {/* Custom Categories */}
            {customCategories.map((customCat) => {
              const isSelected = category === customCat.name;
              const iconColor = theme.colors.primary;

              return (
                <TouchableOpacity
                  key={customCat.name}
                  style={[
                    styles.categoryOption,
                    isSelected && {
                      backgroundColor: iconColor + "20",
                      borderColor: iconColor,
                    },
                  ]}
                  onPress={() => setCategory(customCat.name)}
                >
                  <View
                    style={[
                      styles.categoryIconContainer,
                      isSelected
                        ? { backgroundColor: iconColor }
                        : { backgroundColor: theme.colors.background },
                    ]}
                  >
                    <Ionicons
                      name={customCat.icon as any}
                      size={moderateScale(18)}
                      color={isSelected ? "#FFFFFF" : iconColor}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected && {
                        color: theme.colors.text.primary,
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {customCat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Simpan Langganan</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
      paddingVertical: theme.spacing.s,
      borderBottomWidth: 0, // No border for cleaner look
    },
    backButton: {
      padding: theme.spacing.s,
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
    },
    content: {
      padding: theme.spacing.m,
      paddingBottom: 100,
    },
    // Card Selector
    cardSelectorContainer: {
      marginBottom: theme.spacing.l,
    },
    cardSelectorContent: {
      gap: theme.spacing.m,
      paddingRight: theme.spacing.m,
    },
    cardOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      borderRadius: theme.borderRadius.round,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    cardOptionText: {
      ...theme.typography.body,
      color: theme.colors.text.secondary,
    },

    // Amount Card (Hero)
    amountCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.l,
      marginBottom: theme.spacing.l,
      ...theme.shadows.medium,
    },
    amountLabel: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.s,
      textAlign: "center",
    },
    amountInputRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.xs,
    },
    amountInput: {
      fontSize: moderateScale(36),
      fontWeight: "700",
      color: theme.colors.text.primary,
      minWidth: 100,
      textAlign: "right",
    },
    currencyPrefix: {
      fontSize: moderateScale(24),
      fontWeight: "600",
      color: theme.colors.text.secondary,
      marginRight: theme.spacing.s,
      alignSelf: "center",
    },
    amountEquivalent: {
      ...theme.typography.caption,
      color: theme.colors.text.tertiary,
      textAlign: "center",
      marginTop: 4,
    },
    exchangeRateContainer: {
      marginTop: theme.spacing.m,
      paddingTop: theme.spacing.m,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border + "40",
    },

    // Standard Inputs
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.m,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      marginBottom: theme.spacing.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    inputIcon: {
      marginRight: theme.spacing.m,
    },
    textInput: {
      flex: 1,
      ...theme.typography.body,
      color: theme.colors.text.primary,
      height: theme.containerSizes.iconMedium, // consistent height
    },
    inputLabel: {
      ...theme.typography.caption,
      color: theme.colors.text.tertiary,
      marginBottom: 2,
    },

    // Section Labels
    sectionLabel: {
      ...theme.typography.h3,
      fontSize: moderateScale(16),
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.s,
    },

    // Cycle & Category
    cycleContainer: {
      flexDirection: "row",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.l,
      overflow: "hidden",
    },
    cycleButton: {
      flex: 1,
      paddingVertical: theme.spacing.s,
      alignItems: "center",
      justifyContent: "center",
    },
    cycleButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    cycleText: {
      ...theme.typography.body,
      color: theme.colors.text.secondary,
      fontSize: moderateScale(14),
    },
    cycleTextActive: {
      color: "#FFFFFF",
      fontWeight: "600",
    },

    categoryHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.s,
      marginTop: theme.spacing.m,
    },
    categoryList: {
      gap: theme.spacing.s,
      paddingBottom: theme.spacing.s,
    },
    categoryOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    categoryIconContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
    },
    categoryText: {
      fontSize: moderateScale(12),
      color: theme.colors.text.secondary,
    },
    swipeHintContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    swipeHintText: {
      ...theme.typography.caption,
      color: theme.colors.text.tertiary,
      fontSize: moderateScale(12),
    },

    // Save Button
    saveButton: {
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      alignItems: "center",
      marginTop: theme.spacing.l,
      ...theme.shadows.medium,
    },
    saveButtonText: {
      ...theme.typography.button,
      color: "#FFFFFF",
    },

    // Modal Styles
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: theme.spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      margin: theme.spacing.m,
      padding: theme.spacing.m,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchInput: {
      flex: 1,
      marginLeft: theme.spacing.s,
      color: theme.colors.text.primary,
      ...theme.typography.body,
    },
    currencyList: {
      padding: theme.spacing.m,
    },
    currencyItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + "40",
    },
    currencyFlag: {
      fontSize: moderateScale(24),
      marginRight: theme.spacing.m,
    },
    currencyCode: {
      ...theme.typography.body,
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
    currencyName: {
      ...theme.typography.caption,
      color: theme.colors.text.tertiary,
    },
  });
