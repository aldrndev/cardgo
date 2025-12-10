import React, { useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useTheme, Theme } from "../context/ThemeContext";
import { usePremium } from "../context/PremiumContext";
import { formatCurrency } from "../utils/formatters";
import { moderateScale, scale } from "../utils/responsive";
import { useCards } from "../context/CardsContext";
import { RootStackParamList } from "../navigation/types";
import { CreditCard } from "../components/CreditCard";
import { FloatingActionButton } from "../components/FloatingActionButton";
import { FeatureLockedModal } from "../components/FeatureLockedModal";
import { Ionicons } from "@expo/vector-icons";

type CardsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Main"
>;

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.85;
const CARD_SPACING = 10;
const SIDE_SPACING = (width - CARD_WIDTH) / 2;

export const CardsScreen = () => {
  const navigation = useNavigation<CardsScreenNavigationProp>();
  const { cards } = useCards();
  const { theme } = useTheme();
  const { canAddCard } = usePremium();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

  // Dynamic styles based on theme
  const styles = useMemo(() => getStyles(theme), [theme]);

  // Filter out archived cards
  const activeCards = cards.filter((c) => !c.isArchived);

  const handleCardPress = (cardId: string) => {
    navigation.navigate("CardDetail", { cardId });
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: true }
  );

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / (CARD_WIDTH + CARD_SPACING));
      setActiveIndex(Math.max(0, Math.min(index, activeCards.length - 1)));
    },
    [activeCards.length]
  );

  // Calculate total usage and limit
  const totalUsage = activeCards.reduce(
    (sum, card) => sum + (card.currentUsage || 0),
    0
  );
  const totalLimit = activeCards.reduce(
    (sum, card) => sum + (card.creditLimit || 0),
    0
  );
  const usagePercentage = totalLimit > 0 ? (totalUsage / totalLimit) * 100 : 0;

  // Find cards due soon
  const cardsDueSoon = activeCards.filter((card) => {
    if (!card.dueDay) return false;
    const today = new Date().getDate();
    const daysUntilDue =
      card.dueDay >= today ? card.dueDay - today : 30 - today + card.dueDay;
    return daysUntilDue <= 7;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kartu Saya</Text>
        <Text style={styles.headerSubtitle}>
          {activeCards.length} kartu aktif
        </Text>
      </View>

      {activeCards.length === 0 ? (
        <View style={styles.emptyWrapper}>
          <TouchableOpacity
            style={styles.ghostCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("AddEditCard", {})}
          >
            <View style={styles.ghostContent}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name="add"
                  size={moderateScale(32)}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.ghostTitle}>Tambah Kartu</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.ghostDescription}>
            Dompetmu masih kosong. Tambahkan kartu untuk mulai memantau
            pengeluaranmu.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.carouselContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Carousel */}
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + CARD_SPACING}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContent}
            onScroll={handleScroll}
            onMomentumScrollEnd={onMomentumScrollEnd}
            scrollEventThrottle={16}
          >
            {activeCards.map((card, index) => {
              // Calculate input range for this card
              const inputRange = [
                (index - 1) * (CARD_WIDTH + CARD_SPACING),
                index * (CARD_WIDTH + CARD_SPACING),
                (index + 1) * (CARD_WIDTH + CARD_SPACING),
              ];

              // Scale animation - active card is 1, others are smaller
              const cardScale = scrollX.interpolate({
                inputRange,
                outputRange: [0.9, 1, 0.9],
                extrapolate: "clamp",
              });

              // Opacity animation - active card is 1, others are dimmed
              const cardOpacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.7, 1, 0.7],
                extrapolate: "clamp",
              });

              return (
                <Animated.View
                  key={card.id}
                  style={[
                    styles.cardWrapper,
                    {
                      transform: [{ scale: cardScale }],
                      opacity: cardOpacity,
                    },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.95}
                    onPress={() => handleCardPress(card.id)}
                  >
                    <CreditCard
                      card={card}
                      containerStyle={styles.creditCard}
                      onPress={() => handleCardPress(card.id)}
                    />
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </Animated.ScrollView>

          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {activeCards.map((_, index) => {
              const isActive = index === activeIndex;

              return (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      width: isActive ? 24 : 8,
                      opacity: isActive ? 1 : 0.4,
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Card Info Summary */}
          {activeCards[activeIndex] && (
            <View style={styles.cardSummary}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Tagihan</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(activeCards[activeIndex].currentUsage || 0)}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Limit</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(activeCards[activeIndex].creditLimit || 0)}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Jatuh Tempo</Text>
                  <Text style={styles.summaryValue}>
                    Tgl {activeCards[activeIndex].dueDay || "-"}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Tip Card */}
          {activeCards.length > 1 && (
            <View style={styles.tipCard}>
              <Ionicons
                name="bulb-outline"
                size={moderateScale(18)}
                color={theme.colors.primary}
              />
              <Text style={styles.tipText}>
                Geser kartu untuk melihat kartu lainnya, tap untuk lihat detail.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* FAB for Adding Card */}
      <FloatingActionButton
        onPress={() => {
          if (!canAddCard(activeCards.length)) {
            setShowPaywall(true);
          } else {
            navigation.navigate("AddEditCard", {});
          }
        }}
      />

      {/* Premium Paywall Modal */}
      <FeatureLockedModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={() => {
          setShowPaywall(false);
          navigation.navigate("Paywall");
        }}
        featureName="Batas Kartu Tercapai"
        featureDescription={`Versi gratis dibatasi maksimal 3 kartu. Upgrade ke Premium untuk menambahkan kartu tanpa batas.`}
      />
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
      paddingHorizontal: theme.spacing.l,
      paddingTop: theme.spacing.m,
      paddingBottom: theme.spacing.s,
    },
    headerTitle: {
      ...theme.typography.h2,
      color: theme.colors.text.primary,
      fontWeight: "700",
    },
    headerSubtitle: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginTop: 4,
    },
    carouselContainer: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 120,
    },
    tipCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: theme.colors.primary + "10",
      marginHorizontal: theme.spacing.l,
      marginTop: theme.spacing.m,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      gap: theme.spacing.s,
    },
    tipText: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      flex: 1,
      lineHeight: 18,
    },
    carouselContent: {
      paddingHorizontal: SIDE_SPACING,
      paddingTop: theme.spacing.m,
    },
    cardWrapper: {
      width: CARD_WIDTH,
      marginRight: CARD_SPACING,
    },
    creditCard: {
      width: "100%",
      marginRight: 0,
    },
    pagination: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: theme.spacing.m,
      gap: 6,
    },
    dot: {
      height: 8,
      borderRadius: 4,
    },
    cardSummary: {
      marginHorizontal: theme.spacing.l,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.m,
      ...theme.shadows.small,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    summaryItem: {
      flex: 1,
      alignItems: "center",
    },
    summaryDivider: {
      width: 1,
      height: 40,
      backgroundColor: theme.colors.border,
    },
    summaryLabel: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginBottom: 4,
    },
    summaryValue: {
      ...theme.typography.body,
      color: theme.colors.text.primary,
      fontWeight: "600",
    },
    statsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: theme.spacing.l,
      paddingTop: theme.spacing.m,
      paddingBottom: 120,
      gap: theme.spacing.s,
    },
    statCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.m,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      gap: theme.spacing.s,
      ...theme.shadows.small,
    },
    alertCard: {
      borderWidth: 1,
      borderColor: theme.colors.warning + "40",
      backgroundColor: theme.colors.warning + "10",
    },
    statInfo: {
      gap: 2,
    },
    statLabel: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      fontSize: moderateScale(11),
    },
    statValue: {
      ...theme.typography.body,
      color: theme.colors.text.primary,
      fontWeight: "600",
      fontSize: moderateScale(14),
    },
    emptyWrapper: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.l,
    },
    ghostCard: {
      width: "100%",
      aspectRatio: 1.586,
      borderRadius: theme.borderRadius.xl,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderStyle: "dashed",
      backgroundColor: theme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: theme.spacing.l,
    },
    ghostContent: {
      alignItems: "center",
      gap: theme.spacing.s,
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary + "15",
      justifyContent: "center",
      alignItems: "center",
    },
    ghostTitle: {
      ...theme.typography.h3,
      color: theme.colors.primary,
      fontWeight: "600",
    },
    ghostDescription: {
      ...theme.typography.body,
      color: theme.colors.text.secondary,
      textAlign: "center",
      maxWidth: "80%",
      lineHeight: 22,
    },
  });
