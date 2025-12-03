import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { HomeScreen } from "../screens/HomeScreen";
import { SubscriptionListScreen } from "../screens/SubscriptionListScreen";
import { CardsScreen } from "../screens/CardsScreen";
import { CalendarScreen } from "../screens/CalendarScreen";
import { InsightsScreen } from "../screens/InsightsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { theme } from "../constants/theme";
import { Text, View, StyleSheet, Platform, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

const TabIcon = ({
  icon,
  label,
  focused,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
}) => {
  const animValue = React.useRef(new Animated.Value(focused ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(animValue, {
      toValue: focused ? 1 : 0,
      useNativeDriver: false,
      friction: 6,
      tension: 50,
    }).start();
  }, [focused]);

  const containerWidth = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [44, 44],
  });

  const containerColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", theme.colors.primary],
  });

  const iconColor = focused
    ? theme.colors.text.inverse
    : theme.colors.text.tertiary;

  const labelColor = focused
    ? theme.colors.primary
    : theme.colors.text.tertiary;

  return (
    <View style={styles.tabItem}>
      <Animated.View
        style={[
          styles.iconContainer,
          {
            width: containerWidth,
            backgroundColor: containerColor,
          },
        ]}
      >
        <Ionicons name={icon} size={24} color={iconColor} />
      </Animated.View>
      <Text style={[styles.tabLabel, { color: labelColor }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          flex: 1,
          padding: 0,
          margin: 0,
        },
        tabBarIconStyle: {
          width: "100%",
          height: "100%",
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="home" label="Beranda" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="CardsTab"
        component={CardsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="card" label="Kartu" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="CalendarTab"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="calendar" label="Kalender" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="InsightsTab"
        component={InsightsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="stats-chart" label="Insight" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="settings" label="Akun" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    height: 80,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 0,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
    paddingHorizontal: 0,
  },
  iconContainer: {
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  tabLabel: {
    ...theme.typography.caption,
    fontSize: 10,
    color: theme.colors.text.tertiary,
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: -0.2,
    width: "100%",
  },
});
