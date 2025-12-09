import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme, Theme } from "../context/ThemeContext";
import { Card, CARD_THEMES } from "../types/card";
import { colors } from "../constants/colors";
import { formatCurrency } from "../utils/formatters";
import { scale, verticalScale } from "../utils/responsive";
import { useCards } from "../context/CardsContext";
import { PaymentStatusBadge } from "./PaymentStatusBadge";

const { width } = Dimensions.get("window");

interface CreditCardProps {
  card: Card;
  onPress?: () => void;
  compact?: boolean;
  containerStyle?: any;
}

export const CreditCard = React.memo(
  ({ card, onPress, compact = false, containerStyle }: CreditCardProps) => {
    const { theme } = useTheme();
    const { getSharedLimitInfo } = useCards(); // Access context for shared limit logic
    const styles = useMemo(() => getStyles(theme), [theme]);

    // Parse colorTheme if it's a gradient array or single string
    let gradientColors = [colors.primary, colors.primaryDark];
    let textColor = "#ffffff";

    if (card.themeId) {
      const theme = CARD_THEMES.find((t) => t.id === card.themeId);
      if (theme) {
        gradientColors = theme.colors;
        textColor = theme.textColor;
      }
    } else {
      // Fallback for legacy cards
      const gradientEntry = Object.values(colors.gradients).find(
        (g) => g[0] === card.colorTheme
      );
      if (gradientEntry) {
        gradientColors = gradientEntry;
      } else if (card.colorTheme) {
        gradientColors = [card.colorTheme, card.colorTheme];
      }
    }

    // Calculate limit logic
    let displayLimit = card.creditLimit;
    let displayUsage = card.currentUsage || 0;

    // Override if shared limit is active
    if (card.useSharedLimit && card.bankId) {
      const sharedInfo = getSharedLimitInfo(card.bankId);
      if (sharedInfo) {
        displayLimit = sharedInfo.sharedLimit;
        displayUsage = sharedInfo.totalUsage;
      }
    }

    // Calculate days until due for badge
    const today = new Date();
    const currentDay = today.getDate();
    let daysUntilDue = card.dueDay - currentDay;
    if (daysUntilDue < 0) daysUntilDue += 30; // Rough estimate

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[
          styles.container,
          compact && styles.compactContainer,
          containerStyle,
        ]}
      >
        <LinearGradient
          colors={gradientColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, compact && styles.compactCard]}
        >
          <View style={styles.topSection}>
            <Text
              style={[styles.bankName, { color: textColor }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {card.bankName.toUpperCase()}
            </Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.network, { color: textColor }]}>
                {card.network}
              </Text>
              {card.tags && card.tags.length > 0 && (
                <View style={{ flexDirection: "row", gap: 4, marginTop: 4 }}>
                  {card.tags.slice(0, 3).map((tag) => (
                    <Text
                      key={tag}
                      style={[styles.tagText, { color: textColor + "CC" }]}
                    >
                      #{tag}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.middleSection}>
            <Text
              style={[styles.alias, { color: textColor }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {card.alias.toUpperCase()}
            </Text>
            {card.last4 ? (
              <Text style={[styles.cardNumber, { color: textColor }]}>
                •••• •••• •••• {card.last4}
              </Text>
            ) : null}
          </View>

          <View style={styles.bottomSection}>
            <View>
              <Text style={[styles.label, { color: textColor + "CC" }]}>
                Jatuh Tempo
              </Text>
              <Text style={[styles.value, { color: textColor }]}>
                Tgl {card.dueDay}
              </Text>
            </View>
            {!compact && (
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.label, { color: textColor + "CC" }]}>
                  Sisa Limit {card.useSharedLimit ? "(Gabungan)" : ""}
                </Text>
                <Text style={[styles.value, { color: textColor }]}>
                  {formatCurrency(displayLimit - displayUsage, 1_000_000_000)}
                </Text>
                <Text
                  style={[
                    styles.label,
                    { fontSize: 10, marginTop: 2, opacity: 0.8 },
                  ]}
                >
                  dari {formatCurrency(displayLimit, 1_000_000_000)}
                </Text>
              </View>
            )}
          </View>

          {/* Payment Status Badge */}
          {!compact && (
            <PaymentStatusBadge
              isPaid={card.isPaid || false}
              daysUntilDue={daysUntilDue}
            />
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
);

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: width - scale(32) * 2,
      height: verticalScale(200),
      marginRight: theme.spacing.m,
      ...theme.shadows.medium,
    },
    compactContainer: {
      width: "100%",
      height: verticalScale(80),
      marginRight: 0,
      marginBottom: theme.spacing.s,
    },
    card: {
      flex: 1,
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.l,
      justifyContent: "space-between",
    },
    compactCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: theme.spacing.m,
    },
    topSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    bankName: {
      ...theme.typography.h3,
      color: "#FFFFFF",
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    cardType: {
      color: "rgba(255, 255, 255, 0.8)",
      fontSize: 12,
      fontWeight: "600",
      marginTop: 4,
    },
    chip: {
      width: 40,
      height: 30,
      backgroundColor: "#FFD700",
      borderRadius: 6,
      overflow: "hidden",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    chipLine: {
      height: 1,
      backgroundColor: "#333",
      marginVertical: 2,
      ...theme.shadows.small,
    },
    middleSection: {
      justifyContent: "center",
      marginTop: theme.spacing.xs,
    },
    cardNumber: {
      ...theme.typography.body,
      color: "#FFFFFF",
      opacity: 0.8,
      fontFamily: "monospace",
      letterSpacing: 2,
    },
    hiddenNumber: {
      color: "#FFFFFF",
      fontSize: 14,
      letterSpacing: 2,
    },
    bottomSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    label: {
      ...theme.typography.caption,
      color: "#FFFFFF",
      opacity: 0.7,
      marginBottom: 2,
      textTransform: "uppercase",
    },
    value: {
      ...theme.typography.body,
      color: "#FFFFFF",
      fontWeight: "600",
    },
    network: {
      ...theme.typography.caption,
      color: "#FFFFFF",
      opacity: 0.8,
      textTransform: "uppercase",
    },
    alias: {
      ...theme.typography.h2,
      color: "#FFFFFF",
      marginBottom: theme.spacing.xs,
    },
    tagText: {
      fontSize: 10,
      fontWeight: "500",
    },
  });
