import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../constants/theme";
import { useCards } from "../context/CardsContext";
import { Ionicons } from "@expo/vector-icons";
import { formatCurrency, formatForeignCurrency } from "../utils/formatters";
import { getCategoryIcon } from "../utils/categoryIcons";
import { Subscription } from "../types/subscription";
import { LinearGradient } from "expo-linear-gradient";

export const SubscriptionListScreen = () => {
  const navigation = useNavigation();
  const { subscriptions, cards, deleteSubscription } = useCards();

  const activeSubscriptions = subscriptions.filter((s) => s.isActive);
  const totalMonthly = activeSubscriptions.reduce(
    (sum, sub) => sum + sub.amount,
    0
  );

  const handleDelete = (id: string) => {
    Alert.alert(
      "Hapus Langganan",
      "Apakah Anda yakin ingin berhenti berlangganan? Transaksi yang sudah lewat tidak akan dihapus.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => deleteSubscription(id),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Subscription }) => {
    const card = cards.find((c) => c.id === item.cardId);
    const { iconName, iconColor } = getCategoryIcon(item.category);
    const nextDate = new Date(item.nextBillingDate).toLocaleDateString(
      "id-ID",
      {
        day: "numeric",
        month: "short",
      }
    );

    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemTopRow}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: iconColor + "15" },
            ]}
          >
            <Ionicons name={iconName} size={24} color={iconColor} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.cardBadge}>
              <View
                style={[
                  styles.cardIconContainer,
                  { backgroundColor: card?.colorTheme || theme.colors.primary },
                ]}
              >
                <Ionicons name="card" size={12} color="#FFF" />
              </View>
              <Text style={styles.cardBadgeText}>
                {card?.alias || "Kartu Dihapus"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={theme.colors.status.error}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.itemBottomRow}>
          <View style={styles.dateContainer}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={theme.colors.text.tertiary}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.itemDate}>Tagihan: {nextDate}</Text>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            {item.currency && item.currency !== "IDR" && item.originalAmount ? (
              <>
                <Text style={styles.itemAmount}>
                  {formatForeignCurrency(item.originalAmount, item.currency)}
                </Text>
                <Text style={styles.convertedAmount}>
                  ≈ {formatCurrency(item.amount)}
                </Text>
              </>
            ) : (
              <Text style={styles.itemAmount}>
                {formatCurrency(item.amount)}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
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
        <Text
          style={[styles.headerTitle, { color: theme.colors.text.primary }]}
        >
          Langganan Saya
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.summaryContainer}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryGradient}
        >
          <Text
            style={[styles.summaryLabel, { color: "rgba(255,255,255,0.8)" }]}
          >
            Total Tagihan Bulanan
          </Text>
          <Text style={[styles.summaryAmount, { color: "#FFF" }]}>
            {formatCurrency(totalMonthly)}
          </Text>
          <View
            style={[
              styles.countBadge,
              { backgroundColor: "rgba(255,255,255,0.2)" },
            ]}
          >
            <Text style={[styles.countText, { color: "#FFF" }]}>
              {activeSubscriptions.length} Langganan Aktif
            </Text>
          </View>
        </LinearGradient>
      </View>

      {activeSubscriptions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="repeat-outline"
            size={64}
            color={theme.colors.text.tertiary}
          />
          <Text style={styles.emptyTitle}>Belum Ada Langganan</Text>
          <Text style={styles.emptyText}>
            Tambahkan langganan rutin seperti Netflix atau Spotify agar tercatat
            otomatis setiap bulan.
          </Text>
        </View>
      ) : (
        <FlatList
          data={activeSubscriptions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddSubscription", {})}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
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
    // borderBottomWidth: 1, // Removed border
    // borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.s,
    borderRadius: 20,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: "#FFFFFF",
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  summaryContainer: {
    marginHorizontal: theme.spacing.m,
    marginTop: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    ...theme.shadows.medium,
    overflow: "hidden",
  },
  summaryGradient: {
    padding: theme.spacing.m,
    alignItems: "center",
  },
  summaryLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  summaryAmount: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    marginBottom: 8,
  },
  countBadge: {
    backgroundColor: theme.colors.primary + "15",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  listContent: {
    padding: theme.spacing.m,
    paddingBottom: 100,
  },
  itemContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    marginBottom: theme.spacing.m,
    ...theme.shadows.small,
  },
  itemTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.s,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.m,
  },
  textContainer: {
    flex: 1,
  },
  itemName: {
    ...theme.typography.body,
    fontWeight: "600",
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  cardBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  cardIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  cardBadgeText: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    fontWeight: "500",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemAmount: {
    ...theme.typography.body,
    fontWeight: "700",
    color: theme.colors.text.primary,
    fontSize: 15, // Reduced slightly
  },
  itemDate: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
  },
  convertedAmount: {
    ...theme.typography.caption,
    fontSize: 10,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: theme.colors.status.error + "15",
    borderRadius: 20,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.l,
    marginBottom: theme.spacing.s,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.medium,
  },
});
