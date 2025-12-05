import React, { useState, useRef } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  View,
  Text,
  Animated,
  Pressable,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { moderateScale, scale } from "../utils/responsive";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ActionItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

interface ExpandableFABProps {
  actions: ActionItem[];
  style?: ViewStyle;
}

export const ExpandableFAB = ({ actions, style }: ExpandableFABProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;

    Animated.parallel([
      Animated.spring(animation, {
        toValue,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnimation, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setIsOpen(!isOpen);
  };

  const handleActionPress = (action: ActionItem) => {
    setIsOpen(false);
    Animated.parallel([
      Animated.spring(animation, {
        toValue: 0,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(() => action.onPress(), 150);
  };

  const rotate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const ITEM_HEIGHT = 60;

  return (
    <>
      {/* Backdrop - full screen */}
      {isOpen && (
        <Pressable style={styles.backdrop} onPress={toggleMenu}>
          <Animated.View
            style={[styles.backdropOverlay, { opacity: backdropOpacity }]}
          />
        </Pressable>
      )}

      {/* FAB Container - positioned at bottom right */}
      <View style={[styles.fabWrapper, style]} pointerEvents="box-none">
        {/* Action buttons container */}
        <View style={styles.actionsContainer} pointerEvents="box-none">
          {actions.map((action, index) => {
            const translateY = animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -(index + 1) * ITEM_HEIGHT],
            });

            const itemScale = animation.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.5, 1],
            });

            const opacity = animation.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0, 1],
            });

            return (
              <Animated.View
                key={action.label}
                style={[
                  styles.actionItem,
                  {
                    transform: [{ translateY }, { scale: itemScale }],
                    opacity,
                  },
                ]}
                pointerEvents={isOpen ? "auto" : "none"}
              >
                <TouchableOpacity
                  style={styles.labelPill}
                  onPress={() => handleActionPress(action)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.labelText}>{action.label}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionCircle,
                    { backgroundColor: action.color || theme.colors.primary },
                  ]}
                  onPress={() => handleActionPress(action)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={action.icon}
                    size={moderateScale(20)}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Main FAB button */}
        <TouchableOpacity
          style={styles.mainFab}
          onPress={toggleMenu}
          activeOpacity={0.8}
        >
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="add" size={moderateScale(28)} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
};

// Simple FAB for backward compatibility
interface FloatingActionButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

export const FloatingActionButton = ({
  onPress,
  style,
}: FloatingActionButtonProps) => {
  return (
    <TouchableOpacity
      style={[styles.simpleFab, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name="add" size={moderateScale(28)} color="#FFFFFF" />
    </TouchableOpacity>
  );
};

const FAB_SIZE = moderateScale(56);
const ACTION_SIZE = moderateScale(44);
const BOTTOM_OFFSET = scale(90);
const RIGHT_OFFSET = scale(20);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 998,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
  fabWrapper: {
    position: "absolute",
    bottom: BOTTOM_OFFSET,
    right: RIGHT_OFFSET,
    zIndex: 1000,
    alignItems: "flex-end",
  },
  actionsContainer: {
    position: "absolute",
    bottom: FAB_SIZE + 10,
    right: (FAB_SIZE - ACTION_SIZE) / 2,
    alignItems: "flex-end",
  },
  actionItem: {
    position: "absolute",
    bottom: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  labelPill: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.m,
    marginRight: theme.spacing.s,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  labelText: {
    fontSize: moderateScale(13),
    color: theme.colors.text.primary,
    fontWeight: "600",
  },
  actionCircle: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: ACTION_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  mainFab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  simpleFab: {
    position: "absolute",
    bottom: BOTTOM_OFFSET,
    right: RIGHT_OFFSET,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 1000,
  },
});
