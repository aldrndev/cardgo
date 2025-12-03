import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../constants/theme";
import { storage } from "../utils/storage";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/types";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    title: "Pantau Kartu Kreditmu",
    description:
      "Kelola semua kartu kredit di satu tempat. Pantau limit, tanggal cetak tagihan, dan jatuh tempo dengan mudah.",
    image: require("../assets/generated/onboarding_tracking.png"),
  },
  {
    id: "2",
    title: "Lebih Terorganisir",
    description:
      "Jangan lewatkan pembayaran. Dapatkan ringkasan status keuangan dan tagihan yang akan datang.",
    image: require("../assets/generated/onboarding_organization.png"),
  },
  {
    id: "3",
    title: "Privasi & Aman",
    description:
      "Aplikasi ini 100% offline. Semua data tersimpan aman di HP kamu, tanpa server atau database eksternal.",
    image: require("../assets/generated/onboarding_security.png"),
  },
];

type OnboardingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Onboarding"
>;

export const OnboardingScreen = () => {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [nickname, setNickname] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const handleNext = async () => {
    if (activeIndex < SLIDES.length) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      if (!nickname.trim()) {
        Alert.alert("Mohon Isi Nama", "Kami ingin menyapamu dengan akrab!");
        return;
      }
      await storage.saveUserProfile({
        nickname: nickname.trim(),
        joinDate: new Date().toISOString(),
      });
      await storage.setHasSeenOnboarding(true);
      navigation.replace("Main");
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={[
          ...SLIDES,
          {
            id: "input",
            title: "Satu Langkah Lagi",
            description: "Siapa nama panggilanmu?",
            image: require("../assets/generated/onboarding_nickname.png"),
          },
        ]}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          if (item.id === "input") {
            return (
              <View style={styles.slide}>
                <View style={styles.imageContainer}>
                  <Image
                    source={item.image}
                    style={styles.image}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.title}>Halo!</Text>
                  <Text style={styles.description}>
                    Boleh kami tahu nama panggilanmu?
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan nama panggilan"
                    value={nickname}
                    onChangeText={setNickname}
                    maxLength={20}
                    autoFocus
                    placeholderTextColor={theme.colors.text.tertiary}
                  />
                </View>
              </View>
            );
          }
          return (
            <View style={styles.slide}>
              <View style={styles.imageContainer}>
                <Image
                  source={item.image}
                  style={styles.image}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, activeIndex === index && styles.activeDot]}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>
              {activeIndex === SLIDES.length ? "Mulai Sekarang" : "Lanjut"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.m,
    alignItems: "flex-end",
  },
  slide: {
    width: width,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  imageContainer: {
    width: width * 0.8,
    height: width * 0.8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.medium,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  title: {
    ...theme.typography.h1,
    textAlign: "center",
    marginBottom: theme.spacing.m,
    color: theme.colors.primary,
  },
  description: {
    ...theme.typography.body,
    textAlign: "center",
    color: theme.colors.text.secondary,
    paddingHorizontal: theme.spacing.m,
    lineHeight: 24,
  },
  footer: {
    padding: theme.spacing.xl,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: theme.spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: theme.colors.primary,
    width: 24,
  },
  buttonContainer: {
    gap: theme.spacing.m,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    alignItems: "center",
    ...theme.shadows.medium,
  },
  buttonText: {
    ...theme.typography.button,
    color: theme.colors.text.inverse,
  },

  inputWrapper: {
    width: width,
    paddingHorizontal: theme.spacing.xl,
    alignItems: "center",
  },
  input: {
    width: "100%",
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    fontSize: 18,
    color: theme.colors.text.primary,
    textAlign: "center",
    marginTop: theme.spacing.l,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  },
});
