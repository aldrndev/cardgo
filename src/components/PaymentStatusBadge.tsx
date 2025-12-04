import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";

interface PaymentStatusBadgeProps {
  isPaid: boolean;
  daysUntilDue: number;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  isPaid,
  daysUntilDue,
}) => {
  // Don't show badge if payment is done
  if (isPaid) {
    return (
      <View style={[styles.badge, styles.paidBadge]}>
        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
        <Text style={styles.badgeText}>Lunas</Text>
      </View>
    );
  }

  // Show urgent badge if due in 3 days or less
  if (daysUntilDue <= 3 && daysUntilDue >= 0) {
    return (
      <View style={[styles.badge, styles.urgentBadge]}>
        <Ionicons name="alert-circle" size={16} color="#FFFFFF" />
        <Text style={styles.badgeText}>{daysUntilDue} Hari</Text>
      </View>
    );
  }

  // No badge for normal state
  return null;
};

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  paidBadge: {
    backgroundColor: "#10B981", // Green
  },
  urgentBadge: {
    backgroundColor: "#EF4444", // Red
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
