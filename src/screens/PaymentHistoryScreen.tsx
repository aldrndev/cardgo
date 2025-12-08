import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useTheme, Theme } from "../context/ThemeContext";
import { useCards } from "../context/CardsContext";
import { RootStackParamList } from "../navigation/types";
import { Ionicons } from "@expo/vector-icons";
import { PaymentRecord } from "../types/card";
import { formatCurrency } from "../utils/formatters";
import { scale, moderateScale } from "../utils/responsive";

type PaymentHistoryScreenRouteProp = RouteProp<
  RootStackParamList,
  "PaymentHistory"
>;
type PaymentHistoryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "PaymentHistory"
>;

interface PaymentWithCard extends PaymentRecord {
  cardName: string;
  cardId: string;
}

export const PaymentHistoryScreen = () => {
  const navigation = useNavigation<PaymentHistoryScreenNavigationProp>();
  const route = useRoute<PaymentHistoryScreenRouteProp>();
  const cardIdParam = route.params?.cardId;
  const { cards, getPaymentHistory } = useCards();
  const { theme, isDark } = useTheme();

  // Dynamic styles based on theme
  const styles = useMemo(() => getStyles(theme), [theme]);

  const allPayments = useMemo(() => {
    const payments: PaymentWithCard[] = [];

    cards.forEach((card) => {
      const history = getPaymentHistory(card.id);
      history.forEach((payment) => {
        payments.push({
          ...payment,
          cardName: card.alias,
          cardId: card.id,
        });
      });
    });

    // Sort by date descending (newest first)
    return payments.sort(
      (a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime()
    );
  }, [cards, getPaymentHistory]);

  const displayedPayments = useMemo(() => {
    if (cardIdParam) {
      // Filter by specific card
      return allPayments.filter((p) => p.cardId === cardIdParam);
    }
    return allPayments;
  }, [allPayments, cardIdParam]);

  const cardName = cardIdParam
    ? cards.find((c) => c.id === cardIdParam)?.alias
    : null;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
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

  const renderPaymentItem = ({ item }: { item: PaymentWithCard }) => (
    <TouchableOpacity
      style={styles.paymentItem}
      onPress={() => navigation.navigate("CardDetail", { cardId: item.cardId })}
    >
      <View style={styles.itemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="checkmark-circle"
            size={moderateScale(28)}
            color={theme.colors.status.success}
          />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>
            {formatBillingCycle(item.billingCycle)}
          </Text>
          {!cardIdParam && (
            <Text style={styles.itemSubtitle}>
              {item.cardName.toUpperCase()}
            </Text>
          )}
          <Text style={styles.itemDate}>
            Dibayar: {formatDate(item.paidDate)}
          </Text>
          {item.paymentType && (
            <View
              style={[
                styles.paymentTypeBadge,
                item.paymentType === "full" && styles.fullPaymentBadge,
                { marginTop: 6 },
              ]}
            >
              <Text
                style={[
                  styles.paymentTypeText,
                  item.paymentType === "full" && styles.fullPaymentText,
                ]}
              >
                {item.paymentType === "full"
                  ? "Full Payment"
                  : "Minimal Payment"}
              </Text>
            </View>
          )}
          {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
        </View>
      </View>
      <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
    </TouchableOpacity>
  );

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
        <Text style={styles.title}>
          {cardName
            ? `Riwayat ${cardName.toUpperCase()}`
            : "Semua Riwayat Pembayaran"}
        </Text>
        <View style={{ width: theme.containerSizes.iconMedium }} />
      </View>

      <FlatList
        data={displayedPayments}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="receipt-outline"
              size={64}
              color={theme.colors.text.tertiary}
            />
            <Text style={styles.emptyText}>Belum ada riwayat pembayaran</Text>
            <Text style={styles.emptySubtext}>
              Pembayaran yang ditandai akan muncul di sini
            </Text>
          </View>
        }
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
    title: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
    },
    listContent: {
      padding: theme.spacing.m,
    },
    paymentItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      marginBottom: theme.spacing.s,
      ...theme.shadows.small,
    },
    itemLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    iconContainer: {
      width: scale(40),
      height: scale(40),
      borderRadius: scale(20),
      backgroundColor: theme.colors.status.success + "15",
      justifyContent: "center",
      alignItems: "center",
      marginRight: theme.spacing.m,
    },
    itemContent: {
      flex: 1,
    },
    itemTitle: {
      ...theme.typography.body,
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
    itemSubtitle: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginTop: 2,
    },
    itemDate: {
      ...theme.typography.caption,
      color: theme.colors.text.tertiary,
      marginTop: 4,
    },
    itemNotes: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginTop: 4,
      fontStyle: "italic",
    },
    itemAmount: {
      ...theme.typography.body,
      fontWeight: "700",
      color: theme.colors.primary,
      marginLeft: theme.spacing.s,
    },
    emptyContainer: {
      alignItems: "center",
      paddingVertical: theme.spacing.xl * 2,
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
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 4,
      backgroundColor: theme.colors.status.warning + "20",
    },
    fullPaymentBadge: {
      backgroundColor: theme.colors.status.success + "20",
    },
    paymentTypeText: {
      fontSize: moderateScale(10),
      fontWeight: "600",
      color: theme.colors.status.warning,
    },
    fullPaymentText: {
      color: theme.colors.status.success,
    },
  });
