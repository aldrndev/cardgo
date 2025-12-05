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
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../constants/theme";
import { storage } from "../utils/storage";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/types";

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
  const { width } = useWindowDimensions();
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [nickname, setNickname] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const allSlides = [
    ...SLIDES,
    {
      id: "input",
      title: "Satu Langkah Lagi",
      description: "Siapa nama panggilanmu?",
      image: require("../assets/generated/onboarding_nickname.png"),
    },
  ];

  React.useEffect(() => {
    if (activeIndex === allSlides.length - 1) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeIndex]);

  const handleNext = async () => {
    if (activeIndex < allSlides.length - 1) {
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <FlatList
          ref={flatListRef}
          data={allSlides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            const slideSize = event.nativeEvent.layoutMeasurement.width;
            const index = event.nativeEvent.contentOffset.x / slideSize;
            const roundIndex = Math.round(index);
            if (roundIndex !== activeIndex) {
              setActiveIndex(roundIndex);
            }
          }}
          scrollEventThrottle={16}
          getItemLayout={(data, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          renderItem={({ item, index }) => {
            if (item.id === "input") {
              return (
                <View style={[styles.slide, { width }]}>
                  <View
                    style={[
                      styles.imageContainer,
                      {
                        width: width * 0.8,
                        height: width * 0.8,
                        maxHeight: 300,
                        maxWidth: 300,
                      },
                    ]}
                  >
                    <Image
                      source={item.image}
                      style={styles.image}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={[styles.inputWrapper, { width }]}>
                    <Text style={styles.title}>Halo!</Text>
                    <Text style={styles.description}>
                      Boleh kami tahu nama panggilanmu?
                    </Text>
                    <TextInput
                      ref={inputRef}
                      style={styles.input}
                      placeholder="Masukkan nama panggilan"
                      value={nickname}
                      onChangeText={setNickname}
                      maxLength={20}
                      placeholderTextColor={theme.colors.text.tertiary}
                    />
                  </View>
                </View>
              );
            }
            return (
              <View style={[styles.slide, { width }]}>
                <View
                  style={[
                    styles.imageContainer,
                    {
                      width: width * 0.8,
                      height: width * 0.8,
                      maxHeight: 300,
                      maxWidth: 300,
                    },
                  ]}
                >
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
            {allSlides.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, activeIndex === index && styles.activeDot]}
              />
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                Platform.OS === "web" && ({ cursor: "pointer" } as any),
              ]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {activeIndex === allSlides.length - 1
                  ? "Mulai Sekarang"
                  : "Lanjut"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  imageContainer: {
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
    backgroundColor: theme.colors.background, // Ensure background is opaque
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
