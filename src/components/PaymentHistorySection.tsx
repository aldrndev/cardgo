import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
// import { useAppTheme } from "../context/ThemeContext";
import { PaymentRecord } from "../types/card";
import { formatCurrency } from "../utils/formatters";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/types";

interface PaymentHistorySectionProps {
  history: PaymentRecord[];
  cardId: string;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const PaymentHistorySection: React.FC<PaymentHistorySectionProps> = ({
  history,
  cardId,
}) => {
  const navigation = useNavigation<NavigationProp>();
  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="calendar-outline"
          size={48}
          color={theme.colors.text.tertiary}
        />
        <Text style={styles.emptyText}>Belum ada riwayat pembayaran</Text>
        <Text style={styles.emptySubtext}>
          Pembayaran yang kamu tandai akan muncul di sini
        </Text>
      </View>
    );
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatBillingCycle = (cycle: string) => {
    const [year, month] = cycle.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Pembayaran</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("PaymentHistory", { cardId })}
        >
          <Text style={styles.seeAllText}>Lihat Semua</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {history.map((record, index) => (
          <View key={record.id} style={styles.recordItem}>
            <View style={styles.timelineContainer}>
              <View
                style={[
                  styles.timelineDot,
                  index === 0 && styles.timelineDotActive,
                ]}
              />
              {index < history.length - 1 && (
                <View style={styles.timelineLine} />
              )}
            </View>

            <View style={styles.recordContent}>
              <View style={styles.recordHeader}>
                <Text style={styles.billingCycle}>
                  {formatBillingCycle(record.billingCycle)}
                </Text>
                <Text style={styles.amount}>
                  {formatCurrency(record.amount)}
                </Text>
              </View>

              <View style={styles.recordDetails}>
                <Ionicons
                  name="calendar"
                  size={14}
                  color={theme.colors.text.tertiary}
                />
                <Text style={styles.dateText}>
                  Dibayar: {formatDate(record.paidDate)}
                </Text>
              </View>

              {record.paymentType && (
                <View
                  style={[
                    styles.paymentTypeBadge,
                    record.paymentType === "full" && styles.fullPaymentBadge,
                    { marginTop: 6, alignSelf: "flex-start" },
                  ]}
                >
                  <Text
                    style={[
                      styles.paymentTypeText,
                      record.paymentType === "full" && styles.fullPaymentText,
                    ]}
                  >
                    {record.paymentType === "full"
                      ? "Full Payment"
                      : "Minimal Payment"}
                  </Text>
                </View>
              )}

              {record.notes && (
                <View style={styles.notesContainer}>
                  <Ionicons
                    name="document-text-outline"
                    size={14}
                    color={theme.colors.text.tertiary}
                  />
                  <Text style={styles.notesText}>{record.notes}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.small,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.m,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  seeAllText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  list: {
    maxHeight: 300,
  },
  listContent: {
    paddingVertical: theme.spacing.xs,
  },
  recordItem: {
    flexDirection: "row",
    marginBottom: theme.spacing.m,
  },
  timelineContainer: {
    alignItems: "center",
    marginRight: theme.spacing.m,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.border,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  timelineDotActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary + "30",
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: theme.colors.border,
    marginTop: 4,
  },
  recordContent: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.s,
    padding: theme.spacing.m,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  billingCycle: {
    ...theme.typography.body,
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
  amount: {
    ...theme.typography.body,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  recordDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: theme.spacing.xs,
  },
  dateText: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
  },
  notesContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: theme.spacing.s,
    paddingTop: theme.spacing.s,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  notesText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.m,
    fontWeight: "500",
  },
  emptySubtext: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
  },
  paymentTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: theme.colors.status.warning + "20",
  },
  fullPaymentBadge: {
    backgroundColor: theme.colors.status.success + "20",
  },
  paymentTypeText: {
    fontSize: 10,
    fontWeight: "600",
    color: theme.colors.status.warning,
  },
  fullPaymentText: {
    color: theme.colors.status.success,
  },
});
