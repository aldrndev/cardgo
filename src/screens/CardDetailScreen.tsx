import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useTheme, Theme } from "../context/ThemeContext";
import { useCards } from "../context/CardsContext";
import { useLimitIncrease } from "../context/LimitIncreaseContext";
import { RootStackParamList } from "../navigation/types";
import { CreditCard } from "../components/CreditCard";
import { calculateHealthScore, getHealthColor } from "../utils/healthScore";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  formatCurrency,
  formatForeignCurrency,
  formatNumberInput,
  parseAmount,
} from "../utils/formatters";
import { Ionicons } from "@expo/vector-icons";
import { getBillingCycleRange, formatDateRange } from "../utils/billingCycle";
import { getCategoryIcon } from "../utils/categoryIcons";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { scale, moderateScale, isTablet, width } from "../utils/responsive";
import { PaymentHistorySection } from "../components/PaymentHistorySection";
import { ExpandableFAB } from "../components/FloatingActionButton";
import React, { useState, useMemo } from "react";

type CardDetailScreenRouteProp = RouteProp<RootStackParamList, "CardDetail">;
type CardDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CardDetail"
>;

const CARD_WIDTH = isTablet ? Math.min(width * 0.6, 450) : width * 0.92;

export const CardDetailScreen = () => {
  const navigation = useNavigation<CardDetailScreenNavigationProp>();
  const route = useRoute<CardDetailScreenRouteProp>();
  const { cardId } = route.params;
  const { theme, isDark } = useTheme();
  const {
    cards,
    deleteCard,
    archiveCard,
    transactions,
    subscriptions,
    markCardAsPaid,
    getPaymentHistory,
  } = useCards();
  const { getRecordsByCardId } = useLimitIncrease();
  const card = cards.find((c) => c.id === cardId);

  // Dynamic styles based on theme
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentType, setPaymentType] = useState<"full" | "minimal">("full");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [validationError, setValidationError] = useState("");

  // Payment Date State
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDay, setTempDay] = useState(new Date().getDate());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());
  const [tempYear, setTempYear] = useState(new Date().getFullYear());

  const paymentHistory = card ? getPaymentHistory(card.id) : [];

  const recentTransactions = React.useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    return transactions
      .filter((t) => t.cardId === cardId && new Date(t.date) <= today) // Only show past/current transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions, cardId]);

  if (!card) {
    return (
      <View style={styles.container}>
        <Text>Kartu tidak ditemukan</Text>
      </View>
    );
  }

  const handleArchive = () => {
    Alert.alert(
      "Arsipkan Kartu",
      "Kartu ini akan disembunyikan dari halaman utama namun data tetap tersimpan. Lanjutkan?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Arsipkan",
          onPress: async () => {
            await archiveCard(card.id, true);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Hapus Kartu",
      "Apakah kamu yakin ingin menghapus kartu ini? Tindakan ini tidak dapat dibatalkan.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            await deleteCard(card.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleMarkAsPaid = () => {
    setPaymentType("full");
    setPaymentAmount("");
    setPaymentNotes("");
    setValidationError("");
    setPaymentDate(new Date()); // Reset to today
    setShowPaymentForm(true);
  };

  const handleConfirmPayment = async () => {
    if (!card) return;

    // Validation
    if (paymentType === "minimal") {
      if (!paymentAmount || paymentAmount.trim() === "") {
        setValidationError("Jumlah pembayaran harus diisi");
        return;
      }
      const amount = parseAmount(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        setValidationError("Jumlah pembayaran tidak valid");
        return;
      }
    }

    setValidationError("");

    // Determine amount
    let finalAmount: number;
    if (paymentType === "full") {
      finalAmount = card.statementAmount || card.currentUsage || 0;
    } else {
      finalAmount = parseAmount(paymentAmount);
    }

    try {
      await markCardAsPaid(
        card.id,
        finalAmount,
        paymentNotes || undefined,
        paymentType,
        paymentDate // Pass selected payment date
      );

      setShowPaymentForm(false);
      setPaymentType("full");
      setPaymentAmount("");
      setPaymentNotes("");
      setValidationError("");
      setPaymentDate(new Date());
      Alert.alert("Berhasil", "Pembayaran berhasil dicatat");
    } catch (error) {
      console.error("Error marking as paid:", error);
      Alert.alert("Error", "Gagal mencatat pembayaran");
    }
  };

  const { getSharedLimitInfo } = useCards();

  // Get shared limit info if this card uses shared limit
  const sharedLimitInfo =
    card.bankId && card.useSharedLimit ? getSharedLimitInfo(card.bankId) : null;

  // Use shared limit or individual limit
  const effectiveLimit = sharedLimitInfo
    ? sharedLimitInfo.sharedLimit
    : card.creditLimit || 0;
  const effectiveUsage = sharedLimitInfo
    ? sharedLimitInfo.totalUsage
    : card.currentUsage || 0;
  const remainingLimit = effectiveLimit - effectiveUsage;

  const currentUsage = card.currentUsage || 0;
  let usagePercentage =
    effectiveLimit > 0 ? (effectiveUsage / effectiveLimit) * 100 : 0;
  if (isNaN(usagePercentage)) usagePercentage = 0;

  let budgetPercentage =
    card.monthlyBudget && card.monthlyBudget > 0
      ? (currentUsage / card.monthlyBudget) * 100
      : 0;
  if (isNaN(budgetPercentage)) budgetPercentage = 0;

  const healthData = calculateHealthScore(card);
  const cycleRange = getBillingCycleRange(card.billingCycleDay);

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
        <Text style={styles.title}>Detail Kartu</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.responsiveContainer}>
          <View style={styles.cardContainer}>
            <Swipeable
              renderRightActions={() => (
                <View style={styles.swipeActions}>
                  <TouchableOpacity
                    style={[styles.swipeButton, styles.editButton]}
                    onPress={() =>
                      navigation.navigate("AddEditCard", { cardId: card.id })
                    }
                  >
                    <Ionicons
                      name="create-outline"
                      size={moderateScale(22)}
                      color={theme.colors.text.inverse}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.swipeButton, styles.archiveButton]}
                    onPress={handleArchive}
                  >
                    <Ionicons
                      name="archive-outline"
                      size={moderateScale(22)}
                      color={theme.colors.text.inverse}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.swipeButton, styles.deleteButton]}
                    onPress={handleDelete}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={moderateScale(22)}
                      color={theme.colors.text.inverse}
                    />
                  </TouchableOpacity>
                </View>
              )}
            >
              <View>
                <CreditCard
                  card={card}
                  containerStyle={{
                    width: CARD_WIDTH,
                    marginHorizontal: 0,
                    marginRight: 0, // Force remove default margin
                    alignSelf: "center",
                  }}
                />
              </View>
            </Swipeable>
            <View style={styles.swipeHintContainer}>
              <Text style={styles.swipeHintText}>
                Geser kartu untuk opsi lainnya
              </Text>
              <Ionicons
                name="arrow-forward"
                size={moderateScale(14)}
                color={theme.colors.text.tertiary}
              />
            </View>
          </View>
          {/* === RINGKASAN PENGGUNAAN === */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Ringkasan Penggunaan</Text>

            {/* Usage Info */}
            <View style={styles.row}>
              <View>
                <Text style={styles.label}>Pemakaian Saat Ini</Text>
                <Text style={styles.cycleText}>
                  {formatDateRange(cycleRange.startDate, cycleRange.endDate)}
                </Text>
                <Text style={styles.amount}>
                  {formatCurrency(card.currentUsage)}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.label}>Limit</Text>
                <Text style={styles.value}>
                  {formatCurrency(card.creditLimit)}
                </Text>
              </View>
            </View>

            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(usagePercentage, 100)}%` },
                ]}
              />
            </View>
            <View style={styles.usageInfoRow}>
              <Text style={styles.percentageText}>
                {usagePercentage.toFixed(1)}% Terpakai
                {sharedLimitInfo && " (gabungan)"}
              </Text>
              <Text style={styles.percentageText}>
                {formatCurrency(remainingLimit)} sisa limit
              </Text>
            </View>

            {/* Monthly Budget */}
            {card.monthlyBudget && card.monthlyBudget > 0 && (
              <View style={styles.budgetSection}>
                {/* Budget Info - Same structure as Usage */}
                <View style={styles.row}>
                  <View>
                    <Text style={styles.label}>Budget Terpakai</Text>
                    <Text style={styles.amount}>
                      {formatCurrency(card.currentUsage || 0)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.label}>Budget</Text>
                    <Text style={styles.value}>
                      {formatCurrency(card.monthlyBudget)}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(budgetPercentage, 100)}%`,
                        backgroundColor:
                          budgetPercentage > 90
                            ? theme.colors.status.error
                            : budgetPercentage > 75
                            ? theme.colors.status.warning
                            : theme.colors.primary,
                      },
                    ]}
                  />
                </View>

                {/* Budget Details Below Progress Bar */}
                <View style={styles.usageInfoRow}>
                  <Text style={styles.percentageText}>
                    {budgetPercentage.toFixed(1)}% Terpakai
                  </Text>
                  <Text style={styles.percentageText}>
                    {formatCurrency(
                      (card.monthlyBudget || 0) - (card.currentUsage || 0)
                    )}{" "}
                    sisa budget
                  </Text>
                </View>
              </View>
            )}

            {/* Divider */}
            <View style={styles.sectionDivider} />

            {/* Billing Info */}
            <View style={styles.billingInfoRow}>
              <View style={styles.billingInfoItem}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={theme.colors.text.tertiary}
                />
                <Text style={styles.billingInfoLabel}>Siklus Tagihan</Text>
                <Text style={styles.billingInfoValue}>
                  Tgl {card.billingCycleDay}
                </Text>
              </View>
              <View style={styles.billingInfoItem}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={theme.colors.text.tertiary}
                />
                <Text style={styles.billingInfoLabel}>Jatuh Tempo</Text>
                <Text style={styles.billingInfoValue}>Tgl {card.dueDay}</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.sectionDivider} />

            {/* Payment Status */}
            <View style={styles.paymentStatusSection}>
              <Text
                style={[
                  styles.subSectionTitle,
                  { marginBottom: theme.spacing.m },
                ]}
              >
                Status Pembayaran
              </Text>

              {!card.isPaid && !showPaymentForm && (
                <View style={styles.unpaidCard}>
                  <View style={styles.unpaidHeader}>
                    <View style={styles.unpaidIconContainer}>
                      <Ionicons
                        name="time-outline"
                        size={moderateScale(24)}
                        color={theme.colors.status.warning}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.unpaidTitle}>Belum Dibayar</Text>
                      <Text style={styles.unpaidSubtitle}>
                        Jatuh tempo tanggal {card.dueDay}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.unpaidAmountRow}>
                    <Text style={styles.unpaidAmountLabel}>Total Tagihan</Text>
                    <Text style={styles.unpaidAmount}>
                      {formatCurrency(
                        card.statementAmount || card.currentUsage || 0
                      )}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.payNowButton}
                    onPress={() => setShowPaymentForm(true)}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={moderateScale(20)}
                      color="#FFF"
                    />
                    <Text style={styles.payNowButtonText}>Tandai Lunas</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!card.isPaid && showPaymentForm && (
                <View style={styles.paymentForm}>
                  {/* Payment Type Selection */}
                  <View style={styles.paymentTypeContainer}>
                    <Text style={styles.paymentTypeLabel}>
                      Jenis Pembayaran
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.radioOption,
                        paymentType === "full" && styles.radioOptionSelected,
                      ]}
                      onPress={() => setPaymentType("full")}
                    >
                      <View style={styles.radioCircle}>
                        {paymentType === "full" && (
                          <View style={styles.radioCircleSelected} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.radioLabel}>Full Payment</Text>
                        <Text style={styles.radioSubtext}>
                          {formatCurrency(
                            card.statementAmount || card.currentUsage || 0
                          )}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.radioOption,
                        paymentType === "minimal" && styles.radioOptionSelected,
                      ]}
                      onPress={() => setPaymentType("minimal")}
                    >
                      <View style={styles.radioCircle}>
                        {paymentType === "minimal" && (
                          <View style={styles.radioCircleSelected} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.radioLabel}>Minimal Payment</Text>
                        <Text style={styles.radioSubtext}>
                          Input jumlah custom
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Amount Input (only for minimal payment) */}
                  {paymentType === "minimal" && (
                    <View>
                      <Text style={styles.inputLabel}>
                        Jumlah Pembayaran <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={[
                          styles.modalInput,
                          validationError && styles.modalInputError,
                        ]}
                        placeholder="Masukkan jumlah"
                        placeholderTextColor={theme.colors.text.tertiary}
                        keyboardType="numeric"
                        value={paymentAmount}
                        onChangeText={(text) => {
                          setPaymentAmount(formatNumberInput(text));
                          setValidationError("");
                        }}
                      />
                      {validationError && (
                        <Text style={styles.errorText}>{validationError}</Text>
                      )}
                    </View>
                  )}

                  {/* Payment Date Picker */}
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => {
                      setTempDay(paymentDate.getDate());
                      setTempMonth(paymentDate.getMonth());
                      setTempYear(paymentDate.getFullYear());
                      setShowDatePicker(true);
                    }}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={moderateScale(20)}
                      color={theme.colors.primary}
                    />
                    <View style={{ flex: 1, marginLeft: theme.spacing.s }}>
                      <Text style={styles.datePickerLabel}>
                        Tanggal Pembayaran
                      </Text>
                      <Text style={styles.datePickerValue}>
                        {paymentDate.toLocaleDateString("id-ID", {
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

                  {/* Notes Input (optional) */}
                  <View>
                    <Text style={styles.inputLabel}>Catatan (Opsional)</Text>
                    <TextInput
                      style={[styles.modalInput, styles.modalTextArea]}
                      placeholder="Tambahkan catatan..."
                      placeholderTextColor={theme.colors.text.tertiary}
                      multiline
                      numberOfLines={3}
                      value={paymentNotes}
                      onChangeText={setPaymentNotes}
                    />
                  </View>

                  {/* Buttons */}
                  <View style={styles.formButtons}>
                    <TouchableOpacity
                      style={[styles.formButton, styles.formCancelButton]}
                      onPress={() => {
                        setShowPaymentForm(false);
                        setPaymentType("full");
                        setPaymentAmount("");
                        setPaymentNotes("");
                        setValidationError("");
                      }}
                    >
                      <Text style={styles.formCancelText}>Batal</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.formButton, styles.formConfirmButton]}
                      onPress={handleConfirmPayment}
                    >
                      <Text style={styles.formConfirmText}>Simpan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {card.isPaid && (
                <View style={styles.paidCard}>
                  <View style={styles.paidIconCircle}>
                    <Ionicons
                      name="checkmark"
                      size={moderateScale(16)}
                      color="#FFF"
                    />
                  </View>
                  <View>
                    <Text style={styles.paidCardTitle}>Lunas</Text>
                    {card.lastPaymentDate && (
                      <Text style={styles.paidCardDate}>
                        Dibayar tgl{" "}
                        {new Date(card.lastPaymentDate).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Notes */}
            {card.notes ? (
              <>
                <View
                  style={[
                    styles.sectionDivider,
                    { marginVertical: theme.spacing.s },
                  ]}
                />
                <View style={styles.noteContainer}>
                  <Text style={styles.label}>Catatan</Text>
                  <Text style={styles.noteText}>{card.notes}</Text>
                </View>
              </>
            ) : null}
          </View>

          {/* === RIWAYAT PEMBAYARAN === */}
          {paymentHistory.length > 0 && (
            <View style={{ paddingHorizontal: theme.spacing.m }}>
              <PaymentHistorySection
                history={paymentHistory}
                cardId={card.id}
              />
            </View>
          )}

          {/* === LANGGANAN TERHUBUNG === */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                Langganan Terhubung
              </Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("SubscriptionList", { cardId: card.id })
                }
              >
                <Text style={styles.seeAllText}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>
            {subscriptions.filter((s) => s.cardId === card.id && s.isActive)
              .length > 0 ? (
              subscriptions
                .filter((s) => s.cardId === card.id && s.isActive)
                .map((sub) => {
                  const { iconName, iconColor } = getCategoryIcon(sub.category);
                  return (
                    <View key={sub.id} style={styles.transactionItem}>
                      <View style={styles.transactionLeft}>
                        <View
                          style={[
                            styles.iconContainer,
                            { backgroundColor: iconColor + "15" },
                          ]}
                        >
                          <Ionicons
                            name={iconName}
                            size={moderateScale(28)}
                            color={iconColor}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.transactionDesc}>{sub.name}</Text>
                          <Text style={styles.transactionDate}>
                            Tagihan tgl {sub.billingDay}
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        {sub.currency &&
                        sub.currency !== "IDR" &&
                        sub.originalAmount ? (
                          <>
                            <Text style={styles.transactionAmount}>
                              {formatForeignCurrency(
                                sub.originalAmount,
                                sub.currency
                              )}
                            </Text>
                            <Text style={styles.convertedAmount}>
                              ≈ {formatCurrency(sub.amount)}
                            </Text>
                          </>
                        ) : (
                          <Text style={styles.transactionAmount}>
                            {formatCurrency(sub.amount)}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })
            ) : (
              <Text style={styles.emptyText}>Tidak ada langganan aktif</Text>
            )}
          </View>

          <View style={styles.section}>
            <View style={[styles.sectionHeader, { alignItems: "center" }]}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                Transaksi Terakhir
              </Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("TransactionsList", { cardId: card.id })
                }
                style={{ justifyContent: "center" }}
              >
                <Text style={styles.seeAllText}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>

            {recentTransactions.length > 0 ? (
              recentTransactions.map((t) => {
                const { iconName, iconColor } = getCategoryIcon(t.category);

                return (
                  <View key={t.id} style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <View
                        style={[
                          styles.iconContainer,
                          { backgroundColor: iconColor + "20" },
                        ]}
                      >
                        <Ionicons
                          name={iconName}
                          size={moderateScale(28)}
                          color={iconColor}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={styles.transactionDesc}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {t.description}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {new Date(t.date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </Text>
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      {t.currency &&
                      t.currency !== "IDR" &&
                      t.originalAmount ? (
                        <>
                          <Text style={styles.transactionAmount}>
                            {formatForeignCurrency(
                              t.originalAmount,
                              t.currency
                            )}
                          </Text>
                          <Text style={styles.convertedAmount}>
                            ≈ {formatCurrency(t.amount)}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.transactionAmount}>
                          {formatCurrency(t.amount)}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>Belum ada transaksi</Text>
            )}
          </View>
        </View>
      </ScrollView>

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
                <Text style={styles.dateLabelText}>Hari</Text>
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
                <Text style={styles.dateLabelText}>Bulan</Text>
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
                <Text style={styles.dateLabelText}>Tahun</Text>
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
                  setPaymentDate(newDate);
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.datePickerConfirmText}>Pilih</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ExpandableFAB
        actions={[
          {
            icon: "receipt-outline",
            label: "Catat Transaksi",
            onPress: () =>
              navigation.navigate("AddTransaction", { cardId: card.id }),
            color: "#10B981",
          },
          {
            icon: "repeat-outline",
            label: "Langganan Baru",
            onPress: () =>
              navigation.navigate("AddSubscription", { cardId: card.id }),
            color: "#8B5CF6",
          },
        ]}
      />
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
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: theme.spacing.s,
    },
    backButtonText: {
      fontSize: moderateScale(24),
      color: theme.colors.text.primary,
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
    },
    placeholder: {
      width: theme.containerSizes.iconMedium,
    },
    content: {
      paddingBottom: theme.spacing.xl,
      alignItems: isTablet ? "center" : undefined,
    },
    responsiveContainer: {
      width: "100%",
      maxWidth: isTablet ? 600 : undefined,
    },
    actionButtons: {},
    actionButton: {
      backgroundColor: theme.colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      ...theme.shadows.small,
      gap: 8,
    },
    actionButtonText: {
      ...theme.typography.button,
      color: theme.colors.text.inverse,
      fontSize: moderateScale(16),
    },
    cardContainer: {
      marginBottom: theme.spacing.l,
      marginTop: theme.spacing.m,
      // paddingHorizontal: theme.spacing.m, // Removed to allow custom width
      alignItems: "center", // Centered
    },
    section: {
      // backgroundColor: theme.colors.surface, // Removed card bg
      paddingHorizontal: theme.spacing.l, // Keep padding
      paddingVertical: theme.spacing.l,
      marginBottom: theme.spacing.l, // Reduced margin
      // borderRadius: theme.borderRadius.m,
      // ...theme.shadows.small,
    },
    sectionTitle: {
      ...theme.typography.h2,
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.m,
    },
    cardSection: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.l,
      marginHorizontal: theme.spacing.m,
      marginBottom: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      ...theme.shadows.small,
    },
    subSectionTitle: {
      ...theme.typography.body,
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: theme.spacing.m,
    },
    budgetSection: {
      marginTop: theme.spacing.l,
    },
    budgetDetailsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: theme.spacing.s,
    },
    billingInfoRow: {
      flexDirection: "row",
      justifyContent: "space-around",
    },
    billingInfoItem: {
      alignItems: "center",
      flex: 1,
    },
    billingInfoLabel: {
      ...theme.typography.caption,
      color: theme.colors.text.tertiary,
      marginTop: 4,
      marginBottom: 2,
    },
    billingInfoValue: {
      ...theme.typography.body,
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
    paymentStatusSection: {
      // Container for payment status within the grouped section
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: theme.spacing.m,
    },
    label: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginBottom: 4,
    },
    amount: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
      fontWeight: "700",
    },
    cycleText: {
      ...theme.typography.caption,
      color: theme.colors.text.tertiary,
      marginBottom: 4,
    },
    value: {
      ...theme.typography.body,
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
    progressBarBg: {
      height: scale(8),
      backgroundColor: theme.colors.background,
      borderRadius: 4,
      overflow: "hidden",
      marginBottom: theme.spacing.s,
    },
    progressBarFill: {
      height: "100%",
      backgroundColor: theme.colors.primary,
      borderRadius: 4,
    },
    usageInfoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    percentageText: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: theme.spacing.s,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    detailLabel: {
      ...theme.typography.body,
      color: theme.colors.text.secondary,
    },
    detailValue: {
      ...theme.typography.body,
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
    healthScoreContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: theme.spacing.s,
    },
    healthScoreCircle: {
      width: scale(60),
      height: scale(60),
      borderRadius: scale(30),
      borderWidth: 4,
      borderColor: theme.colors.surface,
      backgroundColor: theme.colors.background,
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.m,
      ...theme.shadows.small,
    },
    healthScoreValue: {
      ...theme.typography.h2,
      fontWeight: "bold",
    },
    healthFactors: {
      flex: 1,
    },
    healthFactorText: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginBottom: 2,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.m,
    },
    seeAllText: {
      ...theme.typography.caption,
      color: theme.colors.primary,
      fontSize: moderateScale(14),
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: theme.spacing.s,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    noteContainer: {
      marginTop: theme.spacing.m,
      padding: theme.spacing.m,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.m,
    },
    noteText: {
      ...theme.typography.body,
      marginTop: theme.spacing.xs,
    },
    transactionItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    iconContainer: {
      width: 56, // Fixed to match HomeScreen
      height: 56, // Fixed to match HomeScreen
      borderRadius: 20, // Fixed to match HomeScreen
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    transactionLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    transactionIcon: {
      fontSize: moderateScale(24),
    },
    transactionDesc: {
      ...theme.typography.body,
      fontWeight: "600",
      color: theme.colors.text.primary,
      fontSize: moderateScale(16), // Increased from 15
      marginRight: 8,
    },
    transactionDate: {
      ...theme.typography.caption,
      color: theme.colors.text.tertiary,
      fontSize: moderateScale(12),
    },
    transactionAmount: {
      ...theme.typography.body,
      fontWeight: "700",
      color: theme.colors.text.primary,
      fontSize: moderateScale(14),
    },
    convertedAmount: {
      ...theme.typography.caption,
      fontSize: moderateScale(10),
      color: theme.colors.text.tertiary,
      marginTop: 2,
    },
    emptyText: {
      ...theme.typography.body,
      color: theme.colors.text.secondary,
      textAlign: "center",
      marginTop: theme.spacing.xl,
    },
    reminderItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.m,
    },
    reminderIcon: {
      width: scale(40),
      height: scale(40),
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    reminderTitle: {
      ...theme.typography.body,
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
    reminderSubtitle: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
    },
    reminderValue: {
      ...theme.typography.body,
      fontWeight: "700",
      color: theme.colors.text.primary,
    },
    historyButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.primary + "10",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 4,
    },
    historyButtonText: {
      ...theme.typography.caption,
      fontWeight: "600",
      color: theme.colors.primary,
    },
    addTransactionButton: {
      marginTop: theme.spacing.m,
      padding: theme.spacing.m,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      borderRadius: theme.borderRadius.m,
      alignItems: "center",
    },
    addTransactionText: {
      ...theme.typography.button,
      color: theme.colors.primary,
    },
    progressBarContainer: {
      height: scale(8),
      backgroundColor: theme.colors.border,
      borderRadius: 4,
      overflow: "hidden",
      marginTop: theme.spacing.s,
    },
    progressText: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginTop: 4,
      textAlign: "right",
    },
    actions: {
      flexDirection: "row",
      padding: theme.spacing.m,
      gap: theme.spacing.m,
    },
    button: {
      flex: 1,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      alignItems: "center",
      justifyContent: "center",
      ...theme.shadows.small,
    },
    buttonText: {
      ...theme.typography.caption,
      color: theme.colors.text.inverse,
      marginTop: 4,
      fontWeight: "600",
    },
    editButton: {
      backgroundColor: theme.colors.primary,
    },
    archiveButton: {
      backgroundColor: theme.colors.text.secondary,
    },
    deleteButton: {
      backgroundColor: theme.colors.status.error,
    },
    swipeActions: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 16,
    },
    swipeButton: {
      width: scale(48),
      height: scale(48),
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 12,
      borderRadius: 24,
      ...theme.shadows.medium, // Stronger shadow for floating effect
      shadowColor: theme.colors.primary, // Colored shadow hint
      shadowOpacity: 0.2,
    },
    swipeHintContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      marginTop: 8,
      gap: 4,
    },
    swipeHintText: {
      ...theme.typography.caption,
      color: theme.colors.text.tertiary,
      fontSize: moderateScale(12),
    },
    addSubscriptionButton: {
      backgroundColor: theme.colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      ...theme.shadows.small,
      marginTop: theme.spacing.m,
      gap: 8,
    },
    addSubscriptionText: {
      ...theme.typography.button,
      color: theme.colors.text.inverse,
      fontSize: moderateScale(16),
    },
    circleAddButton: {
      width: moderateScale(48),
      height: moderateScale(48),
      borderRadius: moderateScale(24),
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "flex-end",
      marginTop: theme.spacing.m,
      ...theme.shadows.medium,
    },
    // Payment Status Styles
    lastPaidText: {
      ...theme.typography.caption,
      color: theme.colors.text.tertiary,
    },
    markPaidButton: {
      backgroundColor: theme.colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      gap: 8,
      ...theme.shadows.small,
    },
    markPaidButtonText: {
      ...theme.typography.button,
      color: theme.colors.text.inverse,
      fontWeight: "600",
    },
    circleCheckButton: {
      width: moderateScale(48),
      height: moderateScale(48),
      borderRadius: moderateScale(24),
      backgroundColor: theme.colors.status.success,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "flex-end",
      ...theme.shadows.medium,
    },
    // Unpaid Card Styles
    unpaidCard: {
      backgroundColor: theme.colors.status.warning + "10",
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.m,
      borderWidth: 1,
      borderColor: theme.colors.status.warning + "30",
    },
    unpaidHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: theme.spacing.m,
    },
    unpaidIconContainer: {
      width: moderateScale(44),
      height: moderateScale(44),
      borderRadius: moderateScale(22),
      backgroundColor: theme.colors.status.warning + "20",
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.m,
    },
    unpaidTitle: {
      ...theme.typography.body,
      fontWeight: "700",
      color: theme.colors.text.primary,
    },
    unpaidSubtitle: {
      ...theme.typography.caption,
      color: theme.colors.status.warning,
      fontWeight: "500",
    },
    unpaidAmountRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.s,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.m,
      marginBottom: theme.spacing.m,
    },
    unpaidAmountLabel: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
    },
    unpaidAmount: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
      fontWeight: "700",
    },
    payNowButton: {
      backgroundColor: theme.colors.status.success,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: theme.spacing.s + 2,
      paddingHorizontal: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      gap: 8,
      ...theme.shadows.small,
    },
    payNowButtonText: {
      ...theme.typography.button,
      color: theme.colors.text.inverse,
      fontWeight: "600",
    },
    // Paid Card Styles
    paidCard: {
      backgroundColor: theme.colors.status.success + "10",
      borderRadius: theme.borderRadius.m,
      padding: theme.spacing.m,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.status.success + "30",
      gap: 12,
    },
    paidIconCircle: {
      width: moderateScale(32),
      height: moderateScale(32),
      borderRadius: moderateScale(16),
      backgroundColor: theme.colors.status.success,
      alignItems: "center",
      justifyContent: "center",
    },
    paidCardTitle: {
      ...theme.typography.body,
      color: theme.colors.status.success,
      fontWeight: "700",
    },
    // paidCardSubtitle removed to save space
    paidCardDate: {
      ...theme.typography.caption,
      color: theme.colors.text.tertiary,
    },
    paidIndicator: {
      flexDirection: "row",
      alignItems: "center",
      padding: theme.spacing.m,
      backgroundColor: theme.colors.status.success + "10",
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.status.success + "30",
      gap: 12,
    },
    paidText: {
      ...theme.typography.body,
      color: theme.colors.status.success,
      fontWeight: "600",
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: theme.spacing.l,
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.l,
      width: "100%",
      maxWidth: 400,
      ...theme.shadows.medium,
    },
    modalTitle: {
      ...theme.typography.h2,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.s,
      textAlign: "center",
    },
    modalSubtitle: {
      ...theme.typography.body,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.l,
      textAlign: "center",
    },
    modalInput: {
      ...theme.typography.body,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.m,
      padding: theme.spacing.m,
      marginBottom: theme.spacing.m,
      color: theme.colors.text.primary,
    },
    modalTextArea: {
      height: scale(80),
      textAlignVertical: "top",
    },
    modalButtons: {
      flexDirection: "row",
      gap: theme.spacing.m,
      marginTop: theme.spacing.s,
    },
    modalButton: {
      flex: 1,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      alignItems: "center",
    },
    modalCancelButton: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    modalConfirmButton: {
      backgroundColor: theme.colors.primary,
    },
    modalCancelText: {
      ...theme.typography.button,
      color: theme.colors.text.secondary,
    },
    modalConfirmText: {
      ...theme.typography.button,
      color: theme.colors.text.inverse,
      fontWeight: "600",
    },
    // Payment Type Selection Styles
    paymentTypeContainer: {
      marginBottom: theme.spacing.m,
    },
    paymentTypeLabel: {
      ...theme.typography.body,
      fontWeight: "600",
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.s,
    },
    radioOption: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.m,
      padding: theme.spacing.m,
      marginBottom: theme.spacing.s,
      gap: 12,
    },
    radioOptionSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + "08",
    },
    radioCircle: {
      width: scale(20),
      height: scale(20),
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    radioCircleSelected: {
      width: scale(10),
      height: scale(10),
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
    radioLabel: {
      ...theme.typography.body,
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
    radioSubtext: {
      ...theme.typography.caption,
      color: theme.colors.text.tertiary,
      marginTop: 2,
    },
    // Input Label Styles
    inputLabel: {
      ...theme.typography.body,
      fontWeight: "500",
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
    },
    required: {
      color: theme.colors.status.error,
    },
    modalInputError: {
      borderColor: theme.colors.status.error,
      borderWidth: 1.5,
    },
    errorText: {
      ...theme.typography.caption,
      color: theme.colors.status.error,
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.s,
    },
    // Inline Payment Form Styles
    paymentForm: {
      marginTop: theme.spacing.m,
      padding: theme.spacing.m,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    formButtons: {
      flexDirection: "row",
      gap: theme.spacing.s,
      marginTop: theme.spacing.m,
    },
    formButton: {
      flex: 1,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      alignItems: "center",
      justifyContent: "center",
    },
    formCancelButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    formConfirmButton: {
      backgroundColor: theme.colors.primary,
    },
    formCancelText: {
      ...theme.typography.button,
      color: theme.colors.text.primary,
    },
    formConfirmText: {
      ...theme.typography.button,
      color: theme.colors.text.inverse,
      fontWeight: "600",
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
    dateLabelText: {
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
