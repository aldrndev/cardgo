import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/types";
import { useTheme, Theme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useCards } from "../context/CardsContext";
import { useLimitIncrease } from "../context/LimitIncreaseContext";
import {
  formatNumberInput,
  parseAmount,
  formatCurrency,
} from "../utils/formatters";
import { moderateScale } from "../utils/responsive";
import { Calendar, DateData } from "react-native-calendars";

type AddLimitIncreaseScreenRouteProp = RouteProp<
  RootStackParamList,
  "AddLimitIncrease"
>;

type AddLimitIncreaseScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddLimitIncrease"
>;

export const AddLimitIncreaseScreen = () => {
  const navigation = useNavigation<AddLimitIncreaseScreenNavigationProp>();
  const route = useRoute<AddLimitIncreaseScreenRouteProp>();
  const { cardId: paramCardId } = route.params || {};
  const { cards } = useCards();
  const { addRecord } = useLimitIncrease();
  const { theme, isDark } = useTheme();

  // Dynamic styles based on theme
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [selectedCardId, setSelectedCardId] = useState(
    paramCardId || cards[0]?.id || ""
  );
  const [requestDate, setRequestDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"permanent" | "temporary">("permanent");
  const [frequency, setFrequency] = useState(6);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleSave = async () => {
    if (!selectedCardId) {
      Alert.alert("Validasi Gagal", "Mohon pilih kartu kredit");
      return;
    }
    if (!amount || parseAmount(amount) <= 0) {
      Alert.alert(
        "Validasi Gagal",
        "Mohon isi jumlah kenaikan yang valid (lebih dari 0)"
      );
      return;
    }

    try {
      await addRecord({
        cardId: selectedCardId,
        requestDate: new Date(requestDate).toISOString(),
        amount: parseAmount(amount),
        type,
        frequency,
        status: "pending",
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Gagal menyimpan pengajuan");
    }
  };

  const frequencyOptions = type === "permanent" ? [6, 9, 12] : [1, 2, 3, 6];

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
        <Text style={styles.headerTitle}>Tambah Pengajuan</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Card Selector */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.label, { marginBottom: 0 }]}>
                Pilih Kartu
              </Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    "Info",
                    "Pilih kartu yang ingin diajukan kenaikan limitnya."
                  )
                }
              >
                <Ionicons
                  name="information-circle-outline"
                  size={moderateScale(20)}
                  color={theme.colors.text.tertiary}
                />
              </TouchableOpacity>
            </View>
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
                      selectedCardId === card.id && styles.cardOptionTextActive,
                    ]}
                  >
                    {card.alias}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Request Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tanggal Pengajuan</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowCalendar(true)}
            >
              <Text style={styles.dateText}>
                {new Date(requestDate).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <Ionicons
                name="calendar-outline"
                size={moderateScale(20)}
                color={theme.colors.text.tertiary}
              />
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Jumlah Kenaikan</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencyPrefix}>IDR</Text>
              <TextInput
                style={styles.amountInput}
                value={formatNumberInput(amount)}
                onChangeText={(text) => setAmount(parseAmount(text).toString())}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.colors.text.tertiary}
              />
            </View>
          </View>

          {/* Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Jenis Kenaikan</Text>
            <View style={styles.segmentContainer}>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  type === "permanent" && styles.segmentButtonActive,
                ]}
                onPress={() => {
                  setType("permanent");
                  setFrequency(6);
                }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    type === "permanent" && styles.segmentTextActive,
                  ]}
                >
                  Permanen
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  type === "temporary" && styles.segmentButtonActive,
                ]}
                onPress={() => {
                  setType("temporary");
                  setFrequency(3);
                }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    type === "temporary" && styles.segmentTextActive,
                  ]}
                >
                  Sementara
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Frequency */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rentang Waktu (Bulan)</Text>
            <View style={styles.chipsContainer}>
              {frequencyOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.chip, frequency === opt && styles.chipActive]}
                  onPress={() => setFrequency(opt)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      frequency === opt && styles.chipTextActive,
                    ]}
                  >
                    {opt} Bulan
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Simpan Pengajuan</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarContainer}>
            <Calendar
              current={requestDate}
              onDayPress={(day: DateData) => {
                setRequestDate(day.dateString);
                setShowCalendar(false);
              }}
              theme={{
                todayTextColor: theme.colors.primary,
                selectedDayBackgroundColor: theme.colors.primary,
                arrowColor: theme.colors.primary,
              }}
            />
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowCalendar(false)}
            >
              <Text style={styles.closeModalText}>Tutup</Text>
            </TouchableOpacity>
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
      paddingVertical: theme.spacing.m,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      ...theme.shadows.small,
    },
    headerTitle: {
      ...theme.typography.h2,
      color: theme.colors.text.primary,
    },
    content: {
      padding: theme.spacing.m,
      paddingBottom: 100,
    },
    section: {
      marginBottom: theme.spacing.l,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: theme.spacing.s,
    },
    label: {
      ...theme.typography.body,
      fontWeight: "600",
      color: theme.colors.text.primary,
      marginBottom: 8,
    },
    cardSelectorContent: {
      gap: theme.spacing.s,
      paddingRight: theme.spacing.m,
    },
    cardOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: "transparent",
      marginRight: 8,
    },
    cardOptionActive: {
      backgroundColor: theme.colors.surface,
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
      marginBottom: theme.spacing.l,
    },
    dateInput: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    dateText: {
      ...theme.typography.body,
      color: theme.colors.text.primary,
    },
    amountContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.m,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    currencyPrefix: {
      ...theme.typography.h3,
      color: theme.colors.text.tertiary,
      marginRight: theme.spacing.s,
    },
    amountInput: {
      flex: 1,
      ...theme.typography.h2,
      color: theme.colors.text.primary,
      paddingVertical: 8,
    },
    segmentContainer: {
      flexDirection: "row",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.m,
      padding: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    segmentButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 100, // Rounded
    },
    segmentButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    segmentText: {
      ...theme.typography.body,
      color: theme.colors.text.secondary,
      fontWeight: "600",
    },
    segmentTextActive: {
      color: theme.colors.text.inverse,
    },
    chipsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    chipActive: {
      backgroundColor: theme.colors.primary + "10",
      borderColor: theme.colors.primary,
    },
    chipText: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
    },
    chipTextActive: {
      color: theme.colors.primary,
      fontWeight: "600",
    },
    footer: {
      padding: theme.spacing.m,
      backgroundColor: theme.colors.background,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: theme.borderRadius.l,
      alignItems: "center",
      ...theme.shadows.medium,
    },
    saveButtonText: {
      ...theme.typography.h3,
      color: theme.colors.text.inverse,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      padding: theme.spacing.l,
    },
    calendarContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.m,
    },
    closeModalButton: {
      marginTop: theme.spacing.m,
      alignItems: "center",
      padding: theme.spacing.m,
    },
    closeModalText: {
      ...theme.typography.body,
      color: theme.colors.primary,
      fontWeight: "600",
    },
  });
