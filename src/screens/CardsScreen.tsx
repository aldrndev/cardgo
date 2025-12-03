import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { theme } from "../constants/theme";
import { useCards } from "../context/CardsContext";
import { RootStackParamList } from "../navigation/types";
import { CreditCard } from "../components/CreditCard";
import { FloatingActionButton } from "../components/FloatingActionButton";
import { Ionicons } from "@expo/vector-icons";

type CardsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Main"
>;

const { width } = Dimensions.get("window");

export const CardsScreen = () => {
  const navigation = useNavigation<CardsScreenNavigationProp>();
  const { cards } = useCards();
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Filter out archived cards if needed, or show them differently
  // For now, let's show active cards
  const activeCards = cards.filter((c) => !c.isArchived);

  const handleCardPress = (cardId: string) => {
    if (activeCards.length > 1 && !isExpanded) {
      setIsExpanded(true);
    } else {
      navigation.navigate("CardDetail", { cardId });
    }
  };

  const handleHeaderPress = () => {
    if (isExpanded) setIsExpanded(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {isExpanded && (
        <View
          style={{
            alignItems: "flex-end",
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 8,
          }}
        >
          <TouchableOpacity onPress={() => setIsExpanded(false)}>
            <Ionicons
              name="close-circle"
              size={32}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {activeCards.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <TouchableOpacity
              style={styles.ghostCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("AddEditCard", {})}
            >
              <View style={styles.ghostContent}>
                <View style={styles.iconCircle}>
                  <Ionicons name="add" size={32} color={theme.colors.primary} />
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
          <View style={styles.cardsList}>
            {activeCards.map((card, index) => {
              // Stack logic
              // If not expanded and > 1 card, apply stack effect
              const isStack = !isExpanded && activeCards.length > 1;

              // Calculate margin top for stack effect
              // First card: 0
              // Subsequent cards in stack: -140 (overlap)
              // List mode: theme.spacing.m (gap)
              let marginTop = 0;
              if (index > 0) {
                marginTop = isStack ? -140 : theme.spacing.m;
              }

              return (
                <TouchableOpacity
                  key={card.id}
                  activeOpacity={0.9}
                  onPress={() => handleCardPress(card.id)}
                  style={[
                    styles.cardWrapper,
                    {
                      marginTop,
                      zIndex: index,
                      transform: [
                        {
                          scale: isStack
                            ? 1 - (activeCards.length - 1 - index) * 0.05
                            : 1,
                        },
                      ],
                    },
                  ]}
                >
                  <CreditCard
                    card={card}
                    containerStyle={{ width: "100%", marginRight: 0 }}
                    onPress={() => handleCardPress(card.id)}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* FAB for Adding Card */}
      <FloatingActionButton
        onPress={() => navigation.navigate("AddEditCard", {})}
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
    justifyContent: "center",
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.l,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    // alignItems is handled inline
  },
  content: {
    padding: theme.spacing.m,
    paddingBottom: 100,
  },
  cardsList: {
    paddingTop: theme.spacing.s,
  },
  emptyWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.l,
  },
  ghostCard: {
    width: "100%",
    aspectRatio: 1.586, // Standard credit card ratio
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
    backgroundColor: theme.colors.primary + "15", // 15% opacity
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
  cardWrapper: {
    width: "100%",
    marginBottom: theme.spacing.m,
  },
});
