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
import { theme } from "../constants/theme";
import { useCards } from "../context/CardsContext";
import { Card, Transaction } from "../types/card";
import { CreditCard } from "../components/CreditCard";

export const SearchScreen = () => {
  const navigation = useNavigation();
  const { cards, transactions } = useCards();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return { cards: [], transactions: [] };

    const lowerQuery = query.toLowerCase();

    const matchedCards = cards.filter(
      (c) =>
        !c.isArchived &&
        (c.alias.toLowerCase().includes(lowerQuery) ||
          c.bankName.toLowerCase().includes(lowerQuery))
    );

    const matchedTransactions = transactions.filter(
      (tx) =>
        tx.description.toLowerCase().includes(lowerQuery) ||
        tx.category.toLowerCase().includes(lowerQuery) ||
        tx.amount.toString().includes(lowerQuery)
    );

    return { cards: matchedCards, transactions: matchedTransactions };
  }, [query, cards, transactions]);

  const renderItem = ({ item }: { item: Card | Transaction | string }) => {
    if (typeof item === "string") {
      return <Text style={styles.sectionHeader}>{item}</Text>;
    }

    if ("bankName" in item) {
      // It's a Card
      return (
        <TouchableOpacity
          onPress={() => navigation.navigate("CardDetail", { cardId: item.id })}
          style={{ marginBottom: theme.spacing.m }}
        >
          <CreditCard card={item} compact />
        </TouchableOpacity>
      );
    } else {
      // It's a Transaction
      const card = cards.find((c) => c.id === item.cardId);
      return (
        <View style={styles.transactionItem}>
          <View style={styles.transactionLeft}>
            <View style={styles.categoryIcon}>
              <Text style={styles.categoryIconText}>
                {item.category.charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={styles.transactionDesc}>{item.description}</Text>
              <Text style={styles.transactionDate}>
                {new Date(item.date).toLocaleDateString("id-ID")} •{" "}
                {card?.alias || "Kartu Dihapus"}
              </Text>
            </View>
          </View>
          <Text style={styles.transactionAmount}>
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
            }).format(item.amount)}
          </Text>
        </View>
      );
    }
  };

  const data = useMemo(() => {
    const list: (Card | Transaction | string)[] = [];
    if (results.cards.length > 0) {
      list.push("Kartu");
      list.push(...results.cards);
    }
    if (results.transactions.length > 0) {
      list.push("Transaksi");
      list.push(...results.transactions);
    }
    return list;
  }, [results]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari kartu atau transaksi..."
          value={query}
          onChangeText={setQuery}
          autoFocus
          placeholderTextColor={theme.colors.text.tertiary}
        />
      </View>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          typeof item === "string" ? item : item.id
        }
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          query.trim() ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Tidak ditemukan hasil.</Text>
            </View>
          ) : null
        }
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
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.s,
    marginRight: theme.spacing.s,
  },
  backButtonText: {
    fontSize: 24,
    color: theme.colors.text.primary,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.m,
    paddingHorizontal: theme.spacing.m,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  content: {
    padding: theme.spacing.m,
  },
  sectionHeader: {
    ...theme.typography.h3,
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.s,
    color: theme.colors.text.primary,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.m,
  },
  categoryIconText: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  transactionDesc: {
    ...theme.typography.body,
    fontWeight: "500",
    color: theme.colors.text.primary,
  },
  transactionDate: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  transactionAmount: {
    ...theme.typography.body,
    fontWeight: "bold",
    color: theme.colors.text.primary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.tertiary,
  },
});
