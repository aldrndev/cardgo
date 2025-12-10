import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { Card } from "../types/card";
import { MonthlyRecap } from "../components/MonthlyRecap";
import { useCards } from "../context/CardsContext";
import { usePremium } from "../context/PremiumContext";
import { useLimitIncrease } from "../context/LimitIncreaseContext";
import { EmptyState } from "../components/EmptyState";
import { CreditCard } from "../components/CreditCard";
import { ExpandableFAB } from "../components/FloatingActionButton";
import { FeatureLockedModal } from "../components/FeatureLockedModal";

import { storage } from "../utils/storage";
import { StackNavigationProp } from "@react-navigation/stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { CompositeNavigationProp } from "@react-navigation/native";
import { RootStackParamList, TabParamList } from "../navigation/types";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { formatCurrency, formatForeignCurrency } from "../utils/formatters";
import { getCategoryIcon } from "../utils/categoryIcons";
import { scale, moderateScale, isTablet } from "../utils/responsive";
import { HealthScoreService } from "../services/HealthScoreService";

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "HomeTab">,
  StackNavigationProp<RootStackParamList>
>;

const { width } = Dimensions.get("window");
const CARD_WIDTH = isTablet ? Math.min(width * 0.6, 450) : width * 0.92; // Wider card

const TIPS = [
  "Bayar tagihan penuh setiap bulan untuk menghindari bunga.",
  "Jaga penggunaan limit di bawah 30% untuk skor kredit yang baik.",
  "Manfaatkan promo dan poin reward kartu kreditmu.",
  "Hindari tarik tunai dengan kartu kredit karena bunganya tinggi.",
  "Cek tagihan secara rutin untuk mendeteksi transaksi mencurigakan.",
];

export const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme, isDark } = useTheme();
  const { cards, transactions, isLoading } = useCards();
  const { canAddCard } = usePremium();
  const { getRecordsByCardId } = useLimitIncrease();
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
  const [showRecap, setShowRecap] = React.useState(false);
  const [showPaywall, setShowPaywall] = React.useState(false);
  const [tip] = React.useState(TIPS[Math.floor(Math.random() * TIPS.length)]);
  const [userProfile, setUserProfile] = React.useState<{
    nickname: string;
    joinDate: string;
  } | null>(null);
  const [isTotalBillVisible, setIsTotalBillVisible] = React.useState(true);

  // Dynamic styles based on theme
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  React.useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const profile = await storage.getUserProfile();
    setUserProfile(profile);
  };

  // Capitalize name helper (Title Case)
  const capitalizeName = (name: string | undefined): string => {
    if (!name) return "Pengguna";
    return name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const unarchivedCards = React.useMemo(() => {
    return cards.filter((c) => !c.isArchived);
  }, [cards]);

  // Handler for adding card with premium check
  const handleAddCard = () => {
    if (!canAddCard(unarchivedCards.length)) {
      setShowPaywall(true);
    } else {
      navigation.navigate("AddEditCard", {});
    }
  };

  const activeCards = React.useMemo(() => {
    return unarchivedCards.filter((card) => {
      if (selectedTag && selectedTag !== "Semua") {
        return card.tags?.includes(selectedTag);
      }
      return true;
    });
  }, [unarchivedCards, selectedTag]);

  const allTags = React.useMemo(() => {
    return [
      "Semua",
      ...Array.from(new Set(unarchivedCards.flatMap((c) => c.tags || []))),
    ];
  }, [unarchivedCards]);

  const { totalBill, totalLimit, totalUsage } = React.useMemo(() => {
    const bill = activeCards.reduce(
      (sum, card) => sum + (card.currentUsage || 0),
      0
    );

    // Calculate total limit, avoiding double-counting shared limits
    const processedBankIds = new Set<string>();
    const limit = activeCards.reduce((sum, card) => {
      if (card.useSharedLimit && card.bankId) {
        // For shared limit cards, only count the limit once per bankId
        if (processedBankIds.has(card.bankId)) {
          return sum; // Skip - already counted this bank's shared limit
        }
        processedBankIds.add(card.bankId);
      }
      return sum + (card.creditLimit || 0);
    }, 0);

    return { totalBill: bill, totalLimit: limit, totalUsage: bill };
  }, [activeCards]);

  const recentTransactions = React.useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    return transactions
      .filter((tx) => new Date(tx.date) <= today) // Only show transactions that have occurred
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  const upcomingReminders = React.useMemo(() => {
    const reminders: {
      id: string;
      cardId: string;
      cardName: string;
      date: Date;
      daysLeft: number;
    }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next7Days = new Date(today); // CHANGED: was next30Days
    next7Days.setDate(today.getDate() + 7); // CHANGED: now 7 days instead of 30

    unarchivedCards.forEach((card) => {
      // Annual Fee
      if (card.isAnnualFeeReminderEnabled && card.expiryMonth) {
        const currentYear = today.getFullYear();
        let feeDate = new Date(currentYear, card.expiryMonth, 1);
        if (feeDate < today) {
          feeDate.setFullYear(currentYear + 1);
        }

        if (feeDate <= next7Days && feeDate >= today) {
          // CHANGED: was next30Days
          const diffTime = feeDate.getTime() - today.getTime();
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          reminders.push({
            id: `fee-${card.id}`,
            cardId: card.id,
            cardName: card.alias.toUpperCase(),
            date: feeDate,
            daysLeft,
          });
        }
      }
    });

    return reminders.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [unarchivedCards]);

  const limitIncreaseReminders = React.useMemo(() => {
    const reminders: {
      id: string;
      cardId: string;
      cardName: string;
      date: Date;
      daysLeft: number;
    }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next7Days = new Date(today); // CHANGED: was next30Days
    next7Days.setDate(today.getDate() + 7); // CHANGED: now 7 days instead of 30

    unarchivedCards.forEach((card) => {
      if (card.isLimitIncreaseReminderEnabled) {
        let limitDate: Date | null = null;
        const records = getRecordsByCardId(card.id);

        if (records.length > 0) {
          const sortedRecords = records.sort((a, b) => {
            const dateA = a.actionDate || a.requestDate;
            const dateB = b.actionDate || b.requestDate;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          });

          const latestRecord = sortedRecords[0];
          const baseDateStr =
            latestRecord.actionDate || latestRecord.requestDate;
          const baseDate = new Date(baseDateStr);

          baseDate.setMonth(baseDate.getMonth() + latestRecord.frequency);
          limitDate = baseDate;
        } else if (card.nextLimitIncreaseDate) {
          limitDate = new Date(card.nextLimitIncreaseDate);
        }

        if (limitDate) {
          limitDate.setHours(0, 0, 0, 0);
          if (limitDate <= next7Days && limitDate >= today) {
            // CHANGED: was next30Days
            const diffTime = limitDate.getTime() - today.getTime();
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            reminders.push({
              id: `limit-${card.id}`,
              cardId: card.id,
              cardName: card.alias.toUpperCase(),
              date: limitDate,
              daysLeft,
            });
          }
        }
      }
    });

    return reminders.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [unarchivedCards, getRecordsByCardId]);

  const paymentReminders = React.useMemo(() => {
    const reminders: {
      id: string;
      cardId: string;
      cardName: string;
      date: Date;
      daysLeft: number;
      amount: number;
    }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next7Days = new Date(today); // CHANGED: was next30Days
    next7Days.setDate(today.getDate() + 7); // CHANGED: now 7 days instead of 30

    unarchivedCards.forEach((card) => {
      if (card.isPaid || card.isArchived) return;

      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();

      // Calculate due date for this month
      let dueDate = new Date(currentYear, currentMonth, card.dueDay);

      // If due date has passed for this month, use next month
      if (dueDate < today) {
        dueDate = new Date(currentYear, currentMonth + 1, card.dueDay);
      }

      if (dueDate <= next7Days && dueDate >= today) {
        // CHANGED: was next30Days
        const diffTime = dueDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        reminders.push({
          id: `payment-${card.id}`,
          cardId: card.id,
          cardName: card.alias.toUpperCase(),
          date: dueDate,
          daysLeft,
          amount: card.currentUsage || 0,
        });
      }
    });

    return reminders.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [unarchivedCards]);

  const overLimitCards = React.useMemo(() => {
    return activeCards.filter(
      (card) =>
        card.creditLimit > 0 && card.currentUsage / card.creditLimit > 0.8
    );
  }, [activeCards]);

  const handleTagSelect = (tag: string) => {
    Haptics.selectionAsync();
    setSelectedTag(tag === "Semua" ? null : tag);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return "?";
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  // Calculate Health Score
  const healthScore = React.useMemo(() => {
    return HealthScoreService.calculateHealthScore(cards, transactions);
  }, [cards, transactions]);

  // Get color based on rating
  const getScoreColor = (rating: string) => {
    switch (rating) {
      case "excellent":
        return "#10B981"; // green
      case "good":
        return "#3B82F6"; // blue
      case "fair":
        return "#F59E0B"; // orange
      case "poor":
        return "#EF4444"; // red
      default:
        return theme.colors.text.secondary;
    }
  };

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Memuat...</Text>
      </View>
    );
  }

  if (unarchivedCards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={theme.colors.background}
        />
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.headerTitle}>
              {capitalizeName(userProfile?.nickname)}
            </Text>
            <Text style={styles.dateText}>{today}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate("SettingsTab")}
          >
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarInitials}>
                {getInitials(userProfile?.nickname)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        <EmptyState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background}
      />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greetingText}>{getGreeting()} 👋</Text>
          <Text style={styles.headerTitle}>
            {capitalizeName(userProfile?.nickname)}
          </Text>
          <Text style={styles.dateText}>{today}</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate("SettingsTab")}
        >
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarInitials}>
              {getInitials(userProfile?.nickname)}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.responsiveContainer}>
          {/* Summary Card */}
          <View style={styles.summaryContainer}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primary + "CC"]} // Use accent color
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryCard}
            >
              <View>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Text style={[styles.summaryLabel, { marginBottom: 0 }]}>
                    Total Tagihan
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsTotalBillVisible(!isTotalBillVisible)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={
                        isTotalBillVisible ? "eye-outline" : "eye-off-outline"
                      }
                      size={moderateScale(16)}
                      color="rgba(255,255,255,0.7)"
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.summaryAmount}>
                  {isTotalBillVisible
                    ? formatCurrency(totalBill, Number.MAX_SAFE_INTEGER)
                    : "Rp *******"}
                </Text>

                {/* Card Count Badge */}
                <View style={styles.cardCountBadge}>
                  <Ionicons
                    name="card-outline"
                    size={moderateScale(14)}
                    color="#FFFFFF"
                  />
                  <Text style={styles.cardCountText}>
                    Total {unarchivedCards.length} Kartu
                  </Text>
                </View>
              </View>
              <View style={styles.summaryFooter}>
                <View>
                  <Text style={styles.summarySubLabel}>Total Limit</Text>
                  <Text style={styles.summarySubValue}>
                    {formatCurrency(totalLimit)}
                  </Text>
                </View>
                <View style={styles.verticalDivider} />
                <View>
                  <Text style={styles.summarySubLabel}>Sisa Limit</Text>
                  <Text style={styles.summarySubValue}>
                    {formatCurrency(totalLimit - totalUsage)}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActionsContent}
            >
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("Search")}
              >
                <LinearGradient
                  colors={["#06B6D4", "#0891B2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionIcon}
                >
                  <Ionicons name="search" size={24} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.actionLabel}>Cari</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleAddCard}
              >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primary + "CC"]} // Accent color
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionIcon}
                >
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.actionLabel}>Tambah</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("LimitIncreaseHistory", {})}
              >
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionIcon}
                >
                  <Ionicons name="trending-up" size={24} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.actionLabel}>Naik Limit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("TransactionsList", {})}
              >
                <LinearGradient
                  colors={["#3B82F6", "#2563EB"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionIcon}
                >
                  <Ionicons name="receipt" size={24} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.actionLabel}>Transaksi</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("SubscriptionList", {})}
              >
                <LinearGradient
                  colors={["#F59E0B", "#D97706"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionIcon}
                >
                  <Ionicons name="repeat" size={24} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.actionLabel}>Langganan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("PaymentHistory", {})}
              >
                <LinearGradient
                  colors={["#B91C1C", "#EF4444"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionIcon}
                >
                  <Ionicons name="wallet" size={24} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.actionLabel}>Pembayaran</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("ArchivedCards")}
              >
                <LinearGradient
                  colors={["#64748B", "#475569"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionIcon}
                >
                  <Ionicons name="archive-outline" size={24} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.actionLabel}>Arsip</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Unified Dashboard Card */}
          <View style={styles.dashboardCard}>
            {/* Credit Health Score Section */}
            <TouchableOpacity
              style={styles.healthScoreSection}
              onPress={() => navigation.navigate("InsightsTab")}
              activeOpacity={0.7}
            >
              <View style={styles.healthScoreContent}>
                <View style={styles.healthScoreLeft}>
                  <Text style={styles.healthScoreTitle}>
                    All Credit Health Score
                  </Text>
                  <Text style={styles.healthScoreSubtitle}>
                    {!healthScore.hasData && "📊 Belum ada data"}
                    {healthScore.hasData &&
                      healthScore.rating === "excellent" &&
                      "🎉 Sangat Baik"}
                    {healthScore.hasData &&
                      healthScore.rating === "good" &&
                      "👍 Baik"}
                    {healthScore.hasData &&
                      healthScore.rating === "fair" &&
                      "⚠️ Cukup"}
                    {healthScore.hasData &&
                      healthScore.rating === "poor" &&
                      "📉 Perlu Perbaikan"}
                  </Text>
                  <TouchableOpacity
                    style={styles.healthScoreButton}
                    onPress={() => navigation.navigate("InsightsTab")}
                  >
                    <Text style={styles.healthScoreButtonText}>
                      Lihat Detail
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={14}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.healthScoreRight}>
                  <View
                    style={[
                      styles.healthScoreCircle,
                      {
                        borderColor: healthScore.hasData
                          ? getScoreColor(healthScore.rating)
                          : theme.colors.border,
                      },
                    ]}
                  >
                    {healthScore.hasData ? (
                      <>
                        <Text
                          style={[
                            styles.healthScoreNumber,
                            { color: getScoreColor(healthScore.rating) },
                          ]}
                        >
                          {healthScore.totalScore}
                        </Text>
                        <Text style={styles.healthScoreMax}>/100</Text>
                      </>
                    ) : (
                      <Text
                        style={[
                          styles.healthScoreNumber,
                          { color: theme.colors.text.tertiary, fontSize: 16 },
                        ]}
                      >
                        --
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Upcoming Reminders Section */}
            {(paymentReminders.length > 0 ||
              upcomingReminders.length > 0 ||
              limitIncreaseReminders.length > 0) && (
              <>
                <View style={styles.dashboardDivider} />
                <View style={styles.remindersSectionEmbed}>
                  <View style={styles.remindersHeaderEmbed}>
                    <Text
                      style={[
                        styles.remindersTitle,
                        isDark && { color: "#FFFFFF" },
                      ]}
                    >
                      Pengingat Mendatang
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        color: theme.colors.text.secondary,
                        marginLeft: 8,
                      }}
                    >
                      Geser kiri untuk lainnya
                    </Text>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.remindersContentEmbed}
                  >
                    {/* Payment Reminders */}
                    {paymentReminders.map((reminder) => (
                      <TouchableOpacity
                        key={reminder.id}
                        style={styles.reminderItem}
                        onPress={() =>
                          navigation.navigate("CardDetail", {
                            cardId: reminder.cardId,
                          })
                        }
                      >
                        <LinearGradient
                          colors={["#EF4444", "#DC2626"]} // Red gradient for payments
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.reminderGradient}
                        >
                          <View style={styles.reminderHeader}>
                            <View style={styles.reminderIconContainer}>
                              <Ionicons
                                name="alert-circle"
                                size={20}
                                color={
                                  isDark ? "#FFFFFF" : theme.colors.text.inverse
                                }
                              />
                            </View>
                            <View style={styles.daysLeftBadge}>
                              <Text style={styles.daysLeftText}>
                                {reminder.daysLeft} Hari
                              </Text>
                            </View>
                          </View>
                          <View>
                            <Text
                              style={[
                                styles.reminderTitle,
                                isDark && { color: "#FFFFFF" },
                              ]}
                            >
                              Jatuh Tempo
                            </Text>
                            <Text
                              style={[
                                styles.reminderSubtitle,
                                isDark && { color: "#FFFFFF" },
                              ]}
                            >
                              {reminder.cardName}
                            </Text>
                            <Text
                              style={[
                                styles.reminderDate,
                                isDark && { color: "#FFFFFF" },
                              ]}
                            >
                              {new Date(reminder.date).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "long",
                                }
                              )}
                            </Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}

                    {/* Limit Increase Reminders */}
                    {limitIncreaseReminders.map((reminder) => (
                      <TouchableOpacity
                        key={reminder.id}
                        style={styles.reminderItem}
                        onPress={() =>
                          navigation.navigate("LimitIncreaseHistory", {
                            cardId: reminder.cardId,
                          })
                        }
                      >
                        <LinearGradient
                          colors={["#10B981", "#059669"]} // Green gradient
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.reminderGradient}
                        >
                          <View style={styles.reminderHeader}>
                            <View style={styles.reminderIconContainer}>
                              <Ionicons
                                name="trending-up"
                                size={20}
                                color={
                                  isDark ? "#FFFFFF" : theme.colors.text.inverse
                                }
                              />
                            </View>
                            <View style={styles.daysLeftBadge}>
                              <Text style={styles.daysLeftText}>
                                {reminder.daysLeft} Hari
                              </Text>
                            </View>
                          </View>
                          <View>
                            <Text
                              style={[
                                styles.reminderTitle,
                                isDark && { color: "#FFFFFF" },
                              ]}
                            >
                              Naik Limit
                            </Text>
                            <Text
                              style={[
                                styles.reminderSubtitle,
                                isDark && { color: "#FFFFFF" },
                              ]}
                            >
                              {reminder.cardName}
                            </Text>
                            <Text
                              style={[
                                styles.reminderDate,
                                isDark && { color: "#FFFFFF" },
                              ]}
                            >
                              {new Date(reminder.date).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "long",
                                }
                              )}
                            </Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}

                    {/* Upcoming Reminders (Normal/Other) */}
                    {upcomingReminders.map((reminder) => (
                      <TouchableOpacity
                        key={reminder.id}
                        style={styles.reminderItem}
                        onPress={() =>
                          navigation.navigate("CardDetail", {
                            cardId: reminder.cardId,
                          })
                        }
                      >
                        <LinearGradient
                          colors={["#3B82F6", "#2563EB"]} // Blue gradient
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.reminderGradient}
                        >
                          <View style={styles.reminderHeader}>
                            <View style={styles.reminderIconContainer}>
                              <Ionicons
                                name="time"
                                size={20}
                                color={
                                  isDark ? "#FFFFFF" : theme.colors.text.inverse
                                }
                              />
                            </View>
                          </View>
                          <View>
                            <Text
                              style={[
                                styles.reminderTitle,
                                isDark && { color: "#FFFFFF" },
                              ]}
                            >
                              Tagihan
                            </Text>
                            <Text
                              style={[
                                styles.reminderSubtitle,
                                isDark && { color: "#FFFFFF" },
                              ]}
                            >
                              {reminder.cardName}
                            </Text>
                            <Text
                              style={[
                                styles.reminderDate,
                                isDark && { color: "#FFFFFF" },
                              ]}
                            >
                              {new Date(reminder.date).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "long",
                                }
                              )}
                            </Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </>
            )}
          </View>

          {/* Tags Filter - Only show if there are cards */}
          {unarchivedCards.length > 0 && (
            <View style={styles.tagsSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagsFilterContainer}
              >
                {allTags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.filterChip,
                      (selectedTag === tag ||
                        (!selectedTag && tag === "Semua")) &&
                        styles.activeFilterChip,
                    ]}
                    onPress={() => handleTagSelect(tag)}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        (selectedTag === tag ||
                          (!selectedTag && tag === "Semua")) &&
                          styles.activeFilterText,
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Cards Carousel */}
          <View style={styles.carouselSection}>
            {unarchivedCards.length === 0 ? (
              <View
                style={[
                  styles.noResultContainer,
                  { marginTop: 0, borderStyle: "solid", borderWidth: 0 },
                ]}
              >
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: theme.colors.primary + "15",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: theme.spacing.m,
                  }}
                >
                  <Ionicons
                    name="card-outline"
                    size={moderateScale(32)}
                    color={theme.colors.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.noResultText,
                    {
                      marginTop: 0,
                      color: theme.colors.text.primary,
                      fontWeight: "600",
                    },
                  ]}
                >
                  Belum ada kartu
                </Text>
                <Text
                  style={{
                    ...theme.typography.caption,
                    color: theme.colors.text.secondary,
                    textAlign: "center",
                    marginBottom: theme.spacing.l,
                    maxWidth: "80%",
                  }}
                >
                  Tambahkan kartu kredit pertamamu untuk mulai memantau
                  pengeluaran
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: theme.colors.primary,
                    paddingHorizontal: theme.spacing.l,
                    paddingVertical: theme.spacing.s,
                    borderRadius: theme.borderRadius.m,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: theme.spacing.s,
                  }}
                  onPress={handleAddCard}
                >
                  <Ionicons name="add" size={20} color="#FFF" />
                  <Text style={{ color: "#FFF", fontWeight: "600" }}>
                    Tambah Kartu
                  </Text>
                </TouchableOpacity>
              </View>
            ) : activeCards.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContent}
                decelerationRate="fast"
                snapToInterval={
                  Dimensions.get("window").width -
                  theme.spacing.xl * 2 +
                  theme.spacing.m
                }
              >
                {activeCards.map((card) => (
                  <CreditCard
                    key={card.id}
                    card={card}
                    onPress={() =>
                      navigation.navigate("CardDetail", { cardId: card.id })
                    }
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noResultContainer}>
                <Ionicons
                  name="search-outline"
                  size={moderateScale(48)}
                  color={theme.colors.text.tertiary}
                />
                <Text style={styles.noResultText}>
                  Tidak ada kartu dengan tag "{selectedTag}"
                </Text>
                <TouchableOpacity
                  style={styles.resetFilterButton}
                  onPress={() => setSelectedTag("Semua")}
                >
                  <Text style={styles.resetFilterText}>Reset Filter</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View
            style={[styles.sectionDivider, { marginBottom: theme.spacing.s }]}
          />

          {/* Limit Warnings */}
          <View style={[styles.warningSection, { marginTop: 0 }]}>
            {overLimitCards.length > 0 && (
              <LinearGradient
                colors={["#B91C1C", "#EF4444"]} // Royal red gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.overLimitCard}
              >
                <View style={styles.alertHeader}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <View
                      style={[
                        styles.warningIconContainer,
                        isDark && { backgroundColor: "#FFFFFF" },
                      ]}
                    >
                      <Ionicons name="warning" size={20} color="#B91C1C" />
                    </View>
                    <Text style={styles.overLimitTitle}>Peringatan Limit</Text>
                  </View>
                </View>

                {overLimitCards.map((card) => {
                  const percentage = Math.min(
                    (card.currentUsage / card.creditLimit) * 100,
                    100
                  );
                  const remaining = card.creditLimit - card.currentUsage;

                  return (
                    <View key={card.id} style={styles.overLimitItem}>
                      <View style={styles.overLimitRow}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Ionicons name="card" size={16} color="#FFFFFF" />
                          <Text style={styles.overLimitCardName}>
                            {card.alias.toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.overLimitPercentage}>
                          {percentage.toFixed(0)}% Terpakai
                        </Text>
                      </View>

                      <View style={styles.overLimitProgressBg}>
                        <View
                          style={[
                            styles.overLimitProgressBar,
                            { width: `${percentage}%` },
                          ]}
                        />
                      </View>

                      <View style={styles.overLimitDetails}>
                        <View>
                          <Text style={styles.overLimitLabel}>Sisa Limit</Text>
                          <Text style={styles.overLimitValue}>
                            {formatCurrency(remaining)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.overLimitButton,
                            isDark && { backgroundColor: "#FFFFFF" },
                          ]}
                          onPress={() =>
                            navigation.navigate("CardDetail", {
                              cardId: card.id,
                            })
                          }
                        >
                          <Text style={styles.overLimitButtonText}>
                            Lihat Detail
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={moderateScale(14)}
                            color="#B91C1C"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </LinearGradient>
            )}
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Aktivitas Terakhir</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("TransactionsList", {})}
              >
                <Text style={styles.seeAllText}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => {
                const card = cards.find((c) => c.id === tx.cardId);
                const { iconName, iconColor } = getCategoryIcon(tx.category);

                return (
                  <View key={tx.id} style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <View
                        style={[
                          styles.transactionIconContainer,
                          { backgroundColor: iconColor + "20" },
                        ]}
                      >
                        <Ionicons
                          name={iconName}
                          size={moderateScale(28)}
                          color={iconColor}
                        />
                      </View>
                      <View style={styles.transactionTextContainer}>
                        <Text
                          style={styles.transactionDesc}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {tx.description}
                        </Text>
                        <Text style={styles.transactionSub}>
                          {new Date(tx.date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}
                        </Text>
                        {/* Badges Row */}
                        <View style={styles.badgesRow}>
                          {tx.installmentId && (
                            <View style={styles.miniBadge}>
                              <Text style={styles.miniBadgeText}>Cicilan</Text>
                            </View>
                          )}
                          {card && (
                            <View style={styles.cardBadgeVisible}>
                              <Text style={styles.cardBadgeTextVisible}>
                                {card.alias}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      {tx.currency &&
                      tx.currency !== "IDR" &&
                      tx.originalAmount ? (
                        <>
                          <Text style={styles.transactionAmount}>
                            {formatForeignCurrency(
                              tx.originalAmount,
                              tx.currency
                            )}
                          </Text>
                          <Text style={styles.convertedAmount}>
                            ≈ {formatCurrency(tx.amount)}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.transactionAmount}>
                          {formatCurrency(tx.amount)}
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

          {/* Financial Tip */}
          <View style={styles.tipContainer}>
            <View style={styles.tipHeader}>
              <Ionicons
                name="bulb-outline"
                size={moderateScale(20)}
                color={theme.colors.primary}
              />
              <Text style={styles.tipTitle}>Tips Keuangan</Text>
            </View>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        </View>
      </ScrollView>

      <ExpandableFAB
        actions={[
          {
            icon: "card-outline",
            label: "Tambah Kartu",
            onPress: handleAddCard,
            color: "#4F46E5",
          },
          {
            icon: "receipt-outline",
            label: "Catat Transaksi",
            onPress: () => navigation.navigate("AddTransaction", {}),
            color: "#10B981",
          },
          {
            icon: "repeat-outline",
            label: "Langganan Baru",
            onPress: () => navigation.navigate("AddSubscription", {}),
            color: "#8B5CF6",
          },
        ]}
      />
      <MonthlyRecap visible={showRecap} onClose={() => setShowRecap(false)} />

      {/* Premium Paywall Modal */}
      <FeatureLockedModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={() => {
          setShowPaywall(false);
          navigation.navigate("Paywall");
        }}
        featureName="Batas Kartu Tercapai"
        featureDescription="Versi gratis dibatasi maksimal 3 kartu. Upgrade ke Premium untuk menambahkan kartu tanpa batas."
      />
    </SafeAreaView>
  );
};

// Import Theme type for the getStyles function
import type { Theme } from "../context/ThemeContext";

const getStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    responsiveContainer: {
      width: "100%",
      maxWidth: isTablet ? 600 : undefined,
      alignSelf: "center",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: theme.spacing.l,
      paddingTop: theme.spacing.xl, // More top padding
      paddingBottom: theme.spacing.m,
      backgroundColor: theme.colors.background,
    },
    headerLeft: {
      flex: 1,
    },
    greetingText: {
      color: theme.colors.text.secondary,
      fontWeight: "500",
      marginBottom: 4,
      fontSize: moderateScale(16), // Larger greeting
    },
    logo: {
      ...theme.typography.h2,
      color: theme.colors.text.primary,
      fontWeight: "800",
    },

    headerTitle: {
      fontSize: moderateScale(26), // Larger Name
      fontWeight: "700",
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    dateText: {
      fontSize: moderateScale(12),
      color: theme.colors.text.tertiary,
      fontWeight: "500",
    },
    profileButton: {
      padding: 4,
    },
    avatarContainer: {
      width: scale(56),
      height: scale(56),
      borderRadius: scale(28),
      backgroundColor: theme.colors.primary, // Solid purple
      alignItems: "center",
      justifyContent: "center",
      ...theme.shadows.small,
    },
    avatarInitials: {
      ...theme.typography.h3,
      color: "#FFFFFF",
      fontWeight: "700",
    },
    content: {
      paddingBottom: 100,
    },
    summaryContainer: {
      paddingHorizontal: theme.spacing.m,
      marginBottom: theme.spacing.l,
    },
    summaryCard: {
      padding: theme.spacing.l,
      borderRadius: theme.borderRadius.xl,
      ...theme.shadows.medium,
    },
    summaryLabel: {
      ...theme.typography.body,
      color: "rgba(255, 255, 255, 0.9)",
      marginBottom: 4,
      fontSize: moderateScale(14),
      fontWeight: "500",
    },
    summaryAmount: {
      ...theme.typography.h1,
      color: "#FFFFFF",
      fontSize: moderateScale(34),
      fontWeight: "700",
      marginBottom: theme.spacing.s, // Reduce spacing to make room for badge
      includeFontPadding: false,
    },
    cardCountBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      gap: 6,
      alignSelf: "flex-start", // Don't stretch
      marginBottom: theme.spacing.l, // Spacing from footer
    },
    cardCountText: {
      ...theme.typography.caption,
      color: "#FFFFFF",
      fontWeight: "600",
      fontSize: moderateScale(12),
    },
    summaryFooter: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: theme.borderRadius.m,
      padding: theme.spacing.m,
    },
    verticalDivider: {
      width: 1,
      height: "100%",
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      marginHorizontal: theme.spacing.l,
    },
    summarySubLabel: {
      ...theme.typography.caption,
      color: "rgba(255, 255, 255, 0.8)",
      fontSize: moderateScale(12),
      marginBottom: 2,
    },
    summarySubValue: {
      ...theme.typography.body,
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: moderateScale(16),
    },
    quickActionsSection: {
      marginBottom: theme.spacing.l,
    },
    quickActionsContent: {
      paddingHorizontal: theme.spacing.l,
      gap: theme.spacing.l,
      paddingBottom: theme.spacing.s,
    },

    actionButton: {
      alignItems: "center",
      gap: 8,
    },
    actionIcon: {
      width: scale(56),
      height: scale(56),
      borderRadius: 999, // Circle
      justifyContent: "center",
      alignItems: "center",
      ...theme.shadows.small,
    },
    actionLabel: {
      ...theme.typography.caption,
      color: theme.colors.text.primary,
      fontWeight: "600",
    },
    tagsSection: {
      marginTop: theme.spacing.s,
      marginBottom: theme.spacing.m,
    },
    tagsFilterContainer: {
      paddingHorizontal: theme.spacing.l,
      gap: theme.spacing.s,
      // Removed paddingBottom to make it tighter
    },
    filterChip: {
      paddingHorizontal: theme.spacing.l,
      paddingVertical: 10,
      borderRadius: 100,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    activeFilterChip: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      ...theme.shadows.small,
    },
    filterText: {
      ...theme.typography.body,
      fontSize: 14,
      color: theme.colors.text.secondary,
      fontWeight: "600",
    },
    activeFilterText: {
      color: "#FFFFFF",
    },
    carouselSection: {
      marginBottom: theme.spacing.m,
    },
    carouselContent: {
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.m,
    },
    alertsSection: {
      gap: theme.spacing.m,
      marginBottom: theme.spacing.xl,
    },
    alertBlock: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.m,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.status.warning,
      marginHorizontal: theme.spacing.m,
      ...theme.shadows.small,
    },
    alertBlockError: {
      borderLeftColor: theme.colors.status.error,
    },
    alertHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: theme.spacing.s,
      gap: theme.spacing.s,
    },
    alertTitle: {
      ...theme.typography.body,
      fontWeight: "700",
      color: theme.colors.status.warning,
    },
    alertTitleError: {
      color: theme.colors.status.error,
    },
    alertItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 4,
    },
    alertCardName: {
      ...theme.typography.body,
      color: theme.colors.text.primary,
    },
    alertDate: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      fontWeight: "500",
    },
    alertDateError: {
      color: theme.colors.status.error,
    },
    section: {
      paddingHorizontal: theme.spacing.l,
      paddingVertical: theme.spacing.l,
      marginBottom: theme.spacing.xl,
      // Removed card styling for full width clean look
      // backgroundColor: theme.colors.surface,
      // marginHorizontal: theme.spacing.m,
      // borderRadius: theme.borderRadius.xl,
      // ...theme.shadows.small,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.m,
    },
    sectionTitle: {
      ...theme.typography.h2, // Larger title
      fontSize: 20,
      color: theme.colors.text.primary,
      fontWeight: "700",
    },
    seeAllText: {
      ...theme.typography.button,
      color: theme.colors.primary,
      fontSize: 14,
    },
    transactionItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16, // Increased padding
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    transactionLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    transactionIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    transactionIcon: {
      fontSize: 24,
    },
    transactionTextContainer: {
      flex: 1,
      marginRight: theme.spacing.s,
    },
    transactionDesc: {
      ...theme.typography.body,
      fontWeight: "600",
      color: theme.colors.text.primary,
      fontSize: 16, // Increased from 15
    },
    transactionSub: {
      ...theme.typography.caption,
      color: theme.colors.text.tertiary,
      fontSize: 12,
    },
    transactionAmount: {
      ...theme.typography.body,
      fontWeight: "700",
      color: theme.colors.text.primary,
      fontSize: 14,
    },
    convertedAmount: {
      ...theme.typography.caption,
      fontSize: 10,
      color: theme.colors.text.tertiary,
      marginTop: 2,
    },
    emptyText: {
      ...theme.typography.body,
      color: theme.colors.text.secondary,
      textAlign: "center",
      marginVertical: theme.spacing.m,
    },
    remindersHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.m,
      paddingHorizontal: theme.spacing.m,
    },
    remindersTitle: {
      ...theme.typography.h3,
      fontSize: moderateScale(16),
      color: theme.colors.text.primary,
      fontWeight: "700",
    },
    remindersCard: {
      backgroundColor: theme.colors.surface,
      paddingVertical: theme.spacing.m,
      borderRadius: theme.borderRadius.l,
      marginHorizontal: theme.spacing.m,
      ...theme.shadows.small,
    },
    tooltipContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    tooltipText: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      fontSize: 10,
    },
    reminderItem: {
      width: 180, // Increased from 150
      borderRadius: theme.borderRadius.l,
      ...theme.shadows.small,
      marginRight: theme.spacing.s,
      overflow: "hidden",
    },
    reminderGradient: {
      padding: theme.spacing.m,
      height: 130, // Reduced from 160
      justifyContent: "space-between",
    },
    reminderHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: theme.spacing.s,
    },
    reminderIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
    },
    daysLeftBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
    },
    daysLeftText: {
      ...theme.typography.caption,
      fontWeight: "700",
      fontSize: 10,
      color: "#1E293B", // Dark text for white badge background
    },
    reminderBody: {
      gap: 2,
    },
    reminderCardTitle: {
      ...theme.typography.body,
      fontWeight: "700",
      color: theme.colors.text.primary,
    },
    reminderCardSubtitle: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginBottom: 4,
    },
    reminderCardDate: {
      ...theme.typography.caption,
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
    tipContainer: {
      marginHorizontal: theme.spacing.l,
      marginBottom: theme.spacing.xl,
      padding: theme.spacing.m,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.l,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    tipHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.s,
      marginBottom: theme.spacing.s,
    },
    tipTitle: {
      ...theme.typography.body,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    tipText: {
      ...theme.typography.body,
      color: theme.colors.text.secondary,
      lineHeight: 20,
    },
    overLimitCard: {
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.m,
      ...theme.shadows.medium,
      marginTop: theme.spacing.m,
      marginHorizontal: theme.spacing.m,
    },
    warningIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    overLimitTitle: {
      ...theme.typography.h3,
      color: "#FFFFFF",
      fontSize: 16,
    },
    overLimitItem: {
      marginTop: theme.spacing.m,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      padding: 12,
      borderRadius: 12,
    },
    overLimitRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
      alignItems: "center",
    },
    overLimitCardName: {
      ...theme.typography.body,
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 15,
    },
    overLimitPercentage: {
      ...theme.typography.caption,
      color: "#FFFFFF",
      fontWeight: "600",
      opacity: 0.9,
    },
    overLimitProgressBg: {
      height: 6,
      backgroundColor: "rgba(0, 0, 0, 0.2)",
      borderRadius: 3,
      marginBottom: 12,
    },
    overLimitProgressBar: {
      height: "100%",
      backgroundColor: theme.colors.surface,
      borderRadius: 3,
    },
    overLimitDetails: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    overLimitLabel: {
      ...theme.typography.caption,
      color: "rgba(255, 255, 255, 0.8)",
      fontSize: 10,
      marginBottom: 2,
    },
    overLimitValue: {
      ...theme.typography.body,
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 14,
    },
    overLimitButton: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    overLimitButtonText: {
      ...theme.typography.caption,
      color: "#EF4444",
      fontWeight: "700",
    },
    warningSection: {
      marginBottom: theme.spacing.xl,
    },

    reminderTitle: {
      ...theme.typography.body,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    reminderSubtitle: {
      ...theme.typography.caption,
      color: "rgba(255, 255, 255, 0.8)",
      marginBottom: 4,
    },
    reminderDate: {
      ...theme.typography.caption,
      color: "rgba(255,255,255,0.8)",
      marginTop: scale(4),
    },
    reminderAmount: {
      ...theme.typography.body,
      color: "#FFFFFF",
      fontWeight: "700",
      marginTop: scale(6),
      fontSize: scale(13),
    },

    greeting: {
      ...theme.typography.h1,
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
      ...theme.shadows.small,
    },
    noResultContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.xl,
      backgroundColor: theme.colors.surface,
      marginHorizontal: theme.spacing.l,
      borderRadius: theme.borderRadius.l,
      borderStyle: "dashed",
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    noResultText: {
      ...theme.typography.body,
      color: theme.colors.text.secondary,
      textAlign: "center",
      marginTop: theme.spacing.m,
      marginBottom: theme.spacing.m,
    },
    resetFilterButton: {
      paddingHorizontal: theme.spacing.m,
      paddingVertical: 8,
      backgroundColor: theme.colors.primary + "10",
      borderRadius: theme.borderRadius.m,
    },
    resetFilterText: {
      ...theme.typography.button,
      color: theme.colors.primary,
      fontSize: 14,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginHorizontal: theme.spacing.m,
      // Removed marginBottom: theme.spacing.xl, as it's now handled by dashboardCard
    },
    // Unified Dashboard Card
    dashboardCard: {
      marginHorizontal: theme.spacing.m,
      marginBottom: theme.spacing.xl,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.l,
      // No shadow as requested
    },
    dashboardDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginHorizontal: theme.spacing.m,
    },

    // Credit Health Score Section (Removed Shadows)
    healthScoreSection: {
      padding: theme.spacing.m,
    },
    healthScoreContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    healthScoreLeft: {
      flex: 1,
    },
    healthScoreRight: {
      marginLeft: theme.spacing.m,
    },
    healthScoreTitle: {
      ...theme.typography.h3,
      fontSize: moderateScale(16),
      fontWeight: "700",
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    healthScoreSubtitle: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.m,
      fontSize: moderateScale(13),
    },
    healthScoreButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    cardHealthScoreTitle: {
      fontSize: moderateScale(16),
      fontWeight: "700",
      color: theme.colors.text.primary,
    },
    healthScoreButtonText: {
      fontSize: moderateScale(12),
      fontWeight: "600",
      color: theme.colors.primary,
    },
    healthScoreCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 6,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.background, // Keep background for contrast
    },
    healthScoreNumber: {
      fontSize: moderateScale(22),
      fontWeight: "700",
    },
    healthScoreMax: {
      fontSize: moderateScale(10),
      color: theme.colors.text.tertiary,
    },

    // Embedded Reminders Section
    remindersSectionEmbed: {
      paddingBottom: theme.spacing.m,
      paddingTop: theme.spacing.s,
    },
    remindersHeaderEmbed: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: theme.spacing.m,
      marginBottom: theme.spacing.s,
    },
    remindersContentEmbed: {
      paddingHorizontal: theme.spacing.m,
      gap: theme.spacing.m,
    },
    // Badge Styles
    badgesRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 4,
      flexWrap: "wrap",
    },
    miniBadge: {
      backgroundColor: isDark
        ? theme.colors.primary + "30"
        : theme.colors.primary + "15",
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 3,
    },
    miniBadgeText: {
      ...theme.typography.caption,
      color: theme.colors.primary,
      fontSize: moderateScale(9),
      fontWeight: "600",
    },
    cardBadgeVisible: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 3,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cardBadgeTextVisible: {
      fontSize: moderateScale(9),
      fontWeight: "600",
      color: theme.colors.text.secondary,
    },
  });
