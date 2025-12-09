import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Modal,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Theme } from "../context/ThemeContext";
import { useCards } from "../context/CardsContext";
import { RootStackParamList } from "../navigation/types";
import { Transaction } from "../types/card";
import { categorizeTransaction, CATEGORIES } from "../utils/categorizer";
import { storage } from "../utils/storage";
import {
  formatNumberInput,
  parseAmount,
  formatCurrency,
  formatForeignCurrency,
} from "../utils/formatters";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { scale, moderateScale } from "../utils/responsive";

type AddTransactionScreenRouteProp = RouteProp<
  RootStackParamList,
  "AddTransaction"
>;

type AddTransactionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddTransaction"
>;

import { CURRENCIES, Currency } from "../constants/currencies";

export const AddTransactionScreen = () => {
  const navigation = useNavigation<AddTransactionScreenNavigationProp>();
  const route = useRoute<AddTransactionScreenRouteProp>();
  const { cardId: paramCardId } = route.params || {};
  const { cards, addTransaction, addInstallmentPlan } = useCards();
  const { theme, isDark } = useTheme();

  // Dynamic styles based on theme
  const styles = useMemo(() => getStyles(theme), [theme]);

  // If paramCardId is provided, use it. Otherwise default to first card.
  const [selectedCardId, setSelectedCardId] = useState(
    paramCardId || cards[0]?.id || ""
  );

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);

  // Multi-Currency State
  const [currency, setCurrency] = useState("IDR");
  const [exchangeRate, setExchangeRate] = useState("");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [searchCurrency, setSearchCurrency] = useState("");

  // Installment State
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentMonths, setInstallmentMonths] = useState(""); // Total tenor (string for input)
  const [customMonthlyAmount, setCustomMonthlyAmount] = useState("");
  const [adminFee, setAdminFee] = useState("");

  // Enhanced Installment State
  const [isAlreadyStarted, setIsAlreadyStarted] = useState(false);
  const [paidInstallmentMonths, setPaidInstallmentMonths] = useState(""); // "Sudah Berjalan" (string)
  const [isZeroPercent, setIsZeroPercent] = useState(true); // Default 0% true
  const [showTooltip, setShowTooltip] = useState(false);

  // Date Picker State
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDay, setTempDay] = useState(new Date().getDate());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());
  const [tempYear, setTempYear] = useState(new Date().getFullYear());

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

  // Helper to parse localized numbers (remove dots/commas)
  const parseNumber = (value: string) => {
    return parseInt(value.replace(/\D/g, "")) || 0;
  };

  // Calculate default monthly amount, but allow override
  // Calculate default monthly amount (IDR Total / Tenor)
  const calculatedMonthly =
    amount && installmentMonths
      ? Math.ceil(
          (parseNumber(amount) *
            (currency === "IDR" ? 1 : parseNumber(exchangeRate))) /
            parseNumber(installmentMonths)
        )
      : 0;

  // Use custom amount if set, otherwise use calculated
  const finalMonthlyAmount = customMonthlyAmount
    ? parseNumber(customMonthlyAmount)
    : calculatedMonthly;

  // Reset custom amount when total amount or months change
  React.useEffect(() => {
    setCustomMonthlyAmount("");
  }, [amount, installmentMonths]);

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    const suggestedCategory = categorizeTransaction(text);
    if (suggestedCategory !== "Lainnya") {
      setCategory(suggestedCategory);
    }
  };

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert("Validasi Gagal", "Mohon isi Deskripsi Transaksi");
      return;
    }
    if (!amount) {
      Alert.alert("Validasi Gagal", "Mohon isi Nominal Transaksi");
      return;
    }

    if (!selectedCardId) {
      Alert.alert("Validasi Gagal", "Mohon pilih Kartu Kredit");
      return;
    }

    if (currency !== "IDR" && !exchangeRate) {
      Alert.alert("Validasi Gagal", "Mohon masukkan nilai tukar (kurs)");
      return;
    }

    if (isInstallment && !installmentMonths) {
      Alert.alert("Validasi Gagal", "Mohon isi Tenor (Total Bulan)");
      return;
    }
    if (isInstallment && isAlreadyStarted && !paidInstallmentMonths) {
      Alert.alert("Validasi Gagal", "Mohon isi Durasi yang Sudah Berjalan");
      return;
    }

    const numericAmount = parseNumber(amount);
    const numericRate = currency === "IDR" ? 1 : parseNumber(exchangeRate);
    const finalAmount = numericAmount * numericRate;

    try {
      if (isInstallment) {
        await addInstallmentPlan(
          {
            cardId: selectedCardId,
            originalAmount: numericAmount, // Store original currency amount (e.g. USD 1000)
            totalMonths: parseNumber(installmentMonths),
            monthlyAmount: finalMonthlyAmount,
            description,
            startDate: new Date().toISOString(),
            // New enhanced parameters
            currency: currency !== "IDR" ? currency : undefined,
            exchangeRate: currency !== "IDR" ? numericRate : undefined,
            isZeroPercent: isZeroPercent,
            startMonth: isAlreadyStarted
              ? parseNumber(paidInstallmentMonths) + 1
              : 1, // If started, we start at next month
          },
          adminFee ? parseNumber(adminFee) : 0
        );
      } else {
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          cardId: selectedCardId,
          amount: finalAmount, // Always store IDR equivalent for totals
          date: transactionDate.toISOString(), // Use selected date
          description,
          category,
          type: "expense",
          currency,
          originalAmount: currency !== "IDR" ? numericAmount : undefined,
          exchangeRate: currency !== "IDR" ? numericRate : undefined,
        };
        await addTransaction(newTransaction);
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Gagal menyimpan transaksi");
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
        <Text style={styles.title}>Tambah Transaksi</Text>
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
                      selectedCardId === card.id && {
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.primary,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => setSelectedCardId(card.id)}
                  >
                    <Ionicons
                      name="card"
                      size={moderateScale(20)}
                      color={
                        selectedCardId === card.id
                          ? "#FFFFFF"
                          : theme.colors.text.tertiary
                      }
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        styles.cardOptionText,
                        selectedCardId === card.id && {
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
            <Text style={styles.amountLabel}>Nominal Transaksi</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencyPrefix}>{currency}</Text>
              <TextInput
                style={styles.amountInput}
                value={formatNumberInput(amount)}
                onChangeText={(text) => setAmount(parseNumber(text).toString())}
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
                  parseNumber(amount) * parseNumber(exchangeRate)
                ).toLocaleString("id-ID")}
              </Text>
            )}
          </View>

          {/* Installment Summary - Moved below Amount */}

          {/* Exchange Rate Input (if not IDR) */}
          {currency !== "IDR" && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputGroupLabel}>Nilai Tukar (Ke IDR)</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="cash-outline"
                  size={moderateScale(20)}
                  color={theme.colors.text.secondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.inputField}
                  placeholder="Contoh: 15.000"
                  placeholderTextColor={theme.colors.text.tertiary}
                  keyboardType="numeric"
                  value={formatNumberInput(exchangeRate)}
                  onChangeText={(text) =>
                    setExchangeRate(parseNumber(text).toString())
                  }
                />
              </View>
            </View>
          )}

          {/* Date Picker Button */}
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => {
              setTempDay(transactionDate.getDate());
              setTempMonth(transactionDate.getMonth());
              setTempYear(transactionDate.getFullYear());
              setShowDatePicker(true);
            }}
          >
            <Ionicons
              name="calendar-outline"
              size={moderateScale(20)}
              color={theme.colors.primary}
            />
            <View style={{ flex: 1, marginLeft: theme.spacing.s }}>
              <Text style={styles.datePickerLabel}>Tanggal Transaksi</Text>
              <Text style={styles.datePickerValue}>
                {transactionDate.toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={moderateScale(18)}
              color={theme.colors.text.tertiary}
            />
          </TouchableOpacity>

          <View style={styles.card}>
            <View style={styles.switchContainer}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Ubah ke Cicilan?</Text>
                <Text style={styles.switchSubLabel}>
                  Otomatis buat transaksi bulanan
                </Text>
              </View>
              <Switch
                value={isInstallment}
                onValueChange={setIsInstallment}
                trackColor={{ false: "#767577", true: theme.colors.primary }}
                thumbColor={isInstallment ? "#fff" : "#f4f3f4"}
              />
            </View>

            {isInstallment && (
              <View style={styles.installmentOptions}>
                {/* Tenor Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputGroupLabel}>
                    Tenor (Total Bulan)
                  </Text>
                  <View style={styles.inputRow}>
                    <Ionicons
                      name="calendar-number-outline"
                      size={moderateScale(20)}
                      color={theme.colors.text.secondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.inputField}
                      value={installmentMonths}
                      onChangeText={(text) => {
                        setInstallmentMonths(text.replace(/[^0-9]/g, ""));
                        setCustomMonthlyAmount("");
                      }}
                      keyboardType="numeric"
                      placeholder="Contoh: 12"
                      placeholderTextColor={theme.colors.text.tertiary}
                    />
                  </View>
                </View>

                {/* Already Started Toggle */}
                <View style={[styles.switchContainer, { marginTop: 12 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>
                      Cicilan Sudah Berjalan?
                    </Text>
                    <Text style={styles.switchSubLabel}>
                      Input durasi yang sudah dibayar
                    </Text>
                  </View>
                  <Switch
                    value={isAlreadyStarted}
                    onValueChange={setIsAlreadyStarted}
                    trackColor={{
                      false: "#767577",
                      true: theme.colors.primary,
                    }}
                    thumbColor={isAlreadyStarted ? "#fff" : "#f4f3f4"}
                  />
                </View>

                {isAlreadyStarted && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputGroupLabel}>
                      Sudah Berjalan (Bulan)
                    </Text>
                    <View style={styles.inputRow}>
                      <Ionicons
                        name="hourglass-outline"
                        size={moderateScale(20)}
                        color={theme.colors.text.secondary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.inputField}
                        value={paidInstallmentMonths}
                        onChangeText={(text) => {
                          setPaidInstallmentMonths(text.replace(/[^0-9]/g, ""));
                        }}
                        keyboardType="numeric"
                        placeholder="Contoh: 3"
                        placeholderTextColor={theme.colors.text.tertiary}
                      />
                    </View>
                    <Text style={styles.helperText}>
                      Sisa:{" "}
                      {Math.max(
                        0,
                        parseNumber(installmentMonths) -
                          parseNumber(paidInstallmentMonths)
                      )}{" "}
                      transaksi (Mulai ke-
                      {parseNumber(paidInstallmentMonths) + 1})
                    </Text>
                  </View>
                )}

                {/* 0% Interest Toggle */}
                <View style={styles.switchContainer}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>Cicilan 0%?</Text>
                    <Text style={styles.switchSubLabel}>
                      Jika aktif, cicilan per bulan = Total / Tenor
                    </Text>
                  </View>
                  <Switch
                    value={isZeroPercent}
                    onValueChange={(val) => {
                      setIsZeroPercent(val);
                      if (val) setCustomMonthlyAmount(""); // Reset custom if enabling 0%
                    }}
                    trackColor={{
                      false: "#767577",
                      true: theme.colors.primary,
                    }}
                    thumbColor={isZeroPercent ? "#fff" : "#f4f3f4"}
                  />
                </View>

                {!isZeroPercent && (
                  <Text
                    style={[
                      styles.helperText,
                      { marginTop: 0, marginBottom: 12 },
                    ]}
                  >
                    Masukan nominal cicilan tagihan bulanan sesuai info dari
                    bank (termasuk bunga jika ada).
                  </Text>
                )}

                {/* Monthly Amount Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputGroupLabel}>
                    Cicilan per Bulan {isZeroPercent ? "(otomatis)" : ""}
                  </Text>
                  <View
                    style={[styles.inputRow, isZeroPercent && { opacity: 0.6 }]}
                  >
                    <Ionicons
                      name="wallet-outline"
                      size={moderateScale(20)}
                      color={theme.colors.text.secondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.inputField}
                      editable={!isZeroPercent}
                      value={
                        customMonthlyAmount
                          ? formatNumberInput(customMonthlyAmount)
                          : formatNumberInput(calculatedMonthly)
                      }
                      onChangeText={(text) =>
                        setCustomMonthlyAmount(parseNumber(text).toString())
                      }
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={theme.colors.text.tertiary}
                    />
                  </View>
                  {!isZeroPercent && (
                    <Text style={styles.helperText}>
                      Masukan sesuai tagihan bulanan dari bank.
                    </Text>
                  )}
                </View>

                {/* Admin Fee Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputGroupLabel}>
                    Biaya Admin (Opsional)
                  </Text>
                  <View style={styles.inputRow}>
                    <Ionicons
                      name="receipt-outline"
                      size={moderateScale(20)}
                      color={theme.colors.text.secondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.inputField}
                      value={formatNumberInput(adminFee)}
                      onChangeText={(text) =>
                        setAdminFee(parseNumber(text).toString())
                      }
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={theme.colors.text.tertiary}
                    />
                  </View>
                </View>

                {/* Installment Summary - Moved Here */}
                {amount && installmentMonths && (
                  <View
                    style={[styles.installmentSummaryCard, { marginTop: 12 }]}
                  >
                    <Text style={styles.installmentSummaryLabel}>
                      Total Cicilan
                    </Text>
                    <Text style={styles.installmentSummaryAmount}>
                      {formatCurrency(
                        finalMonthlyAmount * parseNumber(installmentMonths)
                      )}
                    </Text>
                    <Text style={styles.installmentSummaryDetail}>
                      {installmentMonths}x cicilan @{" "}
                      {formatCurrency(finalMonthlyAmount)}/bulan
                    </Text>
                    {adminFee ? (
                      <Text style={styles.installmentSummaryDetail}>
                        + Biaya Admin: {formatCurrency(parseNumber(adminFee))}
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>
            )}

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputGroupLabel}>Deskripsi Transaksi</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="create-outline"
                  size={moderateScale(20)}
                  color={theme.colors.text.secondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.inputField}
                  value={description}
                  onChangeText={handleDescriptionChange}
                  placeholder="Makan Siang, Belanja Online, dll."
                  placeholderTextColor={theme.colors.text.tertiary}
                />
              </View>
            </View>

            <View style={styles.categoryHeader}>
              <Text style={styles.sectionLabel}>Kategori</Text>
              <Text style={styles.swipeHintText}>
                Geser ke kiri untuk lainnya →
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScrollContent}
            >
              {CATEGORIES.map((cat) => {
                let iconName: any = "document-text-outline";
                let iconColor = theme.colors.primary;
                switch (cat) {
                  case "Makanan & Minuman":
                    iconName = "fast-food-outline";
                    iconColor = "#F59E0B";
                    break;
                  case "Transportasi":
                    iconName = "car-outline";
                    iconColor = "#3B82F6";
                    break;
                  case "Belanja":
                    iconName = "cart-outline";
                    iconColor = "#EC4899";
                    break;
                  case "Tagihan":
                    iconName = "receipt-outline";
                    iconColor = "#EF4444";
                    break;
                  case "Hiburan":
                    iconName = "film-outline";
                    iconColor = "#8B5CF6";
                    break;
                  case "Kesehatan":
                    iconName = "medkit-outline";
                    iconColor = "#10B981";
                    break;
                  case "Pendidikan":
                    iconName = "school-outline";
                    iconColor = "#F97316";
                    break;
                  default:
                    iconName = "ellipsis-horizontal-circle-outline";
                    iconColor = theme.colors.text.secondary;
                }

                const isSelected = category === cat;

                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryItem,
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
                      styles.categoryItem,
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
          </View>

          <TouchableOpacity onPress={handleSave} style={styles.mainSaveButton}>
            <Text style={styles.mainSaveButtonText}>Simpan Transaksi</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.datePickerModal}>
          <View style={styles.datePickerContent}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Pilih Tanggal</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons
                  name="close"
                  size={moderateScale(24)}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateColumn}>
                <Text style={styles.dateLabel}>Hari</Text>
                <TextInput
                  style={styles.dateInput}
                  value={tempDay.toString()}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 1;
                    setTempDay(Math.min(31, Math.max(1, num)));
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              <View style={styles.dateColumn}>
                <Text style={styles.dateLabel}>Bulan</Text>
                <TextInput
                  style={styles.dateInput}
                  value={(tempMonth + 1).toString()}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 1;
                    setTempMonth(Math.min(12, Math.max(1, num)) - 1);
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              <View style={styles.dateColumn}>
                <Text style={styles.dateLabel}>Tahun</Text>
                <TextInput
                  style={styles.dateInput}
                  value={tempYear.toString()}
                  onChangeText={(text) => {
                    const num = parseInt(text) || new Date().getFullYear();
                    setTempYear(num);
                  }}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
            </View>

            <View style={styles.datePickerActions}>
              <TouchableOpacity
                style={styles.datePickerCancel}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.datePickerConfirm}
                onPress={() => {
                  const newDate = new Date(tempYear, tempMonth, tempDay);
                  setTransactionDate(newDate);
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.datePickerConfirmText}>Pilih</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    },
    amountCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: theme.spacing.l,
      marginBottom: theme.spacing.l,
      alignItems: "center",
      ...theme.shadows.medium,
    },
    amountLabel: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.s,
    },
    amountInputRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    amountEquivalent: {
      ...theme.typography.body,
      color: theme.colors.primary,
      marginTop: theme.spacing.s,
    },
    currencyPrefix: {
      fontSize: moderateScale(28),
      fontWeight: "600",
      color: theme.colors.text.secondary,
      marginRight: theme.spacing.s,
    },
    amountInput: {
      fontSize: moderateScale(42),
      fontWeight: "700",
      color: theme.colors.text.primary,
      minWidth: 100,
      textAlign: "center",
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.m,
      ...theme.shadows.medium,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.background,
      borderRadius: 16, // Modern rounded corners
      paddingHorizontal: theme.spacing.m,
      paddingVertical: 8, // More padding for nicer feel
      marginBottom: theme.spacing.l,
      borderWidth: 1,
      borderColor: theme.colors.border,
      height: 64, // Taller inputs for easier tapping
    },
    inputIcon: {
      marginRight: theme.spacing.m,
    },
    textInput: {
      flex: 1,
      ...theme.typography.body,
      color: theme.colors.text.primary,
      height: "100%", // Fill container
      textAlignVertical: "center",
    },
    sectionLabel: {
      ...theme.typography.h3,
      fontSize: moderateScale(16),
      fontWeight: "700",
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.m,
    },
    categoryHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.m,
    },
    swipeHintText: {
      ...theme.typography.caption,
      color: theme.colors.text.tertiary,
      fontSize: moderateScale(12),
    },
    categoryScrollContent: {
      gap: theme.spacing.s,
      paddingRight: theme.spacing.m,
    },
    categoryItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      height: 40,
    },
    categoryIconContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
    },
    categoryText: {
      fontSize: moderateScale(12),
      color: theme.colors.text.secondary,
    },
    mainSaveButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      paddingHorizontal: theme.spacing.l,
      borderRadius: theme.borderRadius.m,
      alignItems: "center",
      justifyContent: "center",
      marginTop: theme.spacing.xl,
      minHeight: 52,
      ...theme.shadows.medium,
    },
    mainSaveButtonText: {
      ...theme.typography.button,
      color: "#FFFFFF",
      fontSize: moderateScale(16),
    },
    switchContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.m,
      paddingBottom: theme.spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    switchLabel: {
      ...theme.typography.body,
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
    switchSubLabel: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
    },
    // New Installment Summary Card
    installmentSummaryCard: {
      backgroundColor: theme.colors.primary + "10",
      borderRadius: 16,
      padding: theme.spacing.m,
      marginBottom: theme.spacing.l,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.primary + "30",
    },
    installmentSummaryLabel: {
      ...theme.typography.caption,
      color: theme.colors.primary,
      marginBottom: 4,
    },
    installmentSummaryAmount: {
      ...theme.typography.h2,
      color: theme.colors.primary,
      fontWeight: "700",
    },
    installmentSummaryDetail: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginTop: 4,
    },
    // Input Group (Label outside, input inside)
    inputGroup: {
      marginBottom: theme.spacing.l,
    },
    inputGroupLabel: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginBottom: 8,
      marginLeft: 4,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      paddingHorizontal: theme.spacing.m,
      height: 56,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    inputField: {
      flex: 1,
      ...theme.typography.body,
      color: theme.colors.text.primary,
      height: "100%",
    },
    installmentOptions: {
      marginBottom: theme.spacing.m,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: theme.spacing.m,
    },
    cardSelectorContainer: {
      marginBottom: theme.spacing.l,
    },
    cardSelectorContent: {
      gap: theme.spacing.s,
      paddingVertical: theme.spacing.s,
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
      height: 48, // Consistent height for cards
    },
    cardOptionActive: {
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    cardOptionText: {
      ...theme.typography.body,
      color: theme.colors.text.secondary,
    },
    cardOptionTextActive: {
      color: theme.colors.text.primary,
      fontWeight: "600",
    },

    currencySelector: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      paddingHorizontal: theme.spacing.m,
      height: 64, // Match InputContainer
    },
    currencySelectorText: {
      ...theme.typography.body,
      color: theme.colors.text.primary,
    },
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
      backgroundColor: theme.colors.surface,
      margin: theme.spacing.m,
      paddingHorizontal: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      height: 52, // Standard height
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchInput: {
      flex: 1,
      marginLeft: theme.spacing.s,
      ...theme.typography.body,
      color: theme.colors.text.primary,
      height: "100%",
    },
    currencyList: {
      padding: theme.spacing.m,
    },
    currencyItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      height: 60,
    },
    currencyFlag: {
      fontSize: 24,
      marginRight: theme.spacing.m,
    },
    currencyCode: {
      ...theme.typography.body,
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
    currencyName: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
    },
    helperText: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginTop: 6,
      marginLeft: 4,
      lineHeight: 18,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.m,
      paddingHorizontal: theme.spacing.m,
      height: 52, // Standard height
      ...theme.typography.body,
      color: theme.colors.text.primary,
    },
    inputLabel: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginBottom: 6,
      marginLeft: 4,
    },
    inputDisabled: {
      backgroundColor: theme.colors.background,
      color: theme.colors.text.tertiary,
    },
    datePickerButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.m,
      height: 64, // Match InputContainer
      borderRadius: 16,
      marginBottom: theme.spacing.l,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    datePickerLabel: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginBottom: 2,
    },
    datePickerValue: {
      ...theme.typography.body,
      color: theme.colors.text.primary,
      fontWeight: "500",
    },
    datePickerModal: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    datePickerContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.l,
      width: "85%",
      maxHeight: "80%",
      ...theme.shadows.large,
    },
    datePickerHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.m,
    },
    datePickerTitle: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
    },
    dateRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: theme.spacing.l,
      gap: theme.spacing.s,
    },
    dateColumn: {
      flex: 1,
    },
    dateLabel: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginBottom: 8,
      textAlign: "center",
    },
    dateInput: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.m,
      padding: theme.spacing.m,
      textAlign: "center",
      ...theme.typography.h3,
      color: theme.colors.text.primary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    datePickerActions: {
      flexDirection: "row",
      gap: theme.spacing.m,
      marginTop: theme.spacing.m,
    },
    datePickerCancel: {
      flex: 1,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      backgroundColor: theme.colors.background,
      alignItems: "center",
    },
    datePickerConfirm: {
      flex: 1,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
    },
    datePickerCancelText: {
      ...theme.typography.button,
      color: theme.colors.text.secondary,
    },
    datePickerConfirmText: {
      ...theme.typography.button,
      color: "#FFFFFF",
    },

    tooltipContainer: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing.s,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 8,
    },
    tooltipText: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      lineHeight: 18,
    },
  });
