import React, { useState } from "react";
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
import { theme } from "../constants/theme";
import { useCards } from "../context/CardsContext";
import { RootStackParamList } from "../navigation/types";
import { Transaction } from "../types/card";
import { categorizeTransaction, CATEGORIES } from "../utils/categorizer";
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

const CURRENCIES = ["IDR", "USD", "SGD", "EUR", "JPY", "AUD"];

export const AddTransactionScreen = () => {
  const navigation = useNavigation<AddTransactionScreenNavigationProp>();
  const route = useRoute<AddTransactionScreenRouteProp>();
  const { cardId: paramCardId } = route.params || {};
  const { cards, addTransaction, addInstallmentPlan } = useCards();

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

  // Installment State
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentMonths, setInstallmentMonths] = useState(3);
  const [customMonthlyAmount, setCustomMonthlyAmount] = useState("");
  const [adminFee, setAdminFee] = useState("");

  // Date Picker State
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDay, setTempDay] = useState(new Date().getDate());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());
  const [tempYear, setTempYear] = useState(new Date().getFullYear());

  // Helper to parse localized numbers (remove dots/commas)
  const parseNumber = (value: string) => {
    return parseInt(value.replace(/\D/g, "")) || 0;
  };

  // Calculate default monthly amount, but allow override
  const calculatedMonthly = amount
    ? Math.ceil(parseNumber(amount) / installmentMonths)
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

    const numericAmount = parseNumber(amount);
    const numericRate = currency === "IDR" ? 1 : parseNumber(exchangeRate);
    const finalAmount = numericAmount * numericRate;

    try {
      if (isInstallment) {
        await addInstallmentPlan(
          {
            cardId: selectedCardId,
            originalAmount: finalAmount, // Installment plan usually tracks total IDR liability
            totalMonths: installmentMonths,
            monthlyAmount: finalMonthlyAmount, // This logic might need adjustment for multi-currency installments, but keeping simple for now
            description,
            startDate: new Date().toISOString(),
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
                      selectedCardId === card.id && styles.cardOptionActive,
                      { borderColor: card.colorTheme || theme.colors.primary },
                    ]}
                    onPress={() => setSelectedCardId(card.id)}
                  >
                    <Ionicons
                      name="card"
                      size={moderateScale(20)}
                      color={card.colorTheme || theme.colors.primary}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        styles.cardOptionText,
                        selectedCardId === card.id &&
                          styles.cardOptionTextActive,
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
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mata Uang</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
            >
              {CURRENCIES.map((curr) => (
                <TouchableOpacity
                  key={curr}
                  style={[
                    styles.currencyChip,
                    currency === curr && styles.activeCurrencyChip,
                  ]}
                  onPress={() => setCurrency(curr)}
                >
                  <Text
                    style={[
                      styles.currencyChipText,
                      currency === curr && styles.activeCurrencyChipText,
                    ]}
                  >
                    {curr}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.amountContainer}>
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

          {/* Exchange Rate Input (if not IDR) */}
          {currency !== "IDR" && (
            <View style={styles.inputContainer}>
              <Ionicons
                name="cash-outline"
                size={moderateScale(20)}
                color={theme.colors.text.secondary}
                style={styles.inputIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Nilai Tukar (Ke IDR)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: 15000"
                  placeholderTextColor={theme.colors.text.tertiary}
                  keyboardType="numeric"
                  value={formatNumberInput(exchangeRate)}
                  onChangeText={(text) =>
                    setExchangeRate(parseNumber(text).toString())
                  }
                />
                {amount && exchangeRate && (
                  <Text style={styles.helperText}>
                    Estimasi:{" "}
                    {formatCurrency(
                      parseNumber(amount) * parseNumber(exchangeRate)
                    )}
                  </Text>
                )}
              </View>
            </View>
          )}

          {isInstallment && amount ? (
            <View style={styles.installmentSummary}>
              <Text style={styles.installmentSummaryText}>
                Total Cicilan x {installmentMonths}:{" "}
                {Math.round(
                  finalMonthlyAmount * installmentMonths
                ).toLocaleString("id-ID")}
              </Text>
              {adminFee ? (
                <Text style={styles.installmentSummarySubText}>
                  + Admin Fee: {parseNumber(adminFee).toLocaleString("id-ID")}
                </Text>
              ) : null}
            </View>
          ) : null}

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
                <Text style={[styles.sectionLabel, { marginBottom: 8 }]}>
                  Tenor (Bulan)
                </Text>
                <View style={styles.tenorGrid}>
                  {[3, 6, 12, 18, 24].map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.tenorItem,
                        installmentMonths === m && styles.tenorItemActive,
                      ]}
                      onPress={() => {
                        setInstallmentMonths(m);
                        setCustomMonthlyAmount(""); // Reset custom amount on tenor change
                      }}
                    >
                      <Text
                        style={[
                          styles.tenorText,
                          installmentMonths === m && styles.tenorTextActive,
                        ]}
                      >
                        {m}x
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.divider} />

                <Text style={styles.sectionLabel}>Detail Cicilan</Text>

                {/* Monthly Amount Input */}
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="calendar-outline"
                    size={moderateScale(20)}
                    color={theme.colors.text.secondary}
                    style={styles.inputIcon}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Cicilan per Bulan</Text>
                    <TextInput
                      style={styles.textInput}
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
                </View>

                {/* Admin Fee Input */}
                <View
                  style={[
                    styles.inputContainer,
                    { marginBottom: theme.spacing.s },
                  ]}
                >
                  <Ionicons
                    name="receipt-outline"
                    size={moderateScale(20)}
                    color={theme.colors.text.secondary}
                    style={styles.inputIcon}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>
                      Biaya Admin (Opsional)
                    </Text>
                    <TextInput
                      style={styles.textInput}
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
              </View>
            )}

            {isInstallment && <View style={styles.divider} />}

            <View
              style={[styles.inputContainer, { marginTop: theme.spacing.m }]}
            >
              <Ionicons
                name="create-outline"
                size={moderateScale(20)}
                color={theme.colors.text.secondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={description}
                onChangeText={handleDescriptionChange}
                placeholder="Deskripsi (cth. Makan Siang)"
                placeholderTextColor={theme.colors.text.tertiary}
              />
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
                        color={
                          isSelected ? theme.colors.text.inverse : iconColor
                        }
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
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: theme.spacing.xl,
  },
  currencyPrefix: {
    fontSize: moderateScale(32),
    fontWeight: "600",
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.s,
  },
  amountInput: {
    fontSize: moderateScale(48),
    fontWeight: "700",
    color: theme.colors.text.primary,
    minWidth: 100,
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
    borderRadius: theme.borderRadius.m,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s, // reduced vertical padding
    marginBottom: theme.spacing.l,
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
    paddingVertical: theme.spacing.s, // ensure text is vertically centered
    height: theme.containerSizes.iconMedium, // fixed height for alignment
  },
  sectionLabel: {
    ...theme.typography.h3,
    fontSize: moderateScale(16),
    color: theme.colors.text.primary,
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
  },
  categoryIconContainer: {
    width: theme.containerSizes.iconSmall,
    height: theme.containerSizes.iconSmall,
    borderRadius: scale(14),
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    ...theme.shadows.small,
  },
  categoryText: {
    fontSize: moderateScale(12),
    color: theme.colors.text.secondary,
  },
  mainSaveButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    alignItems: "center",
    marginTop: theme.spacing.xl,
    ...theme.shadows.medium,
  },
  mainSaveButtonText: {
    ...theme.typography.button,
    color: theme.colors.text.inverse,
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
  installmentSummary: {
    alignItems: "center",
    marginBottom: theme.spacing.l,
    marginTop: -theme.spacing.l,
  },
  installmentSummaryText: {
    ...theme.typography.h3,
    color: theme.colors.primary,
  },
  installmentSummarySubText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  installmentOptions: {
    marginBottom: theme.spacing.m,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.m,
  },
  inputLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    marginBottom: 2,
  },
  tenorGrid: {
    flexDirection: "row",
    gap: theme.spacing.s,
    flexWrap: "wrap",
  },
  tenorItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  tenorItemActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tenorText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    fontWeight: "600",
  },
  tenorTextActive: {
    color: theme.colors.text.inverse,
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
  },
  cardOptionActive: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
  },
  cardOptionText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  cardOptionTextActive: {
    color: theme.colors.text.primary,
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: theme.spacing.m,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  currencyChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeCurrencyChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  currencyChipText: {
    ...theme.typography.caption,
    fontWeight: "600",
    color: theme.colors.text.secondary,
  },
  activeCurrencyChipText: {
    color: theme.colors.text.inverse,
  },
  helperText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
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
    color: theme.colors.text.inverse,
  },
});
