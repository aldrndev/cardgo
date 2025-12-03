import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../constants/theme";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/types";

type EmptyStateNavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get("window");

export const EmptyState = ({
  message = "Belum ada kartu kredit yang ditambahkan",
}: {
  message?: string;
}) => {
  const navigation = useNavigation<EmptyStateNavigationProp>();

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={require("../assets/generated/empty_state_no_cards.png")}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>Atur Kartu Kreditmu</Text>
      <Text style={styles.message}>
        Pantau limit, tagihan, dan tanggal jatuh tempo dalam satu aplikasi yang
        aman dan offline.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("AddEditCard", {})}
        activeOpacity={0.9}
      >
        <Ionicons
          name="add-circle-outline"
          size={24}
          color={theme.colors.text.inverse}
          style={{ marginRight: 8 }}
        />
        <Text style={styles.buttonText}>Tambah Kartu Pertama</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  imageContainer: {
    width: width * 0.7,
    height: width * 0.7,
    marginBottom: theme.spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: theme.borderRadius.xl,
  },
  title: {
    ...theme.typography.h2,
    fontSize: 24,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.m,
    textAlign: "center",
    fontWeight: "800",
  },
  message: {
    ...theme.typography.body,
    textAlign: "center",
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
    maxWidth: "90%",
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 100, // Pill shape
    ...theme.shadows.medium,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
  },
  buttonText: {
    ...theme.typography.button,
    color: theme.colors.text.inverse,
    fontSize: 16,
    fontWeight: "700",
  },
});
