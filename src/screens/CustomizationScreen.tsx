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
import { useTheme, Theme, ACCENT_COLORS } from "../context/ThemeContext";
import { moderateScale, scale } from "../utils/responsive";
import { storage } from "../utils/storage";
import { CATEGORIES } from "../utils/categorizer";
import { usePremium } from "../context/PremiumContext";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/types";

// Available icons for custom categories
const CATEGORY_ICONS = [
  "pricetag-outline",
  "cart-outline",
  "gift-outline",
  "game-controller-outline",
  "home-outline",
  "car-outline",
  "airplane-outline",
  "restaurant-outline",
  "cafe-outline",
  "beer-outline",
  "fitness-outline",
  "heart-outline",
  "musical-notes-outline",
  "book-outline",
  "headset-outline",
  "phone-portrait-outline",
  "laptop-outline",
  "camera-outline",
  "shirt-outline",
  "cut-outline",
  "paw-outline",
  "leaf-outline",
  "sparkles-outline",
  "diamond-outline",
];

interface CustomCategory {
  name: string;
  icon: string;
}

export const CustomizationScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { theme, isDark, accentColor, setAccentColor } = useTheme();
  const { canCustomizeTheme } = usePremium();

  // Dynamic styles based on theme
  const styles = useMemo(() => getStyles(theme), [theme]);

  // ALL HOOKS MUST BE BEFORE ANY CONDITIONAL RETURNS
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(
    []
  );
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("pricetag-outline");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const categories = await storage.getCustomCategories();
    setCustomCategories(categories || []);
  };

  // Premium check - show locked state for free users
  if (!canCustomizeTheme()) {
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
        <View style={styles.lockedContainer}>
          <View style={styles.lockedIconContainer}>
            <Ionicons name="diamond" size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.lockedTitle}>Kustomisasi Premium</Text>
          <Text style={styles.lockedDescription}>
            Personalisasi warna aksen dan buat kategori transaksi kustom.
            Upgrade ke Premium untuk membuka fitur ini.
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.navigate("Paywall")}
          >
            <Ionicons name="diamond" size={18} color="#FFF" />
            <Text style={styles.upgradeButtonText}>Upgrade ke Premium</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert("Error", "Nama kategori tidak boleh kosong");
      return;
    }

    const allCategoryNames = [
      ...CATEGORIES,
      ...customCategories.map((c) => c.name),
    ];
    if (allCategoryNames.includes(newCategoryName.trim())) {
      Alert.alert("Error", "Kategori sudah ada");
      return;
    }

    const newCategory: CustomCategory = {
      name: newCategoryName.trim(),
      icon: selectedIcon,
    };
    const updated = [...customCategories, newCategory];
    await storage.saveCustomCategories(updated);
    setCustomCategories(updated);
    setNewCategoryName("");
    setSelectedIcon("pricetag-outline");
    setShowAddCategory(false);
  };

  const handleDeleteCategory = async (categoryName: string) => {
    Alert.alert(
      "Hapus Kategori",
      `Yakin ingin menghapus kategori "${categoryName}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            const updated = customCategories.filter(
              (c) => c.name !== categoryName
            );
            await storage.saveCustomCategories(updated);
            setCustomCategories(updated);
          },
        },
      ]
    );
  };

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
        {/* Accent Color Section - MOVED TO TOP */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warna Tema Aplikasi</Text>
          <Text style={styles.sectionDescription}>
            Pilih warna tema sesuai selera kamu
          </Text>
          <View style={styles.colorGrid}>
            {ACCENT_COLORS.map((item) => (
              <TouchableOpacity
                key={item.color}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: item.color },
                  accentColor === item.color && styles.colorSwatchActive,
                ]}
                onPress={() => setAccentColor(item.color)}
              >
                {accentColor === item.color && (
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.colorLabel}>
            {ACCENT_COLORS.find((c) => c.color === accentColor)?.name ||
              "Kustom"}
          </Text>
        </View>

        {/* Custom Categories Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tambah Kategori</Text>
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
            Buat kategori transaksi dengan ikon pilihan
          </Text>

          {customCategories.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="pricetags-outline"
                size={moderateScale(48)}
                color={theme.colors.text.tertiary}
              />
              <Text style={styles.emptyText}>Belum ada kategori kustom</Text>
              <Text style={styles.emptySubtext}>
                Tap tombol + untuk menambahkan
              </Text>
            </View>
          ) : (
            <View style={styles.categoriesList}>
              {customCategories.map((category) => (
                <View key={category.name} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: theme.colors.primary + "20" },
                      ]}
                    >
                      <Ionicons
                        name={category.icon as any}
                        size={moderateScale(20)}
                        color={theme.colors.primary}
                      />
                    </View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteCategory(category.name)}
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
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
            />

            <Text style={styles.iconSectionTitle}>Pilih Ikon</Text>
            <ScrollView
              style={styles.iconScrollView}
              contentContainerStyle={styles.iconGrid}
              showsVerticalScrollIndicator={false}
            >
              {CATEGORY_ICONS.map((iconName) => (
                <TouchableOpacity
                  key={iconName}
                  style={[
                    styles.iconOption,
                    selectedIcon === iconName && styles.iconOptionActive,
                  ]}
                  onPress={() => setSelectedIcon(iconName)}
                >
                  <Ionicons
                    name={iconName as any}
                    size={24}
                    color={
                      selectedIcon === iconName
                        ? "#FFFFFF"
                        : theme.colors.text.secondary
                    }
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNewCategoryName("");
                  setSelectedIcon("pricetag-outline");
                  setShowAddCategory(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddCategory}
              >
                <Text style={styles.confirmButtonText}>Simpan</Text>
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
      padding: theme.spacing.xs,
    },
    headerTitle: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
    },
    placeholder: {
      width: moderateScale(32),
    },
    content: {
      flex: 1,
      padding: theme.spacing.m,
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.l,
      marginBottom: theme.spacing.m,
      ...theme.shadows.small,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sectionTitle: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
    },
    sectionDescription: {
      ...theme.typography.caption,
      color: theme.colors.text.tertiary,
      marginTop: theme.spacing.xs,
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
      marginTop: theme.spacing.m,
    },
    emptySubtext: {
      ...theme.typography.caption,
      color: theme.colors.text.tertiary,
      marginTop: theme.spacing.xs,
    },
    categoriesList: {
      gap: theme.spacing.s,
    },
    categoryItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.m,
    },
    categoryInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.m,
    },
    categoryIcon: {
      width: scale(36),
      height: scale(36),
      borderRadius: scale(18),
      justifyContent: "center",
      alignItems: "center",
    },
    categoryName: {
      ...theme.typography.body,
      color: theme.colors.text.primary,
    },
    colorGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: scale(12),
    },
    colorSwatch: {
      width: scale(48),
      height: scale(48),
      borderRadius: scale(24),
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 3,
      borderColor: "transparent",
    },
    colorSwatchActive: {
      borderColor: theme.colors.text.primary,
    },
    colorLabel: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      textAlign: "center",
      marginTop: theme.spacing.m,
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
      width: "90%",
      maxHeight: "80%",
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
      marginBottom: theme.spacing.m,
    },
    iconSectionTitle: {
      ...theme.typography.body,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.s,
      fontWeight: "600",
    },
    iconScrollView: {
      maxHeight: scale(200),
      marginBottom: theme.spacing.l,
    },
    iconGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: scale(10),
    },
    iconOption: {
      width: scale(44),
      height: scale(44),
      borderRadius: scale(22),
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    iconOptionActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
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
      color: "#FFFFFF",
    },
    lockedContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: scale(40),
    },
    lockedIconContainer: {
      width: scale(100),
      height: scale(100),
      borderRadius: scale(50),
      backgroundColor: theme.colors.primary + "15",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: scale(24),
    },
    lockedTitle: {
      fontSize: moderateScale(22),
      fontWeight: "700",
      color: theme.colors.text.primary,
      marginBottom: scale(12),
      textAlign: "center",
    },
    lockedDescription: {
      fontSize: moderateScale(14),
      color: theme.colors.text.secondary,
      textAlign: "center",
      lineHeight: moderateScale(22),
      marginBottom: scale(32),
    },
    upgradeButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      paddingHorizontal: scale(28),
      paddingVertical: scale(14),
      borderRadius: scale(25),
      gap: scale(8),
    },
    upgradeButtonText: {
      fontSize: moderateScale(15),
      fontWeight: "600",
      color: "#FFF",
    },
  });
