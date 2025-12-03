import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { useCards } from "../context/CardsContext";
import { CreditCard } from "../components/CreditCard";
import { Card } from "../types/card";

export const ArchivedCardsScreen = () => {
  const navigation = useNavigation();
  const { cards, archiveCard, deleteCard } = useCards();
  const [isLayoutAnimationEnabled, setIsLayoutAnimationEnabled] =
    React.useState(false);

  React.useEffect(() => {
    if (Platform.OS === "android") {
      if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    }
    setIsLayoutAnimationEnabled(true);
  }, []);

  const animateLayout = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const archivedCards = cards.filter((card) => card.isArchived);

  const handleUnarchive = (card: Card) => {
    Alert.alert(
      "Pulihkan Kartu",
      `Apakah Anda ingin memulihkan kartu ${card.alias}?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Pulihkan",
          onPress: async () => {
            animateLayout();
            await archiveCard(card.id, false);
          },
        },
      ]
    );
  };

  const handleDelete = (card: Card) => {
    Alert.alert(
      "Hapus Permanen",
      `Apakah Anda yakin ingin menghapus kartu ${card.alias} secara permanen? Data tidak dapat dikembalikan.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            animateLayout();
            await deleteCard(card.id);
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Card }) => (
    <View style={styles.cardWrapper}>
      <View style={styles.cardInner}>
        <View style={styles.archivedOverlay}>
          <CreditCard card={item} />
          <View style={styles.overlayBackdrop} />
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>ARCHIVED</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.restoreButton]}
          onPress={() => handleUnarchive(item)}
        >
          <Ionicons
            name="refresh-circle"
            size={24}
            color={theme.colors.primary}
          />
          <Text style={[styles.actionText, { color: theme.colors.primary }]}>
            Pulihkan
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash" size={20} color={theme.colors.status.error} />
          <Text
            style={[styles.actionText, { color: theme.colors.status.error }]}
          >
            Hapus
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
        <Text style={styles.headerTitle}>Kartu Diarsipkan</Text>
        <View style={{ width: 24 }} />
      </View>

      {archivedCards.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="archive-outline"
            size={64}
            color={theme.colors.text.tertiary}
          />
          <Text style={styles.emptyText}>Tidak ada kartu yang diarsipkan</Text>
        </View>
      ) : (
        <FlatList
          data={archivedCards}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
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
    padding: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    marginRight: theme.spacing.m,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
  },
  listContent: {
    padding: theme.spacing.m,
  },
  cardWrapper: {
    marginBottom: theme.spacing.l,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.s,
    ...theme.shadows.small,
  },
  cardInner: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  archivedOverlay: {
    position: "relative",
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: theme.borderRadius.l,
  },
  badgeContainer: {
    position: "absolute",
    top: theme.spacing.m,
    right: theme.spacing.m,
    backgroundColor: theme.colors.text.primary,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    ...theme.typography.caption,
    color: theme.colors.text.inverse,
    fontWeight: "bold",
    fontSize: 10,
  },
  actionsContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.s,
    paddingTop: theme.spacing.s,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.s,
    gap: 8,
  },
  restoreButton: {},
  deleteButton: {},
  divider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
  },
  actionText: {
    ...theme.typography.button,
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.m,
  },
});
