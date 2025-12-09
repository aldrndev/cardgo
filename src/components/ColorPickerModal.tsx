import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, Theme } from "../context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { scale, moderateScale } from "../utils/responsive";

interface ColorPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectColor: (color: string, secondaryColor: string) => void;
  initialColor?: string;
}

// Generate a color palette based on HSL
const generateColorPalette = () => {
  const colors: string[] = [];

  // Primary hues (0-360 in steps)
  const hues = [0, 15, 30, 45, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const saturations = [100, 70, 40];
  const lightnesses = [40, 55, 70];

  // Add some grays first
  colors.push(
    "#1a1a1a",
    "#333333",
    "#4d4d4d",
    "#666666",
    "#808080",
    "#999999",
    "#b3b3b3",
    "#cccccc"
  );

  // Generate colors
  hues.forEach((h) => {
    saturations.forEach((s) => {
      lightnesses.forEach((l) => {
        colors.push(hslToHex(h, s, l));
      });
    });
  });

  return colors;
};

// Convert HSL to Hex
const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

// Lighten a color for gradient
const lightenColor = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
};

// Darken a color for gradient
const darkenColor = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
};

const COLOR_PALETTE = generateColorPalette();

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  visible,
  onClose,
  onSelectColor,
  initialColor = "#4F46E5",
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [hexInput, setHexInput] = useState(initialColor);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setHexInput(color);
  };

  const handleHexChange = (text: string) => {
    // Clean input
    let cleaned = text.replace(/[^0-9A-Fa-f#]/g, "");
    if (!cleaned.startsWith("#")) {
      cleaned = "#" + cleaned;
    }
    if (cleaned.length <= 7) {
      setHexInput(cleaned);
      if (cleaned.length === 7) {
        setSelectedColor(cleaned);
      }
    }
  };

  const handleConfirm = () => {
    const secondaryColor = lightenColor(selectedColor, 25);
    onSelectColor(selectedColor, secondaryColor);
    onClose();
  };

  // Generate gradient preview colors
  const gradientColors = [selectedColor, lightenColor(selectedColor, 25)];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Pilih Warna Kartu</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons
                name="close"
                size={moderateScale(24)}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Preview */}
            <View style={styles.previewSection}>
              <Text style={styles.sectionLabel}>Preview</Text>
              <LinearGradient
                colors={gradientColors as [string, string]}
                style={styles.previewCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.previewCardText}>•••• •••• •••• 1234</Text>
                <Text style={styles.previewCardName}>NAMA KARTU</Text>
              </LinearGradient>
            </View>

            {/* Color Palette - Moved up for better UX */}
            <View style={styles.paletteSection}>
              <Text style={styles.sectionLabel}>Palet Warna</Text>
              <View style={styles.paletteGrid}>
                {COLOR_PALETTE.map((color, index) => (
                  <TouchableOpacity
                    key={`${color}-${index}`}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: color },
                      selectedColor === color && styles.selectedSwatch,
                    ]}
                    onPress={() => handleColorSelect(color)}
                  >
                    {selectedColor === color && (
                      <Ionicons
                        name="checkmark"
                        size={moderateScale(16)}
                        color={
                          parseInt(color.replace("#", ""), 16) > 0x7fffff
                            ? "#000"
                            : "#FFF"
                        }
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Hex Input - Optional advanced section */}
            <View style={styles.hexSection}>
              <Text style={styles.sectionLabel}>Atau Masukkan Kode Hex</Text>
              <View style={styles.hexInputContainer}>
                <View
                  style={[
                    styles.colorPreviewDot,
                    { backgroundColor: selectedColor },
                  ]}
                />
                <TextInput
                  style={styles.hexInput}
                  value={hexInput}
                  onChangeText={handleHexChange}
                  placeholder="#000000"
                  placeholderTextColor={theme.colors.text.tertiary}
                  autoCapitalize="characters"
                  maxLength={7}
                />
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: selectedColor }]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Pilih Warna Ini</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: moderateScale(24),
      borderTopRightRadius: moderateScale(24),
      maxHeight: "85%",
      paddingBottom: scale(20),
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: scale(16),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
    },
    closeButton: {
      padding: scale(4),
    },
    scrollContent: {
      flexGrow: 1,
    },
    previewSection: {
      paddingHorizontal: scale(16),
      paddingTop: scale(16),
    },
    sectionLabel: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginBottom: scale(8),
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    previewCard: {
      height: moderateScale(120),
      borderRadius: moderateScale(16),
      padding: scale(16),
      justifyContent: "flex-end",
    },
    previewCardText: {
      color: "#FFFFFF",
      fontSize: moderateScale(18),
      fontWeight: "600",
      letterSpacing: 2,
      marginBottom: scale(8),
    },
    previewCardName: {
      color: "rgba(255,255,255,0.8)",
      fontSize: moderateScale(12),
      fontWeight: "500",
      letterSpacing: 1,
    },
    hexSection: {
      paddingHorizontal: scale(16),
      paddingTop: scale(16),
    },
    hexInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.background,
      borderRadius: moderateScale(12),
      paddingHorizontal: scale(12),
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    colorPreviewDot: {
      width: moderateScale(24),
      height: moderateScale(24),
      borderRadius: moderateScale(12),
      marginRight: scale(12),
    },
    hexInput: {
      flex: 1,
      ...theme.typography.body,
      color: theme.colors.text.primary,
      paddingVertical: scale(12),
      fontFamily: "monospace",
    },
    paletteSection: {
      paddingHorizontal: scale(16),
      paddingTop: scale(16),
      flex: 1,
    },
    paletteScroll: {
      maxHeight: moderateScale(200),
    },
    paletteGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: scale(8),
    },
    colorSwatch: {
      width: moderateScale(36),
      height: moderateScale(36),
      borderRadius: moderateScale(8),
      justifyContent: "center",
      alignItems: "center",
    },
    selectedSwatch: {
      borderWidth: 3,
      borderColor: "#FFFFFF",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    actions: {
      flexDirection: "row",
      paddingHorizontal: scale(16),
      paddingTop: scale(16),
      gap: scale(12),
    },
    cancelButton: {
      flex: 1,
      paddingVertical: scale(14),
      borderRadius: moderateScale(12),
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
    },
    cancelButtonText: {
      ...theme.typography.body,
      color: theme.colors.text.secondary,
      fontWeight: "600",
    },
    confirmButton: {
      flex: 2,
      paddingVertical: scale(14),
      borderRadius: moderateScale(12),
      alignItems: "center",
    },
    confirmButtonText: {
      ...theme.typography.body,
      color: "#FFFFFF",
      fontWeight: "600",
    },
  });
