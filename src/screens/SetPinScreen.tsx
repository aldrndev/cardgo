import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { moderateScale } from "../utils/responsive";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");
const PIN_LENGTH = 4;

export const SetPinScreen = () => {
  const navigation = useNavigation();
  const { setPin } = useAuth();
  const [pin, setLocalPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");

  const handlePress = async (number: string) => {
    const currentPin = step === "enter" ? pin : confirmPin;
    if (currentPin.length < PIN_LENGTH) {
      const newPin = currentPin + number;
      if (step === "enter") {
        setLocalPin(newPin);
        if (newPin.length === PIN_LENGTH) {
          setTimeout(() => setStep("confirm"), 300);
        }
      } else {
        setConfirmPin(newPin);
        if (newPin.length === PIN_LENGTH) {
          if (newPin === pin) {
            await setPin(newPin);
            Alert.alert("Sukses", "PIN berhasil dipasang", [
              { text: "OK", onPress: () => navigation.goBack() },
            ]);
          } else {
            Alert.alert("Error", "PIN tidak cocok. Silakan coba lagi.");
            setConfirmPin("");
            setLocalPin("");
            setStep("enter");
          }
        }
      }
    }
  };

  const handleDelete = () => {
    if (step === "enter") {
      setLocalPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={moderateScale(24)}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pasang PIN</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {step === "enter" ? "Masukkan PIN Baru" : "Konfirmasi PIN Baru"}
        </Text>

        <View style={styles.pinContainer}>
          {[...Array(PIN_LENGTH)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.pinDot,
                index < (step === "enter" ? pin.length : confirmPin.length) &&
                  styles.pinDotFilled,
              ]}
            />
          ))}
        </View>

        <View style={styles.keypad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
            <TouchableOpacity
              key={number}
              style={styles.key}
              onPress={() => handlePress(number.toString())}
            >
              <Text style={styles.keyText}>{number}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.key} />
          <TouchableOpacity style={styles.key} onPress={() => handlePress("0")}>
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={handleDelete}>
            <Ionicons
              name="backspace-outline"
              size={moderateScale(32)}
              color={theme.colors.text.primary}
            />
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
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginRight: theme.spacing.m,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xl * 2,
  },
  pinContainer: {
    flexDirection: "row",
    marginBottom: theme.spacing.xl * 3,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.text.secondary,
    marginHorizontal: theme.spacing.s,
  },
  pinDotFilled: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: width * 0.8,
  },
  key: {
    width: width * 0.2,
    height: width * 0.2,
    justifyContent: "center",
    alignItems: "center",
    margin: theme.spacing.s,
    borderRadius: width * 0.1,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  keyText: {
    fontSize: 28,
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
});
