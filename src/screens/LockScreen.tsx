import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");
const PIN_LENGTH = 4;

export const LockScreen = () => {
  const { unlock, authenticateWithBiometrics } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    authenticateWithBiometrics();
  }, []);

  const handlePress = async (number: string) => {
    if (pin.length < PIN_LENGTH) {
      const newPin = pin + number;
      setPin(newPin);
      if (newPin.length === PIN_LENGTH) {
        const success = await unlock(newPin);
        if (!success) {
          setError(true);
          setPin("");
          setTimeout(() => setError(false), 1000);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  const handleBiometric = () => {
    authenticateWithBiometrics();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={48} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>Card Go Terkunci</Text>
        <Text style={styles.subtitle}>Masukkan PIN untuk membuka</Text>

        <View style={styles.pinContainer}>
          {[...Array(PIN_LENGTH)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.pinDot,
                index < pin.length && styles.pinDotFilled,
                error && styles.pinDotError,
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
          <TouchableOpacity style={styles.key} onPress={handleBiometric}>
            <Ionicons
              name="finger-print"
              size={32}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={() => handlePress("0")}>
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={handleDelete}>
            <Ionicons
              name="backspace-outline"
              size={32}
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
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.l,
    ...theme.shadows.medium,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.s,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
  },
  pinContainer: {
    flexDirection: "row",
    marginBottom: theme.spacing.xl * 2,
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
  pinDotError: {
    borderColor: theme.colors.status.danger,
    backgroundColor: theme.colors.status.danger,
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
