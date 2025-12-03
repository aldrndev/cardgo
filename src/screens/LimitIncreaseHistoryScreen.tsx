import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/types";
import { theme } from "../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLimitIncrease } from "../context/LimitIncreaseContext";
import { useCards } from "../context/CardsContext";
import { formatCurrency } from "../utils/formatters";
import { LimitIncreaseRecord } from "../types/limitIncrease";
import { FloatingActionButton } from "../components/FloatingActionButton";

type NavigationProp = StackNavigationProp<
  RootStackParamList,
  "LimitIncreaseHistory"
>;

type ScreenRouteProp = RouteProp<RootStackParamList, "LimitIncreaseHistory">;

export const LimitIncreaseHistoryScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { cardId } = route.params || {};
  const { records, updateRecord } = useLimitIncrease();
  const { cards } = useCards();

  const filteredRecords = useMemo(() => {
    if (cardId) {
      return records.filter((r) => r.cardId === cardId);
    }
    return records;
  }, [records, cardId]);

  const handleApprove = (record: LimitIncreaseRecord) => {
    Alert.alert(
      "Kenaikan Limit Disetujui",
      "Apakah pengajuan kenaikan limit ini disetujui?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Setuju",
          onPress: () => {
            updateRecord(record.id, {
              status: "approved",
              actionDate: new Date().toISOString(),
            });
          },
        },
      ]
    );
  };

  const handleReject = (record: LimitIncreaseRecord) => {
    Alert.alert(
      "Kenaikan Limit Ditolak",
      "Apakah pengajuan kenaikan limit di ditolak?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Tolak",
          style: "destructive",
          onPress: () => {
            updateRecord(record.id, {
              status: "rejected",
              actionDate: new Date().toISOString(),
            });
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: LimitIncreaseRecord }) => {
    const card = cards.find((c) => c.id === item.cardId);
    const requestDate = new Date(item.requestDate).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const getStatusColor = (status: string) => {
      switch (status) {
        case "approved":
          return theme.colors.status.success;
        case "rejected":
          return theme.colors.status.error;
        default:
          return theme.colors.status.warning;
      }
    };

    const getStatusLabel = (status: string) => {
      switch (status) {
        case "approved":
          return "Disetujui";
        case "rejected":
          return "Ditolak";
        default:
          return "Menunggu";
      }
    };

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: card?.colorTheme || theme.colors.primary },
              ]}
            >
              <Ionicons name="card" size={28} color="#FFF" />
            </View>
            <View>
              <Text style={styles.cardName}>
                {card?.alias || "Unknown Card"}
              </Text>
              <Text style={styles.dateText}>{requestDate}</Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + "20" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <View>
            <Text style={styles.label}>Jumlah Kenaikan</Text>
            <Text style={styles.value}>{formatCurrency(item.amount)}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.label}>Jenis</Text>
            <Text style={styles.value}>
              {item.type === "permanent" ? "Permanen" : "Sementara"} •{" "}
              {item.frequency} Bulan
            </Text>
          </View>
        </View>

        {item.status === "pending" && (
          <View>
            <Text style={styles.helperText}>
              Update status disetujui/ditolak untuk reminder berikutnya
            </Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleReject(item)}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={theme.colors.status.error}
                />
                <Text style={styles.rejectText}>Ditolak</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleApprove(item)}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={theme.colors.status.success}
                />
                <Text style={styles.approveText}>Disetujui</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
        <Text style={styles.headerTitle}>Riwayat Kenaikan Limit</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={filteredRecords}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="trending-up-outline"
              size={64}
              color={theme.colors.text.tertiary}
            />
            <Text style={styles.emptyText}>
              {cardId
                ? "Belum ada riwayat pengajuan untuk kartu ini"
                : "Belum ada riwayat pengajuan"}
            </Text>
          </View>
        }
      />

      <FloatingActionButton
        onPress={() => navigation.navigate("AddLimitIncrease", {})}
      />
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
  listContent: {
    padding: theme.spacing.m,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.small,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.s,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cardName: {
    ...theme.typography.body,
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
  dateText: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    ...theme.typography.caption,
    fontWeight: "600",
    fontSize: 10,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.m,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  value: {
    ...theme.typography.body,
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
  actionsRow: {
    flexDirection: "row",
    marginTop: theme.spacing.s,
    gap: theme.spacing.m,
  },
  helperText: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    fontSize: 10,
    marginTop: theme.spacing.m,
    marginBottom: 4,
    fontStyle: "italic",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: theme.borderRadius.s,
    gap: 4,
    borderWidth: 1,
  },
  rejectButton: {
    borderColor: theme.colors.status.error,
    backgroundColor: theme.colors.status.error + "10",
  },
  approveButton: {
    borderColor: theme.colors.status.success,
    backgroundColor: theme.colors.status.success + "10",
  },
  rejectText: {
    ...theme.typography.caption,
    fontWeight: "600",
    color: theme.colors.status.error,
  },
  approveText: {
    ...theme.typography.caption,
    fontWeight: "600",
    color: theme.colors.status.success,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
    gap: theme.spacing.m,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.tertiary,
  },
});
