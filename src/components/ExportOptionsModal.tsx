import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { Card } from "../types/card";
import { moderateScale, scale } from "../utils/responsive";
import DateTimePicker from "@react-native-community/datetimepicker";

export interface ExportOptions {
  dateRange: { start: Date; end: Date };
  cardIds: string[]; // empty = all
  categories: string[]; // empty = all
  includeTransactions: boolean;
  includeCards: boolean;
  includeSubscriptions: boolean;
  includeInstallments: boolean;
  includePayments: boolean;
  format: "csv" | "txt" | "pdf";
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  cards: Card[];
  categories: string[];
}

type DatePreset =
  | "thisMonth"
  | "3months"
  | "6months"
  | "1year"
  | "all"
  | "custom";

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: "thisMonth", label: "Bulan Ini" },
  { key: "3months", label: "3 Bulan Terakhir" },
  { key: "6months", label: "6 Bulan Terakhir" },
  { key: "1year", label: "1 Tahun Terakhir" },
  { key: "all", label: "Semua Data" },
  { key: "custom", label: "Pilih Tanggal" },
];

export const ExportOptionsModal = ({
  visible,
  onClose,
  onExport,
  cards,
  categories,
}: Props) => {
  const [datePreset, setDatePreset] = useState<DatePreset>("thisMonth");
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [selectAllCards, setSelectAllCards] = useState(true);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  const [selectAllCategories, setSelectAllCategories] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [includeCards, setIncludeCards] = useState(true);
  const [includeSubscriptions, setIncludeSubscriptions] = useState(false);
  const [includeInstallments, setIncludeInstallments] = useState(false);
  const [includePayments, setIncludePayments] = useState(false);

  const [format, setFormat] = useState<"csv" | "txt" | "pdf">("csv");

  const dateRange = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (datePreset) {
      case "thisMonth":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = now;
        break;
      case "3months":
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        end = now;
        break;
      case "6months":
        start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        end = now;
        break;
      case "1year":
        start = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        end = now;
        break;
      case "all":
        start = new Date(2020, 0, 1); // Far back
        end = now;
        break;
      case "custom":
        start = customStartDate;
        end = customEndDate;
        break;
    }

    return { start, end };
  }, [datePreset, customStartDate, customEndDate]);

  const handleCardToggle = (cardId: string) => {
    if (selectAllCards) {
      // Switching from "all" to individual selection
      setSelectAllCards(false);
      const allIds = cards.map((c) => c.id);
      setSelectedCardIds(allIds.filter((id) => id !== cardId));
    } else {
      if (selectedCardIds.includes(cardId)) {
        setSelectedCardIds(selectedCardIds.filter((id) => id !== cardId));
      } else {
        setSelectedCardIds([...selectedCardIds, cardId]);
      }
    }
  };

  const handleCategoryToggle = (category: string) => {
    if (selectAllCategories) {
      setSelectAllCategories(false);
      setSelectedCategories(categories.filter((c) => c !== category));
    } else {
      if (selectedCategories.includes(category)) {
        setSelectedCategories(selectedCategories.filter((c) => c !== category));
      } else {
        setSelectedCategories([...selectedCategories, category]);
      }
    }
  };

  const handleExport = () => {
    const options: ExportOptions = {
      dateRange,
      cardIds: selectAllCards ? [] : selectedCardIds,
      categories: selectAllCategories ? [] : selectedCategories,
      includeTransactions,
      includeCards,
      includeSubscriptions,
      includeInstallments,
      includePayments,
      format,
    };
    onExport(options);
  };

  const activeCards = cards.filter((c) => !c.isArchived);
  const archivedCards = cards.filter((c) => c.isArchived);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Export Laporan Kustom</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons
                name="close"
                size={24}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Date Range Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={styles.sectionTitle}>Periode</Text>
              </View>

              <View style={styles.presetContainer}>
                {DATE_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.key}
                    style={[
                      styles.presetChip,
                      datePreset === preset.key && styles.presetChipActive,
                    ]}
                    onPress={() => setDatePreset(preset.key)}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        datePreset === preset.key && styles.presetTextActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {datePreset === "custom" && (
                <View style={styles.customDateRow}>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowStartPicker(true)}
                  >
                    <Ionicons
                      name="calendar"
                      size={16}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.dateButtonText}>
                      {formatDate(customStartDate)}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.dateSeparator}>—</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowEndPicker(true)}
                  >
                    <Ionicons
                      name="calendar"
                      size={16}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.dateButtonText}>
                      {formatDate(customEndDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Date Pickers - Platform specific handling */}
              {showStartPicker && (
                <View style={styles.datePickerContainer}>
                  <View style={styles.datePickerHeader}>
                    <Text style={styles.datePickerLabel}>Tanggal Mulai</Text>
                    {Platform.OS === "ios" && (
                      <TouchableOpacity
                        onPress={() => setShowStartPicker(false)}
                        style={styles.datePickerDone}
                      >
                        <Text style={styles.datePickerDoneText}>Selesai</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <DateTimePicker
                    value={customStartDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(_event: any, date?: Date) => {
                      // On Android, the picker auto-dismisses
                      if (Platform.OS === "android") {
                        setShowStartPicker(false);
                      }
                      if (date) setCustomStartDate(date);
                    }}
                    maximumDate={customEndDate}
                    textColor={theme.colors.text.primary}
                    themeVariant="light"
                  />
                </View>
              )}
              {showEndPicker && (
                <View style={styles.datePickerContainer}>
                  <View style={styles.datePickerHeader}>
                    <Text style={styles.datePickerLabel}>Tanggal Akhir</Text>
                    {Platform.OS === "ios" && (
                      <TouchableOpacity
                        onPress={() => setShowEndPicker(false)}
                        style={styles.datePickerDone}
                      >
                        <Text style={styles.datePickerDoneText}>Selesai</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <DateTimePicker
                    value={customEndDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(_event: any, date?: Date) => {
                      // On Android, the picker auto-dismisses
                      if (Platform.OS === "android") {
                        setShowEndPicker(false);
                      }
                      if (date) setCustomEndDate(date);
                    }}
                    minimumDate={customStartDate}
                    textColor={theme.colors.text.primary}
                    themeVariant="light"
                  />
                </View>
              )}

              <Text style={styles.datePreview}>
                {formatDate(dateRange.start)} — {formatDate(dateRange.end)}
              </Text>
            </View>

            {/* Cards Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="card-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={styles.sectionTitle}>Kartu</Text>
              </View>

              <TouchableOpacity
                style={styles.selectAllRow}
                onPress={() => {
                  setSelectAllCards(!selectAllCards);
                  if (!selectAllCards) {
                    setSelectedCardIds([]);
                  }
                }}
              >
                <Ionicons
                  name={selectAllCards ? "checkbox" : "square-outline"}
                  size={22}
                  color={
                    selectAllCards
                      ? theme.colors.primary
                      : theme.colors.text.tertiary
                  }
                />
                <Text style={styles.selectAllText}>Semua Kartu</Text>
              </TouchableOpacity>

              {!selectAllCards && (
                <View style={styles.cardsList}>
                  {activeCards.map((card) => (
                    <TouchableOpacity
                      key={card.id}
                      style={styles.cardItem}
                      onPress={() => handleCardToggle(card.id)}
                    >
                      <Ionicons
                        name={
                          selectedCardIds.includes(card.id)
                            ? "checkbox"
                            : "square-outline"
                        }
                        size={20}
                        color={
                          selectedCardIds.includes(card.id)
                            ? theme.colors.primary
                            : theme.colors.text.tertiary
                        }
                      />
                      <Text style={styles.cardItemText}>{card.alias}</Text>
                    </TouchableOpacity>
                  ))}
                  {archivedCards.length > 0 && (
                    <>
                      <Text style={styles.archivedLabel}>Archived</Text>
                      {archivedCards.map((card) => (
                        <TouchableOpacity
                          key={card.id}
                          style={styles.cardItem}
                          onPress={() => handleCardToggle(card.id)}
                        >
                          <Ionicons
                            name={
                              selectedCardIds.includes(card.id)
                                ? "checkbox"
                                : "square-outline"
                            }
                            size={20}
                            color={
                              selectedCardIds.includes(card.id)
                                ? theme.colors.primary
                                : theme.colors.text.tertiary
                            }
                          />
                          <Text
                            style={[styles.cardItemText, styles.archivedText]}
                          >
                            {card.alias}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}
                </View>
              )}
            </View>

            {/* Categories Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="pricetag-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={styles.sectionTitle}>Kategori</Text>
              </View>

              <TouchableOpacity
                style={styles.selectAllRow}
                onPress={() => {
                  setSelectAllCategories(!selectAllCategories);
                  if (!selectAllCategories) {
                    setSelectedCategories([]);
                  }
                }}
              >
                <Ionicons
                  name={selectAllCategories ? "checkbox" : "square-outline"}
                  size={22}
                  color={
                    selectAllCategories
                      ? theme.colors.primary
                      : theme.colors.text.tertiary
                  }
                />
                <Text style={styles.selectAllText}>Semua Kategori</Text>
              </TouchableOpacity>

              {!selectAllCategories && (
                <View style={styles.categoryChips}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryChip,
                        selectedCategories.includes(category) &&
                          styles.categoryChipActive,
                      ]}
                      onPress={() => handleCategoryToggle(category)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          selectedCategories.includes(category) &&
                            styles.categoryChipTextActive,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Data Types Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="folder-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={styles.sectionTitle}>Data yang Diexport</Text>
              </View>

              <View style={styles.dataTypeList}>
                <View style={styles.dataTypeRow}>
                  <View style={styles.dataTypeInfo}>
                    <Ionicons
                      name="swap-horizontal"
                      size={18}
                      color={theme.colors.text.secondary}
                    />
                    <Text style={styles.dataTypeText}>Transaksi</Text>
                  </View>
                  <Switch
                    value={includeTransactions}
                    onValueChange={setIncludeTransactions}
                    trackColor={{
                      false: theme.colors.border,
                      true: theme.colors.primary + "50",
                    }}
                    thumbColor={
                      includeTransactions
                        ? theme.colors.primary
                        : theme.colors.text.tertiary
                    }
                  />
                </View>

                <View style={styles.dataTypeRow}>
                  <View style={styles.dataTypeInfo}>
                    <Ionicons
                      name="card"
                      size={18}
                      color={theme.colors.text.secondary}
                    />
                    <Text style={styles.dataTypeText}>Ringkasan Kartu</Text>
                  </View>
                  <Switch
                    value={includeCards}
                    onValueChange={setIncludeCards}
                    trackColor={{
                      false: theme.colors.border,
                      true: theme.colors.primary + "50",
                    }}
                    thumbColor={
                      includeCards
                        ? theme.colors.primary
                        : theme.colors.text.tertiary
                    }
                  />
                </View>

                <View style={styles.dataTypeRow}>
                  <View style={styles.dataTypeInfo}>
                    <Ionicons
                      name="repeat"
                      size={18}
                      color={theme.colors.text.secondary}
                    />
                    <Text style={styles.dataTypeText}>Langganan</Text>
                  </View>
                  <Switch
                    value={includeSubscriptions}
                    onValueChange={setIncludeSubscriptions}
                    trackColor={{
                      false: theme.colors.border,
                      true: theme.colors.primary + "50",
                    }}
                    thumbColor={
                      includeSubscriptions
                        ? theme.colors.primary
                        : theme.colors.text.tertiary
                    }
                  />
                </View>

                <View style={styles.dataTypeRow}>
                  <View style={styles.dataTypeInfo}>
                    <Ionicons
                      name="layers"
                      size={18}
                      color={theme.colors.text.secondary}
                    />
                    <Text style={styles.dataTypeText}>Cicilan</Text>
                  </View>
                  <Switch
                    value={includeInstallments}
                    onValueChange={setIncludeInstallments}
                    trackColor={{
                      false: theme.colors.border,
                      true: theme.colors.primary + "50",
                    }}
                    thumbColor={
                      includeInstallments
                        ? theme.colors.primary
                        : theme.colors.text.tertiary
                    }
                  />
                </View>

                <View style={styles.dataTypeRow}>
                  <View style={styles.dataTypeInfo}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={theme.colors.text.secondary}
                    />
                    <Text style={styles.dataTypeText}>Riwayat Pembayaran</Text>
                  </View>
                  <Switch
                    value={includePayments}
                    onValueChange={setIncludePayments}
                    trackColor={{
                      false: theme.colors.border,
                      true: theme.colors.primary + "50",
                    }}
                    thumbColor={
                      includePayments
                        ? theme.colors.primary
                        : theme.colors.text.tertiary
                    }
                  />
                </View>
              </View>
            </View>

            {/* Format Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="document-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={styles.sectionTitle}>Format</Text>
              </View>

              <View style={styles.formatOptions}>
                <TouchableOpacity
                  style={[
                    styles.formatOption,
                    format === "csv" && styles.formatOptionActive,
                  ]}
                  onPress={() => setFormat("csv")}
                >
                  <Ionicons
                    name={
                      format === "csv" ? "radio-button-on" : "radio-button-off"
                    }
                    size={20}
                    color={
                      format === "csv"
                        ? theme.colors.primary
                        : theme.colors.text.tertiary
                    }
                  />
                  <View style={styles.formatInfo}>
                    <Text style={styles.formatTitle}>CSV</Text>
                    <Text style={styles.formatDesc}>
                      Bisa dibuka di Excel, Google Sheets
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.formatOption,
                    format === "txt" && styles.formatOptionActive,
                  ]}
                  onPress={() => setFormat("txt")}
                >
                  <Ionicons
                    name={
                      format === "txt" ? "radio-button-on" : "radio-button-off"
                    }
                    size={20}
                    color={
                      format === "txt"
                        ? theme.colors.primary
                        : theme.colors.text.tertiary
                    }
                  />
                  <View style={styles.formatInfo}>
                    <Text style={styles.formatTitle}>Text Report</Text>
                    <Text style={styles.formatDesc}>
                      Laporan teks yang mudah dibaca
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.formatOption,
                    format === "pdf" && styles.formatOptionActive,
                  ]}
                  onPress={() => setFormat("pdf")}
                >
                  <Ionicons
                    name={
                      format === "pdf" ? "radio-button-on" : "radio-button-off"
                    }
                    size={20}
                    color={
                      format === "pdf"
                        ? theme.colors.primary
                        : theme.colors.text.tertiary
                    }
                  />
                  <View style={styles.formatInfo}>
                    <Text style={styles.formatTitle}>PDF</Text>
                    <Text style={styles.formatDesc}>
                      Laporan profesional, bisa dicetak
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Export Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExport}
            >
              <Ionicons name="download-outline" size={20} color="#FFFFFF" />
              <Text style={styles.exportButtonText}>Export Sekarang</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.s,
  },
  content: {
    padding: theme.spacing.m,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.s,
    marginBottom: theme.spacing.m,
  },
  sectionTitle: {
    ...theme.typography.body,
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
  presetContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.s,
  },
  presetChip: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  presetChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  presetText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  presetTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  customDateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.m,
    gap: theme.spacing.s,
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.s,
    padding: theme.spacing.m,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateButtonText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
  },
  dateSeparator: {
    ...theme.typography.body,
    color: theme.colors.text.tertiary,
  },
  datePreview: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.m,
    textAlign: "center",
  },
  datePickerContainer: {
    marginTop: theme.spacing.m,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.s,
  },
  datePickerLabel: {
    ...theme.typography.body,
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
  datePickerDone: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.xs,
  },
  datePickerDoneText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  selectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.m,
    paddingVertical: theme.spacing.s,
  },
  selectAllText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: "500",
  },
  cardsList: {
    marginTop: theme.spacing.s,
    paddingLeft: theme.spacing.l,
  },
  cardItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.m,
    paddingVertical: theme.spacing.s,
  },
  cardItemText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  archivedLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.xs,
    fontWeight: "600",
  },
  archivedText: {
    fontStyle: "italic",
  },
  categoryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.s,
    marginTop: theme.spacing.s,
  },
  categoryChip: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary + "15",
    borderColor: theme.colors.primary,
  },
  categoryChipText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  categoryChipTextActive: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  dataTypeList: {
    gap: theme.spacing.s,
  },
  dataTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.s,
  },
  dataTypeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.m,
  },
  dataTypeText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
  },
  formatOptions: {
    gap: theme.spacing.s,
  },
  formatOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.m,
    padding: theme.spacing.m,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  formatOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + "08",
  },
  formatInfo: {
    flex: 1,
  },
  formatTitle: {
    ...theme.typography.body,
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
  formatDesc: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
  },
  footer: {
    padding: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.s,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
  },
  exportButtonText: {
    ...theme.typography.button,
    color: "#FFFFFF",
  },
});
