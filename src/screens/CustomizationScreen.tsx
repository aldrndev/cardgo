import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, Theme } from "../context/ThemeContext";
import { moderateScale } from "../utils/responsive";
import { storage } from "../utils/storage";
import { CATEGORIES } from "../utils/categorizer";

export const CustomizationScreen = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();

  // Dynamic styles based on theme
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("IDR");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const categories = await storage.getCustomCategories();
    setCustomCategories(categories || []);

    const currency = await storage.getDefaultCurrency();
    setDefaultCurrency(currency || "IDR");
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      Alert.alert("Error", "Nama kategori tidak boleh kosong");
      return;
    }

    const allCategories = [...CATEGORIES, ...customCategories];
    if (allCategories.includes(newCategory.trim())) {
      Alert.alert("Error", "Kategori sudah ada");
      return;
    }

    const updated = [...customCategories, newCategory.trim()];
    await storage.saveCustomCategories(updated);
    setCustomCategories(updated);
    setNewCategory("");
    setShowAddCategory(false);
  };

  const handleDeleteCategory = async (category: string) => {
    Alert.alert(
      "Hapus Kategori",
      `Yakin ingin menghapus kategori "${category}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            const updated = customCategories.filter((c) => c !== category);
            await storage.saveCustomCategories(updated);
            setCustomCategories(updated);
          },
        },
      ]
    );
  };

  const handleCurrencyChange = async (currency: string) => {
    await storage.saveDefaultCurrency(currency);
    setDefaultCurrency(currency);
  };

  const currencies = ["IDR", "USD", "EUR", "SGD", "MYR"];

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
        <Text style={styles.headerTitle}>Kustomisasi</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Custom Categories Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kategori Kustom</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddCategory(true)}
            >
              <Ionicons
                name="add-circle"
                size={moderateScale(24)}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionDescription}>
            Tambah kategori transaksi sesuai kebutuhanmu
          </Text>

          {customCategories.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="pricetags-outline"
                size={moderateScale(48)}
                color={theme.colors.text.tertiary}
              />
              <Text style={styles.emptyText}>Belum ada kategori kustom</Text>
            </View>
          ) : (
            <View style={styles.categoriesList}>
              {customCategories.map((category) => (
                <View key={category} style={styles.categoryItem}>
                  <Text style={styles.categoryName}>{category}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteCategory(category)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={moderateScale(20)}
                      color={theme.colors.status.error}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Default Currency Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mata Uang Default</Text>
          <Text style={styles.sectionDescription}>
            Mata uang default untuk transaksi baru
          </Text>
          <View style={styles.currencyOptions}>
            {currencies.map((currency) => (
              <TouchableOpacity
                key={currency}
                style={[
                  styles.currencyChip,
                  defaultCurrency === currency && styles.currencyChipActive,
                ]}
                onPress={() => handleCurrencyChange(currency)}
              >
                <Text
                  style={[
                    styles.currencyText,
                    defaultCurrency === currency && styles.currencyTextActive,
                  ]}
                >
                  {currency}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Ionicons
              name="information-circle"
              size={moderateScale(24)}
              color={theme.colors.primary}
            />
            <Text style={styles.infoText}>
              Pengaturan lainnya seperti tema, format tanggal, dan urutan kartu
              akan ditambahkan di versi mendatang
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Add Category Modal */}
      <Modal
        visible={showAddCategory}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddCategory(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Kategori</Text>
              <TouchableOpacity onPress={() => setShowAddCategory(false)}>
                <Ionicons
                  name="close"
                  size={moderateScale(24)}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nama kategori..."
              placeholderTextColor={theme.colors.text.tertiary}
              value={newCategory}
              onChangeText={setNewCategory}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNewCategory("");
                  setShowAddCategory(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddCategory}
              >
                <Text style={styles.confirmButtonText}>Tambah</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    section: {
      backgroundColor: theme.colors.surface,
      marginTop: theme.spacing.m,
      padding: theme.spacing.l,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.xs,
    },
    sectionTitle: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    sectionDescription: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.m,
    },
    addButton: {
      padding: theme.spacing.xs,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: theme.spacing.xl,
    },
    emptyText: {
      ...theme.typography.body,
      color: theme.colors.text.tertiary,
      marginTop: theme.spacing.s,
    },
    categoriesList: {
      gap: theme.spacing.s,
    },
    categoryItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: theme.colors.background,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
    },
    categoryName: {
      ...theme.typography.body,
      color: theme.colors.text.primary,
    },
    currencyOptions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.s,
    },
    currencyChip: {
      paddingHorizontal: theme.spacing.l,
      paddingVertical: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    currencyChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    currencyText: {
      ...theme.typography.body,
      color: theme.colors.text.primary,
      fontWeight: "600",
    },
    currencyTextActive: {
      color: theme.colors.text.inverse,
    },
    infoCard: {
      flexDirection: "row",
      gap: theme.spacing.m,
      backgroundColor: theme.colors.primary + "10",
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
    },
    infoText: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.l,
      width: "85%",
      ...theme.shadows.large,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.m,
    },
    modalTitle: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
    },
    input: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.m,
      padding: theme.spacing.m,
      ...theme.typography.body,
      color: theme.colors.text.primary,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.l,
    },
    modalActions: {
      flexDirection: "row",
      gap: theme.spacing.m,
    },
    modalButton: {
      flex: 1,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      alignItems: "center",
    },
    cancelButton: {
      backgroundColor: theme.colors.background,
    },
    confirmButton: {
      backgroundColor: theme.colors.primary,
    },
    cancelButtonText: {
      ...theme.typography.button,
      color: theme.colors.text.secondary,
    },
    confirmButtonText: {
      ...theme.typography.button,
      color: theme.colors.text.inverse,
    },
  });
