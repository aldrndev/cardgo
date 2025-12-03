import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { theme } from "../constants/theme";
import { useCards } from "../context/CardsContext";
import { Ionicons } from "@expo/vector-icons";
import { CATEGORIES } from "../utils/categorizer";
import { getCategoryIcon } from "../utils/categoryIcons";
import {
  parseAmount,
  formatNumberInput,
  formatCurrency,
} from "../utils/formatters";

export const AddSubscriptionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { cardId: paramCardId } = route.params || {};
  const { cards, addSubscription } = useCards();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [cardId, setCardId] = useState(paramCardId || cards[0]?.id || "");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [billingDay, setBillingDay] = useState("1");
  const [category, setCategory] = useState("Hiburan");
  const [description, setDescription] = useState("");

  const [currency, setCurrency] = useState("IDR");
  const [exchangeRate, setExchangeRate] = useState("");
  const CURRENCIES = ["IDR", "USD", "SGD", "EUR", "JPY", "AUD"];

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
    if (!description.trim()) {
      Alert.alert("Validasi Gagal", "Mohon isi Deskripsi");
      return;
    }

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
        description,
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
            name="arrow-back"
            size={24}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Tambah Langganan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.amountContainer}>
          <Text style={styles.currencyPrefix}>
            {currency === "IDR" ? "Rp" : currency}
          </Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={(text) => {
              const numeric = text.replace(/[^0-9]/g, "");
              if (numeric) {
                setAmount(parseInt(numeric).toLocaleString("id-ID"));
              } else {
                setAmount("");
              }
            }}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={theme.colors.text.tertiary}
            autoFocus
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.sectionLabel}>Mata Uang</Text>
          <ScrollView
            horizontal
            contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
            showsHorizontalScrollIndicator={false}
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

        {currency !== "IDR" && (
          <View style={styles.inputContainer}>
            <Ionicons
              name="cash-outline"
              size={20}
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
                  setExchangeRate(parseAmount(text).toString())
                }
              />
              {amount && exchangeRate && (
                <Text style={styles.helperText}>
                  Estimasi:{" "}
                  {formatCurrency(
                    parseAmount(amount) * parseAmount(exchangeRate)
                  )}
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Ionicons
              name="create-outline"
              size={20}
              color={theme.colors.text.secondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Nama Layanan (cth. Netflix)"
              value={name}
              onChangeText={setName}
              placeholderTextColor={theme.colors.text.tertiary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={theme.colors.text.secondary}
              style={styles.inputIcon}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Tanggal Tagihan (1-31)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: 25"
                value={billingDay}
                onChangeText={setBillingDay}
                keyboardType="numeric"
                maxLength={2}
                placeholderTextColor={theme.colors.text.tertiary}
              />
            </View>
          </View>

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

          {!paramCardId && (
            <>
              <Text style={styles.sectionLabel}>Sumber Dana</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {cards.map((card) => (
                  <TouchableOpacity
                    key={card.id}
                    style={[
                      styles.cardOption,
                      cardId === card.id && styles.cardOptionActive,
                      { borderColor: card.colorTheme || theme.colors.primary },
                    ]}
                    onPress={() => setCardId(card.id)}
                  >
                    <Ionicons
                      name="card"
                      size={20}
                      color={card.colorTheme || theme.colors.primary}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        styles.cardOptionText,
                        cardId === card.id && styles.cardOptionTextActive,
                      ]}
                    >
                      {card.alias}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: theme.spacing.s,
              marginBottom: theme.spacing.s,
            }}
          >
            <Text
              style={[styles.sectionLabel, { marginTop: 0, marginBottom: 0 }]}
            >
              Kategori
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text style={{ fontSize: 10, color: theme.colors.text.tertiary }}>
                Geser kiri
              </Text>
              <Ionicons
                name="arrow-forward"
                size={10}
                color={theme.colors.text.tertiary}
              />
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
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
                      size={18}
                      color={isSelected ? theme.colors.text.inverse : iconColor}
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

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Simpan Langganan</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 32,
    fontWeight: "600",
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.s,
  },
  amountInput: {
    fontSize: 48,
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
    height: 40,
  },
  inputLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    marginBottom: 2,
  },
  cycleContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    marginBottom: theme.spacing.l,
  },
  cycleButton: {
    flex: 1,
    paddingVertical: theme.spacing.s,
    alignItems: "center",
  },
  cycleButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  cycleText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  cycleTextActive: {
    color: theme.colors.text.inverse,
    fontWeight: "600",
  },
  sectionLabel: {
    ...theme.typography.h3,
    fontSize: 16,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.s,
    marginTop: theme.spacing.s,
  },
  horizontalScroll: {
    gap: theme.spacing.s,
    paddingBottom: theme.spacing.m,
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
    ...theme.shadows.small,
  },
  categoryText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
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
    color: theme.colors.text.inverse,
    fontSize: 16,
  },
  inputGroup: {
    marginBottom: theme.spacing.m,
  },
  currencyChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeCurrencyChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  currencyChipText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: "600",
  },
  activeCurrencyChipText: {
    color: theme.colors.text.inverse,
  },
  helperText: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    marginTop: 4,
  },
});
