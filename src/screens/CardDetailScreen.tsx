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
import { theme } from "../constants/theme";
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
import { scale, moderateScale } from "../utils/responsive";
import { PaymentHistorySection } from "../components/PaymentHistorySection";
import React, { useState } from "react";

type CardDetailScreenRouteProp = RouteProp<RootStackParamList, "CardDetail">;
type CardDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CardDetail"
>;

export const CardDetailScreen = () => {
  const navigation = useNavigation<CardDetailScreenNavigationProp>();
  const route = useRoute<CardDetailScreenRouteProp>();
  const { cardId } = route.params;
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

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentType, setPaymentType] = useState<"full" | "minimal">("full");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [validationError, setValidationError] = useState("");

  const paymentHistory = card ? getPaymentHistory(card.id) : [];

  const recentTransactions = transactions
    .filter((t) => t.cardId === cardId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

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
        paymentType
      );

      setShowPaymentForm(false);
      setPaymentType("full");
      setPaymentAmount("");
      setPaymentNotes("");
      setValidationError("");
      Alert.alert("Berhasil", "Pembayaran berhasil dicatat");
    } catch (error) {
      console.error("Error marking as paid:", error);
      Alert.alert("Error", "Gagal mencatat pembayaran");
    }
  };

  const currentUsage = card.currentUsage || 0;
  let usagePercentage =
    card.creditLimit > 0 ? (currentUsage / card.creditLimit) * 100 : 0;
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

      <ScrollView contentContainerStyle={styles.content}>
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
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.swipeButton, styles.archiveButton]}
                  onPress={handleArchive}
                >
                  <Ionicons
                    name="archive-outline"
                    size={moderateScale(22)}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.swipeButton, styles.deleteButton]}
                  onPress={handleDelete}
                >
                  <Ionicons
                    name="trash-outline"
                    size={moderateScale(22)}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            )}
          >
            <View>
              <CreditCard
                card={card}
                containerStyle={{ width: "100%", marginHorizontal: 0 }}
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
        <View style={styles.section}>
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
          <Text style={styles.percentageText}>
            {usagePercentage.toFixed(1)}% Terpakai
          </Text>

          {/* Monthly Budget */}
          {card.monthlyBudget && card.monthlyBudget > 0 && (
            <View style={styles.budgetSection}>
              <View style={styles.row}>
                <View>
                  <Text style={styles.label}>Budget Bulanan</Text>
                  <Text style={styles.amount}>
                    {formatCurrency(card.monthlyBudget)}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.label}>Sisa Budget</Text>
                  <Text
                    style={[
                      styles.value,
                      {
                        color:
                          card.monthlyBudget - card.currentUsage < 0
                            ? theme.colors.status.error
                            : theme.colors.text.primary,
                      },
                    ]}
                  >
                    {formatCurrency(
                      (card.monthlyBudget || 0) - (card.currentUsage || 0)
                    )}
                  </Text>
                </View>
              </View>

              <View style={styles.progressBarContainer}>
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
              <Text style={styles.progressText}>
                {budgetPercentage.toFixed(1)}% Terpakai
              </Text>
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
            <View style={styles.sectionHeader}>
              <Text style={styles.subSectionTitle}>Status Pembayaran</Text>
              {card.lastPaymentDate && (
                <Text style={styles.lastPaidText}>
                  Terakhir:{" "}
                  {new Date(card.lastPaymentDate).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
              )}
            </View>

            {!card.isPaid && !showPaymentForm && (
              <TouchableOpacity
                style={styles.markPaidButton}
                onPress={() => setShowPaymentForm(true)}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={moderateScale(20)}
                  color="#FFF"
                />
                <Text style={styles.markPaidButtonText}>
                  Tandai Sudah Dibayar
                </Text>
              </TouchableOpacity>
            )}

            {!card.isPaid && showPaymentForm && (
              <View style={styles.paymentForm}>
                {/* Payment Type Selection */}
                <View style={styles.paymentTypeContainer}>
                  <Text style={styles.paymentTypeLabel}>Jenis Pembayaran</Text>

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
              <View style={styles.paidIndicator}>
                <Ionicons
                  name="checkmark-circle"
                  size={moderateScale(24)}
                  color={theme.colors.status.success}
                />
                <Text style={styles.paidText}>Tagihan Sudah Dibayar</Text>
              </View>
            )}
          </View>

          {/* Notes */}
          {card.notes ? (
            <>
              <View style={styles.sectionDivider} />
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
            <PaymentHistorySection history={paymentHistory} cardId={card.id} />
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
          <TouchableOpacity
            style={styles.addSubscriptionButton}
            onPress={() =>
              navigation.navigate("AddSubscription", { cardId: card.id })
            }
          >
            <Ionicons name="add-circle" size={moderateScale(24)} color="#FFF" />
            <Text style={styles.addSubscriptionText}>Tambah Langganan</Text>
          </TouchableOpacity>
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
                    {t.currency && t.currency !== "IDR" && t.originalAmount ? (
                      <>
                        <Text style={styles.transactionAmount}>
                          {formatForeignCurrency(t.originalAmount, t.currency)}
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
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { marginTop: theme.spacing.m }]}
              onPress={() =>
                navigation.navigate("AddTransaction", { cardId: card.id })
              }
            >
              <Ionicons
                name="add-circle"
                size={moderateScale(24)}
                color="#FFF"
              />
              <Text style={styles.actionButtonText}>Tambah Transaksi</Text>
            </TouchableOpacity>
          </View>
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
    marginTop: theme.spacing.m, // Added spacing
    // alignItems: "center", // Removed to allow full width
    paddingHorizontal: theme.spacing.m, // Ensure some padding from screen edges
  },
  section: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.l,
    marginHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    ...theme.shadows.small,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.m,
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
  percentageText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: "right",
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  iconContainer: {
    width: theme.containerSizes.iconLarge,
    height: theme.containerSizes.iconLarge,
    borderRadius: scale(20),
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
    color: "#FFFFFF",
    fontWeight: "600",
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
    color: "#FFFFFF",
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
});
