import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, Theme } from "../context/ThemeContext";
import { useCards } from "../context/CardsContext";
import { Card, Transaction, CARD_THEMES } from "../types/card";
import { getCategoryIcon } from "../utils/categoryIcons";
import { formatCurrency, formatForeignCurrency } from "../utils/formatters";
import { moderateScale, scale } from "../utils/responsive";
import { LinearGradient } from "expo-linear-gradient";

export const SearchScreen = () => {
  const navigation = useNavigation();
  const { cards, transactions } = useCards();
  const [query, setQuery] = useState("");
  const { theme, isDark } = useTheme();

  // Dynamic styles based on theme
  const styles = useMemo(() => getStyles(theme), [theme]);

  const results = useMemo(() => {
    if (!query.trim()) return { cards: [], transactions: [] };

    const lowerQuery = query.toLowerCase();

    const matchedCards = cards.filter(
      (c) =>
        !c.isArchived &&
        (c.alias.toLowerCase().includes(lowerQuery) ||
          c.bankName.toLowerCase().includes(lowerQuery))
    );

    const matchedTransactions = transactions
      .filter(
        (tx) =>
          tx.description.toLowerCase().includes(lowerQuery) ||
          tx.category.toLowerCase().includes(lowerQuery) ||
          tx.amount.toString().includes(lowerQuery)
      )
      .slice(0, 20); // Limit to 20 results for performance

    return { cards: matchedCards, transactions: matchedTransactions };
  }, [query, cards, transactions]);

  const renderCardItem = (card: Card) => {
    // Get theme colors for gradient
    const cardTheme = CARD_THEMES.find((t) => t.id === card.themeId);
    const gradientColors = cardTheme?.colors || [
      card.colorTheme,
      card.colorTheme,
    ];

    return (
      <TouchableOpacity
        key={card.id}
        onPress={() => navigation.navigate("CardDetail", { cardId: card.id })}
        style={styles.cardResultItem}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={gradientColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardColorIndicator}
        />
        <View style={styles.cardResultContent}>
          <Text style={styles.cardResultName}>{card.alias.toUpperCase()}</Text>
          <Text style={styles.cardResultBank}>{card.bankName}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.text.tertiary}
        />
      </TouchableOpacity>
    );
  };

  const renderTransactionItem = (item: Transaction) => {
    const card = cards.find((c) => c.id === item.cardId);
    const { iconName, iconColor } = getCategoryIcon(item.category);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.transactionItem}
        onPress={() =>
          navigation.navigate("CardDetail", { cardId: item.cardId })
        }
        activeOpacity={0.7}
      >
        <View
          style={[styles.iconContainer, { backgroundColor: iconColor + "15" }]}
        >
          <Ionicons
            name={iconName}
            size={moderateScale(24)}
            color={iconColor}
          />
        </View>
        <View style={styles.transactionContent}>
          <Text style={styles.transactionDesc} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.transactionMeta}>
            {new Date(item.date).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}{" "}
            • {(card?.alias || "Kartu Dihapus").toUpperCase()}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          {item.currency && item.currency !== "IDR" && item.originalAmount ? (
            <>
              <Text style={styles.transactionAmount}>
                {formatForeignCurrency(item.originalAmount, item.currency)}
              </Text>
              <Text style={styles.convertedAmount}>
                ≈ {formatCurrency(item.amount)}
              </Text>
            </>
          ) : (
            <Text style={styles.transactionAmount}>
              {formatCurrency(item.amount)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const hasResults =
    results.cards.length > 0 || results.transactions.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header with Search */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={moderateScale(24)}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={moderateScale(18)}
            color={theme.colors.text.tertiary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari kartu atau transaksi..."
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholderTextColor={theme.colors.text.tertiary}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons
                name="close-circle"
                size={moderateScale(20)}
                color={theme.colors.text.tertiary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Initial State */}
      {!query.trim() && (
        <View style={styles.initialState}>
          <View style={styles.initialIconContainer}>
            <Ionicons
              name="search-outline"
              size={moderateScale(48)}
              color={theme.colors.text.tertiary}
            />
          </View>
          {/* <Text style={styles.initialTitle}>Cari di Card Go</Text> 
              User requested to remove this text.
          */}
          <Text style={styles.initialSubtitle}>
            Ketik nama kartu, deskripsi transaksi, atau kategori
          </Text>
        </View>
      )}

      {/* No Results */}
      {query.trim() && !hasResults && (
        <View style={styles.emptyState}>
          <Ionicons
            name="search-outline"
            size={moderateScale(64)}
            color={theme.colors.text.tertiary}
          />
          <Text style={styles.emptyTitle}>Tidak Ditemukan</Text>
          <Text style={styles.emptySubtitle}>
            Tidak ada hasil untuk "{query}"
          </Text>
        </View>
      )}

      {/* Results */}
      {hasResults && (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <>
              {/* Cards Section */}
              {results.cards.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="card"
                      size={moderateScale(18)}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.sectionTitle}>
                      Kartu ({results.cards.length})
                    </Text>
                  </View>
                  {results.cards.map(renderCardItem)}
                </View>
              )}

              {/* Transactions Section */}
              {results.transactions.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="receipt"
                      size={moderateScale(18)}
                      color={theme.colors.secondary}
                    />
                    <Text style={styles.sectionTitle}>
                      Transaksi ({results.transactions.length}
                      {results.transactions.length === 20 ? "+" : ""})
                    </Text>
                  </View>
                  <View style={styles.transactionsList}>
                    {results.transactions.map(renderTransactionItem)}
                  </View>
                </View>
              )}
            </>
          }
          contentContainerStyle={styles.content}
        />
      )}
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
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      backgroundColor: theme.colors.surface,
      gap: theme.spacing.s,
    },
    backButton: {
      padding: theme.spacing.xs,
    },
    searchContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.l,
      paddingHorizontal: theme.spacing.m,
      height: scale(44),
    },
    searchIcon: {
      marginRight: theme.spacing.s,
    },
    searchInput: {
      flex: 1,
      fontSize: moderateScale(15),
      color: theme.colors.text.primary,
      paddingVertical: 0,
    },
    content: {
      paddingBottom: theme.spacing.xl,
    },
    section: {
      marginTop: theme.spacing.m,
      paddingHorizontal: theme.spacing.m,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: theme.spacing.m,
      gap: theme.spacing.s,
    },
    sectionTitle: {
      ...theme.typography.body,
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
    cardItem: {
      marginBottom: theme.spacing.m,
    },
    transactionsList: {
      // backgroundColor: theme.colors.surface, // Removed
      // borderRadius: theme.borderRadius.l, // Removed
      // overflow: "hidden", // Removed
      // ...theme.shadows.small, // Removed
    },
    transactionItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16, // Increased padding
      paddingHorizontal: 0, // Removed horizontal padding since container handles it? No, keep standard spacing if needed, let's align with CardDetail
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    iconContainer: {
      width: 56, // Fixed to match HomeScreen/CardDetail
      height: 56,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    transactionContent: {
      flex: 1,
    },
    transactionDesc: {
      ...theme.typography.body,
      fontWeight: "500",
      color: theme.colors.text.primary,
      marginBottom: 2,
    },
    transactionMeta: {
      ...theme.typography.caption,
      color: theme.colors.text.tertiary,
    },
    amountContainer: {
      alignItems: "flex-end",
      marginLeft: theme.spacing.s,
    },
    transactionAmount: {
      ...theme.typography.body,
      fontWeight: "700",
      color: theme.colors.text.primary,
    },
    convertedAmount: {
      ...theme.typography.caption,
      fontSize: moderateScale(11),
      color: theme.colors.text.tertiary,
      marginTop: 2,
    },
    initialState: {
      paddingTop: theme.spacing.xl * 2,
      alignItems: "center",
      paddingHorizontal: theme.spacing.xl,
    },
    initialIconContainer: {
      width: scale(80),
      height: scale(80),
      borderRadius: scale(40),
      backgroundColor: theme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: theme.spacing.l,
    },
    initialTitle: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.s,
    },
    initialSubtitle: {
      ...theme.typography.body,
      color: theme.colors.text.tertiary,
      textAlign: "center",
      lineHeight: 22,
    },
    emptyState: {
      paddingTop: theme.spacing.xl * 2,
      alignItems: "center",
      paddingHorizontal: theme.spacing.xl,
    },
    emptyTitle: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
      marginTop: theme.spacing.l,
      marginBottom: theme.spacing.s,
    },
    emptySubtitle: {
      ...theme.typography.body,
      color: theme.colors.text.tertiary,
      textAlign: "center",
    },
    cardResultItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.l,
      marginBottom: theme.spacing.s,
      ...theme.shadows.small,
    },
    cardColorIndicator: {
      width: scale(44),
      height: scale(44),
      borderRadius: scale(12),
      marginRight: theme.spacing.m,
    },
    cardResultContent: {
      flex: 1,
    },
    cardResultName: {
      ...theme.typography.body,
      fontWeight: "600",
      color: theme.colors.text.primary,
      marginBottom: 2,
    },
    cardResultBank: {
      ...theme.typography.caption,
      color: theme.colors.text.tertiary,
    },
  });
