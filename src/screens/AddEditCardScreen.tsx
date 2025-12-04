import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { theme } from "../constants/theme";
import { colors } from "../constants/colors";
import { useCards } from "../context/CardsContext";
import { RootStackParamList } from "../navigation/types";
import { CardFormData, CARD_THEMES } from "../types/card";
import { formatNumberInput, parseAmount } from "../utils/formatters";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { CreditCard } from "../components/CreditCard";
import { scale, moderateScale } from "../utils/responsive";

type AddEditCardScreenRouteProp = RouteProp<RootStackParamList, "AddEditCard">;
type AddEditCardScreenNavigationProp = any; // Placeholder for navigation type

// Indonesian banks with credit card services
const INDONESIAN_BANKS: string[] = [
  "BCA",
  "BNI",
  "BRI",
  "Mandiri",
  "CIMB Niaga",
  "Danamon",
  "Permata",
  "OCBC NISP",
  "Panin",
  "Maybank",
  "HSBC",
  "Standard Chartered",
  "UOB",
  "DBS",
  "Bank Mega",
  "BTN",
  "Bukopin",
  "Sinarmas",
  "Jenius",
  "Digibank",
  "Other",
];

const networks = ["Visa", "Mastercard", "JCB", "Amex", "Other"];

export const AddEditCardScreen = () => {
  const navigation = useNavigation<AddEditCardScreenNavigationProp>();
  const route = useRoute<AddEditCardScreenRouteProp>();
  const { addCard, updateCard, cards } = useCards();
  const { cardId } = route.params || {};

  const isEditing = !!cardId;
  const existingCard = cards.find((c) => c.id === cardId);

  // Initialize with empty/undefined values for "Add" mode
  const [formData, setFormData] = useState<Partial<CardFormData>>({
    alias: "",
    bankName: "",
    network: "Visa", // Keep a default for network as it's a selection
    colorTheme: theme.colors.primary,
    themeId: "blue",
    billingCycleDay: undefined,
    dueDay: undefined,
    creditLimit: undefined,
    currentUsage: undefined,
    monthlyBudget: undefined,
    notes: "",
    last4: "",
    tags: [],
    expiryMonth: undefined,
    annualFeeAmount: undefined,
    isAnnualFeeReminderEnabled: false,
    limitIncreaseType: "permanent",
    lastLimitIncreaseDate: undefined,
    limitIncreaseFrequency: 6,
    nextLimitIncreaseDate: undefined,
    isLimitIncreaseReminderEnabled: false,
  });
  const [tagInput, setTagInput] = useState("");
  const [monthError, setMonthError] = useState("");

  useEffect(() => {
    if (isEditing && existingCard) {
      setFormData({
        alias: existingCard.alias,
        bankName: existingCard.bankName,
        network: existingCard.network,
        colorTheme: existingCard.colorTheme,
        themeId: existingCard.themeId || "blue",
        billingCycleDay: existingCard.billingCycleDay,
        dueDay: existingCard.dueDay,
        creditLimit: existingCard.creditLimit,
        currentUsage: existingCard.currentUsage,
        monthlyBudget: existingCard.monthlyBudget || 0,
        notes: existingCard.notes || "",
        last4: existingCard.last4 || "",
        tags: existingCard.tags || [],
        expiryMonth: existingCard.expiryMonth,
        annualFeeAmount: existingCard.annualFeeAmount,
        isAnnualFeeReminderEnabled: existingCard.isAnnualFeeReminderEnabled,
        limitIncreaseType: existingCard.limitIncreaseType || "permanent",
        lastLimitIncreaseDate: existingCard.lastLimitIncreaseDate,
        limitIncreaseFrequency: existingCard.limitIncreaseFrequency || 6,
        nextLimitIncreaseDate: existingCard.nextLimitIncreaseDate,
        isLimitIncreaseReminderEnabled:
          existingCard.isLimitIncreaseReminderEnabled,
      });
    }
  }, [isEditing, existingCard]);

  // Auto-calculate next limit increase date
  useEffect(() => {
    if (formData.lastLimitIncreaseDate && formData.limitIncreaseFrequency) {
      const lastDate = new Date(formData.lastLimitIncreaseDate);
      if (!isNaN(lastDate.getTime())) {
        const nextDate = new Date(lastDate);
        nextDate.setMonth(
          nextDate.getMonth() + (formData.limitIncreaseFrequency || 6)
        );
        const nextDateString = nextDate.toISOString();
        if (formData.nextLimitIncreaseDate !== nextDateString) {
          setFormData((prev) => ({
            ...prev,
            nextLimitIncreaseDate: nextDateString,
          }));
        }
      }
    }
  }, [formData.lastLimitIncreaseDate, formData.limitIncreaseFrequency]);

  const handleSave = async () => {
    // Validate required fields
    if (!formData.alias?.trim()) {
      Alert.alert("Validasi Gagal", "Mohon isi Nama Alias Kartu");
      return;
    }
    if (!formData.bankName?.trim()) {
      Alert.alert("Validasi Gagal", "Mohon isi Nama Bank");
      return;
    }
    if (!formData.network) {
      Alert.alert("Validasi Gagal", "Mohon pilih Jaringan Kartu");
      return;
    }
    if (
      formData.billingCycleDay === undefined ||
      formData.billingCycleDay === null
    ) {
      Alert.alert("Validasi Gagal", "Mohon isi Tanggal Cetak Tagihan");
      return;
    }
    if (formData.dueDay === undefined || formData.dueDay === null) {
      Alert.alert("Validasi Gagal", "Mohon isi Tanggal Jatuh Tempo");
      return;
    }
    if (formData.creditLimit === undefined || formData.creditLimit === null) {
      Alert.alert("Validasi Gagal", "Mohon isi Limit Kredit");
      return;
    }

    if (formData.last4 && formData.last4.length > 4) {
      Alert.alert(
        "Peringatan Keamanan",
        "Mohon masukkan hanya 4 digit terakhir kartu Anda."
      );
      return;
    }

    try {
      const dataToSave = formData as CardFormData; // Cast after validation
      if (isEditing && cardId) {
        await updateCard(cardId, dataToSave);
      } else {
        await addCard(dataToSave);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Gagal menyimpan kartu");
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const newTag = tagInput.trim();
      if (!formData.tags?.includes(newTag)) {
        setFormData({
          ...formData,
          tags: [...(formData.tags || []), newTag],
        });
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((tag) => tag !== tagToRemove),
    });
  };

  const suggestedTags = ["Pribadi", "Bisnis", "Travel", "Belanja", "Cicilan"];

  // Mock card object for preview
  const previewCard = {
    id: "preview",
    ...formData,
    creditLimit: Number(formData.creditLimit) || 0,
    currentUsage: Number(formData.currentUsage) || 0,
    billingCycleDay: Number(formData.billingCycleDay) || 1,
    dueDay: Number(formData.dueDay) || 1,
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons
              name="arrow-back"
              size={moderateScale(24)}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? "Edit Kartu" : "Tambah Kartu"}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Live Preview */}
          <View style={styles.previewContainer}>
            <CreditCard
              card={previewCard as any}
              onPress={() => {}}
              containerStyle={{ width: "100%" }}
            />
            <Text style={styles.previewLabel}>Preview Tampilan Kartu</Text>
          </View>

          {/* Section 1: Informasi Utama */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi Utama</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Alias</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="card-outline"
                  size={moderateScale(20)}
                  color={theme.colors.text.tertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.alias}
                  onChangeText={(text) =>
                    setFormData({ ...formData, alias: text })
                  }
                  placeholder="cth. BCA Platinum"
                  placeholderTextColor={theme.colors.text.tertiary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Bank</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.networkContainer}
              >
                {INDONESIAN_BANKS.map((bank) => (
                  <TouchableOpacity
                    key={bank}
                    style={[
                      styles.networkOption,
                      formData.bankName === bank && styles.selectedNetwork,
                    ]}
                    onPress={() => setFormData({ ...formData, bankName: bank })}
                  >
                    <Text
                      style={[
                        styles.networkText,
                        formData.bankName === bank &&
                          styles.selectedNetworkText,
                      ]}
                    >
                      {bank}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Jaringan (Network)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.networkContainer}
              >
                {networks.map((net) => (
                  <TouchableOpacity
                    key={net}
                    style={[
                      styles.networkOption,
                      formData.network === net && styles.selectedNetwork,
                    ]}
                    onPress={() =>
                      setFormData({ ...formData, network: net as any })
                    }
                  >
                    <Text
                      style={[
                        styles.networkText,
                        formData.network === net && styles.selectedNetworkText,
                      ]}
                    >
                      {net}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Section 2: Tampilan */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tampilan Kartu</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.themeContainer}
            >
              {CARD_THEMES.map((themeOption) => (
                <TouchableOpacity
                  key={themeOption.id}
                  style={[
                    styles.themeOption,
                    formData.themeId === themeOption.id && styles.selectedTheme,
                  ]}
                  onPress={() =>
                    setFormData({
                      ...formData,
                      themeId: themeOption.id,
                      colorTheme: themeOption.colors[0],
                    })
                  }
                >
                  <LinearGradient
                    colors={themeOption.colors}
                    style={styles.themePreview}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {formData.themeId === themeOption.id && (
                      <Ionicons
                        name="checkmark"
                        size={moderateScale(24)}
                        color="#FFF"
                      />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Section 3: Detail Keuangan */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detail Keuangan</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Tgl Cetak</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="calendar-outline"
                    size={moderateScale(20)}
                    color={theme.colors.text.tertiary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={
                      formData.billingCycleDay !== undefined
                        ? String(formData.billingCycleDay)
                        : ""
                    }
                    onChangeText={(text) => {
                      const val = parseInt(text);
                      if (!text || (val >= 1 && val <= 31)) {
                        setFormData({
                          ...formData,
                          billingCycleDay: text ? val : undefined,
                        });
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholder="1-31"
                    placeholderTextColor={theme.colors.text.tertiary}
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Jatuh Tempo</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="calendar-outline"
                    size={moderateScale(20)}
                    color={theme.colors.text.tertiary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={
                      formData.dueDay !== undefined
                        ? String(formData.dueDay)
                        : ""
                    }
                    onChangeText={(text) => {
                      const val = parseInt(text);
                      if (!text || (val >= 1 && val <= 31)) {
                        setFormData({
                          ...formData,
                          dueDay: text ? val : undefined,
                        });
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholder="1-31"
                    placeholderTextColor={theme.colors.text.tertiary}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Limit Kredit</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencyPrefix}>Rp</Text>
                <TextInput
                  style={styles.input}
                  value={formatNumberInput(formData.creditLimit)}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      creditLimit: text ? parseAmount(text) : undefined,
                    })
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.colors.text.tertiary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Budget Bulanan (Opsional)</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencyPrefix}>Rp</Text>
                <TextInput
                  style={styles.input}
                  value={formatNumberInput(formData.monthlyBudget)}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      monthlyBudget: text ? parseAmount(text) : undefined,
                    })
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.colors.text.tertiary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>4 Digit Terakhir (Opsional)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={moderateScale(20)}
                  color={theme.colors.text.tertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.last4}
                  onChangeText={(text) => {
                    if (text.length <= 4) {
                      setFormData({ ...formData, last4: text });
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={4}
                  placeholder="****"
                  placeholderTextColor={theme.colors.text.tertiary}
                />
              </View>
              <Text style={styles.helperText}>
                Hanya untuk identifikasi, bukan nomor lengkap.
              </Text>
            </View>
          </View>

          {/* Section: Pengingat & Jadwal */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pengingat & Jadwal</Text>

            {/* Annual Fee */}
            <View
              style={[styles.inputGroup, { marginBottom: theme.spacing.l }]}
            >
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.label}>Ingatkan Annual Fee</Text>
                  <Text style={styles.helperText}>
                    Diingatkan bulan depan setelah bulan expired
                  </Text>
                </View>
                <Switch
                  value={formData.isAnnualFeeReminderEnabled}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      isAnnualFeeReminderEnabled: val,
                    })
                  }
                  trackColor={{
                    false: theme.colors.border,
                    true: theme.colors.primary,
                  }}
                />
              </View>

              {formData.isAnnualFeeReminderEnabled && (
                <View style={styles.indentedContent}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Bulan Expired (MM)</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        monthError
                          ? {
                              borderColor: theme.colors.status.error,
                              borderWidth: 1,
                            }
                          : {},
                      ]}
                    >
                      <TextInput
                        style={styles.input}
                        value={
                          formData.expiryMonth
                            ? String(formData.expiryMonth)
                            : ""
                        }
                        onChangeText={(text) => {
                          setMonthError("");
                          if (!text) {
                            setFormData({
                              ...formData,
                              expiryMonth: undefined,
                            });
                            return;
                          }
                          const val = parseInt(text);
                          if (isNaN(val) || val < 1 || val > 12) {
                            setMonthError("Bulan harus antara 1-12");
                          } else {
                            setFormData({
                              ...formData,
                              expiryMonth: val,
                            });
                          }
                        }}
                        keyboardType="numeric"
                        maxLength={2}
                        placeholder="1-12"
                        placeholderTextColor={theme.colors.text.tertiary}
                      />
                    </View>
                    {monthError && (
                      <Text
                        style={{
                          color: theme.colors.status.error,
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        {monthError}
                      </Text>
                    )}
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Estimasi Biaya</Text>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.currencyPrefix}>Rp</Text>
                      <TextInput
                        style={styles.input}
                        value={formatNumberInput(formData.annualFeeAmount)}
                        onChangeText={(text) =>
                          setFormData({
                            ...formData,
                            annualFeeAmount: text
                              ? parseAmount(text)
                              : undefined,
                          })
                        }
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={theme.colors.text.tertiary}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Limit Increase */}
            <View style={styles.inputGroup}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.label}>Target Kenaikan Limit</Text>
                  <Text style={styles.helperText}>
                    Ingatkan saat eligible naik limit
                  </Text>
                </View>
                <Switch
                  value={formData.isLimitIncreaseReminderEnabled}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      isLimitIncreaseReminderEnabled: val,
                    })
                  }
                  trackColor={{
                    false: theme.colors.border,
                    true: theme.colors.primary,
                  }}
                />
              </View>

              {formData.isLimitIncreaseReminderEnabled && (
                <View style={styles.indentedContent}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Jenis Kenaikan</Text>
                    <View style={styles.row}>
                      <TouchableOpacity
                        style={[
                          styles.chipOption,
                          formData.limitIncreaseType === "permanent" &&
                            styles.chipOptionSelected,
                        ]}
                        onPress={() =>
                          setFormData({
                            ...formData,
                            limitIncreaseType: "permanent",
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            formData.limitIncreaseType === "permanent" &&
                              styles.chipTextSelected,
                          ]}
                        >
                          Permanen
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.chipOption,
                          formData.limitIncreaseType === "temporary" &&
                            styles.chipOptionSelected,
                        ]}
                        onPress={() =>
                          setFormData({
                            ...formData,
                            limitIncreaseType: "temporary",
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            formData.limitIncreaseType === "temporary" &&
                              styles.chipTextSelected,
                          ]}
                        >
                          Sementara
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      Tgl Pengajuan Terakhir (YYYY-MM-DD)
                    </Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons
                        name="calendar-outline"
                        size={moderateScale(20)}
                        color={theme.colors.text.tertiary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        value={
                          formData.lastLimitIncreaseDate
                            ? formData.lastLimitIncreaseDate.split("T")[0]
                            : ""
                        }
                        onChangeText={(text) =>
                          setFormData({
                            ...formData,
                            lastLimitIncreaseDate: text, // Simple text input for now, format validation needed or use DatePicker
                          })
                        }
                        placeholder="2023-01-01"
                        placeholderTextColor={theme.colors.text.tertiary}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Jarak Pengajuan (Bulan)</Text>
                    <View style={styles.row}>
                      {[6, 9, 12].map((months) => (
                        <TouchableOpacity
                          key={months}
                          style={[
                            styles.chipOption,
                            formData.limitIncreaseFrequency === months &&
                              styles.chipOptionSelected,
                          ]}
                          onPress={() =>
                            setFormData({
                              ...formData,
                              limitIncreaseFrequency: months,
                            })
                          }
                        >
                          <Text
                            style={[
                              styles.chipText,
                              formData.limitIncreaseFrequency === months &&
                                styles.chipTextSelected,
                            ]}
                          >
                            {months} Bulan
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {formData.nextLimitIncreaseDate && (
                    <View style={styles.infoBox}>
                      <Ionicons
                        name="information-circle"
                        size={moderateScale(20)}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.infoText}>
                        Eligible berikutnya:{" "}
                        {new Date(
                          formData.nextLimitIncreaseDate
                        ).toLocaleDateString("id-ID", {
                          dateStyle: "full",
                        })}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Section 4: Lainnya */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lainnya</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tags</Text>
              <View style={styles.tagInputContainer}>
                <View
                  style={[styles.inputWrapper, { flex: 1, marginBottom: 0 }]}
                >
                  <Ionicons
                    name="pricetag-outline"
                    size={moderateScale(20)}
                    color={theme.colors.text.tertiary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={tagInput}
                    onChangeText={setTagInput}
                    placeholder="Tambah tag..."
                    placeholderTextColor={theme.colors.text.tertiary}
                    onSubmitEditing={handleAddTag}
                  />
                </View>
                <TouchableOpacity
                  style={styles.addTagButton}
                  onPress={handleAddTag}
                >
                  <Ionicons name="add" size={moderateScale(24)} color="#FFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.tagsContainer}>
                {formData.tags?.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.tagChip}
                    onPress={() => removeTag(tag)}
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                    <Ionicons
                      name="close-circle"
                      size={moderateScale(16)}
                      color={theme.colors.text.secondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.suggestedTags}
              >
                {suggestedTags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.suggestedTagChip}
                    onPress={() => {
                      if (!formData.tags?.includes(tag)) {
                        setFormData({
                          ...formData,
                          tags: [...(formData.tags || []), tag],
                        });
                      }
                    }}
                  >
                    <Text style={styles.suggestedTagText}>+ {tag}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Catatan</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) =>
                  setFormData({ ...formData, notes: text })
                }
                placeholder="Catatan tambahan..."
                placeholderTextColor={theme.colors.text.tertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Simpan Kartu</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
    zIndex: 10,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  scrollContent: {
    padding: theme.spacing.m,
    paddingBottom: 100,
  },
  previewContainer: {
    marginBottom: theme.spacing.l,
  },
  previewLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.s,
    textAlign: "center",
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.small,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.m,
    fontSize: moderateScale(18),
  },
  inputGroup: {
    marginBottom: theme.spacing.m,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: 8,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.m,
  },
  inputIcon: {
    marginRight: theme.spacing.s,
  },
  currencyPrefix: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: "600",
    marginRight: theme.spacing.s,
  },
  input: {
    flex: 1,
    height: scale(48),
    ...theme.typography.body,
    color: theme.colors.text.primary,
  },
  textArea: {
    height: scale(100),
    paddingVertical: theme.spacing.s,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.m,
  },
  networkContainer: {
    gap: theme.spacing.s,
  },
  networkOption: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.s,
  },
  selectedNetwork: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  networkText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: "600",
  },
  selectedNetworkText: {
    color: "#FFF",
  },
  themeContainer: {
    paddingVertical: theme.spacing.s,
  },
  themeOption: {
    marginRight: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    padding: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedTheme: {
    borderColor: theme.colors.primary,
  },
  themePreview: {
    width: scale(60),
    height: scale(40),
    borderRadius: theme.borderRadius.s,
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
  },
  helperText: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    marginTop: 4,
    fontSize: moderateScale(11),
  },
  tagInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.s,
    marginBottom: theme.spacing.s,
  },
  addTagButton: {
    width: theme.containerSizes.buttonHeight,
    height: theme.containerSizes.buttonHeight,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.s,
    marginBottom: theme.spacing.s,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 4,
  },
  tagText: {
    ...theme.typography.caption,
    color: theme.colors.text.primary,
  },
  suggestedTags: {
    flexDirection: "row",
  },
  suggestedTagChip: {
    marginRight: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: "dashed",
  },
  suggestedTagText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    alignItems: "center",
    marginTop: theme.spacing.m,
    ...theme.shadows.medium,
  },
  saveButtonText: {
    ...theme.typography.button,
    color: theme.colors.text.inverse,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.s,
  },
  indentedContent: {
    marginLeft: theme.spacing.s,
    paddingLeft: theme.spacing.m,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.border,
    marginTop: theme.spacing.s,
  },
  chipOption: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.s,
  },
  chipOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: "#FFF",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary + "15",
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginTop: theme.spacing.s,
    gap: theme.spacing.s,
  },
  infoText: {
    ...theme.typography.caption,
    color: theme.colors.text.primary,
    flex: 1,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.status.error,
    marginTop: 4,
  },
});
