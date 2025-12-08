import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { useCards } from "../context/CardsContext";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme, Theme } from "../context/ThemeContext";

interface MonthlyRecapProps {
  visible: boolean;
  onClose: () => void;
}

export const MonthlyRecap = ({ visible, onClose }: MonthlyRecapProps) => {
  const { transactions, cards } = useCards();
  const { theme } = useTheme();

  const styles = useMemo(() => getStyles(theme), [theme]);

  const recapData = useMemo(() => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthName = lastMonth.toLocaleString("id-ID", { month: "long" });
    const lastMonthYear = lastMonth.getFullYear();

    const lastMonthTransactions = transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return (
        txDate.getMonth() === lastMonth.getMonth() &&
        txDate.getFullYear() === lastMonthYear
      );
    });

    if (lastMonthTransactions.length === 0) return null;

    const totalSpent = lastMonthTransactions.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );

    const categoryTotals: Record<string, number> = {};
    lastMonthTransactions.forEach((tx) => {
      categoryTotals[tx.category] =
        (categoryTotals[tx.category] || 0) + tx.amount;
    });

    const topCategory = Object.entries(categoryTotals).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const cardTotals: Record<string, number> = {};
    lastMonthTransactions.forEach((tx) => {
      cardTotals[tx.cardId] = (cardTotals[tx.cardId] || 0) + tx.amount;
    });

    const topCardId = Object.entries(cardTotals).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];
    const topCard = cards.find((c) => c.id === topCardId);

    return {
      monthName: lastMonthName,
      totalSpent,
      topCategory: topCategory ? topCategory[0] : "-",
      topCardName: topCard ? topCard.alias : "-",
    };
  }, [transactions, cards]);

  if (!recapData) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={[theme.colors.primary, "#312E81"]} // Indigo 600 to Indigo 900
            style={styles.gradientBg}
          >
            <Text style={styles.title}>Rekap Bulan {recapData.monthName}</Text>

            <View style={styles.statItem}>
              <Text style={styles.label}>Total Pengeluaran</Text>
              <Text style={styles.value}>
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                }).format(recapData.totalSpent)}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.label}>Kategori Terboros</Text>
              <Text style={styles.value}>{recapData.topCategory}</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.label}>Kartu Andalan</Text>
              <Text style={styles.value}>{recapData.topCardName}</Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Tutup</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      padding: theme.spacing.l,
    },
    modalContent: {
      borderRadius: theme.borderRadius.xl,
      overflow: "hidden",
      width: "90%",
      maxWidth: 400,
      ...theme.shadows.large,
    },
    gradientBg: {
      padding: theme.spacing.xl,
      alignItems: "center",
    },
    title: {
      ...theme.typography.h2,
      color: "#FFFFFF",
      marginBottom: theme.spacing.xl,
      textAlign: "center",
    },
    statItem: {
      marginBottom: theme.spacing.l,
      alignItems: "center",
    },
    label: {
      ...theme.typography.body,
      color: "#FFFFFF",
      opacity: 0.8,
      marginBottom: theme.spacing.xs,
    },
    value: {
      ...theme.typography.h1,
      color: "#FFFFFF",
      fontSize: 24,
      fontWeight: "bold",
    },
    closeButton: {
      marginTop: theme.spacing.l,
      paddingVertical: theme.spacing.m,
      paddingHorizontal: theme.spacing.xl,
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: theme.borderRadius.round,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.3)",
    },
    closeButtonText: {
      ...theme.typography.button,
      color: "#FFFFFF",
    },
  });
