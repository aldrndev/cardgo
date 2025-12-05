import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { moderateScale } from "../utils/responsive";
import { useCards } from "../context/CardsContext";
import { formatCurrency } from "../utils/formatters";
import { BANKS, getBankById } from "../constants/banks";

export const LinkedLimitsScreen = () => {
  const navigation = useNavigation();
  const { cards, getSharedLimitInfo } = useCards();

  // Get all unique bankIds that have shared limits
  const sharedLimitBanks = useMemo(() => {
    const bankIds = new Set<string>();
    cards.forEach((card) => {
      if (card.bankId && card.useSharedLimit && !card.isArchived) {
        bankIds.add(card.bankId);
      }
    });
    return Array.from(bankIds)
      .map((bankId) => {
        const bank = getBankById(bankId);
        const info = getSharedLimitInfo(bankId);
        return { bankId, bank, info };
      })
      .filter((item) => item.info !== null);
  }, [cards, getSharedLimitInfo]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={moderateScale(24)}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Limit Gabungan</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle"
            size={moderateScale(24)}
            color={theme.colors.primary}
          />
          <Text style={styles.infoText}>
            Limit gabungan mengelompokkan kartu dari bank yang sama yang berbagi
            limit (contoh: kartu utama + kartu tambahan)
          </Text>
        </View>

        {/* Shared Limit Groups by Bank */}
        {sharedLimitBanks.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Grup Limit per Bank</Text>
            {sharedLimitBanks.map(({ bankId, bank, info }) => {
              if (!info) return null;
              const usagePercent = (info.totalUsage / info.sharedLimit) * 100;

              return (
                <View key={bankId} style={styles.groupCard}>
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupName}>{bank?.code || bankId}</Text>
                    <Text style={styles.groupLimit}>
                      {formatCurrency(info.sharedLimit)}
                    </Text>
                  </View>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${Math.min(usagePercent, 100)}%` },
                          usagePercent > 80 && styles.progressDanger,
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {formatCurrency(info.totalUsage)} (
                      {usagePercent.toFixed(0)}%)
                    </Text>
                  </View>

                  <Text style={styles.cardsLabel}>
                    {info.cards.length} kartu dalam grup:
                  </Text>
                  {info.cards.map((card) => (
                    <View key={card.id} style={styles.cardItem}>
                      <Text style={styles.cardName}>{card.alias}</Text>
                      <Text style={styles.cardUsage}>
                        {formatCurrency(card.currentUsage || 0)}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="link-outline"
              size={moderateScale(64)}
              color={theme.colors.text.tertiary}
            />
            <Text style={styles.emptyTitle}>Belum Ada Limit Gabungan</Text>
            <Text style={styles.emptyText}>
              Aktifkan "Limit Gabungan" saat menambah kartu untuk mengelompokkan
              kartu dengan bank yang sama
            </Text>
          </View>
        )}
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
    paddingVertical: theme.spacing.m,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.s,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
  },
  placeholder: {
    width: moderateScale(40),
  },
  content: {
    flex: 1,
  },
  infoCard: {
    flexDirection: "row",
    gap: theme.spacing.m,
    backgroundColor: theme.colors.primary + "10",
    padding: theme.spacing.m,
    margin: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
  },
  infoText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  section: {
    padding: theme.spacing.m,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.m,
  },
  groupCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.l,
    marginBottom: theme.spacing.m,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.m,
  },
  groupName: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  groupLimit: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  progressContainer: {
    marginBottom: theme.spacing.l,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 4,
    marginBottom: theme.spacing.xs,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  progressDanger: {
    backgroundColor: theme.colors.status.warning,
  },
  progressText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  cardsLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.s,
  },
  cardItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.s,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cardName: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
  },
  cardUsage: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  emptyState: {
    alignItems: "center",
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xxl,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  noteCard: {
    backgroundColor: theme.colors.status.warning + "15",
    padding: theme.spacing.m,
    margin: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.status.warning,
  },
  noteText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
});
