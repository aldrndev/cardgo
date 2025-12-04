import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { AddEditCardScreen } from "../screens/AddEditCardScreen";
import { CardDetailScreen } from "../screens/CardDetailScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { AboutScreen } from "../screens/AboutScreen";
import { TransactionsListScreen } from "../screens/TransactionsListScreen";
import { AddTransactionScreen } from "../screens/AddTransactionScreen";
import { SetPinScreen } from "../screens/SetPinScreen";
import { ArchivedCardsScreen } from "../screens/ArchivedCardsScreen";
import { InsightsScreen } from "../screens/InsightsScreen";
import { CalendarScreen } from "../screens/CalendarScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { TabNavigator } from "./TabNavigator";
import { theme } from "../constants/theme";

import { StartupScreen } from "../screens/StartupScreen";
import { AddSubscriptionScreen } from "../screens/AddSubscriptionScreen";
import { SubscriptionListScreen } from "../screens/SubscriptionListScreen";
import { LimitIncreaseHistoryScreen } from "../screens/LimitIncreaseHistoryScreen";
import { PaymentHistoryScreen } from "../screens/PaymentHistoryScreen";
import { AddLimitIncreaseScreen } from "../screens/AddLimitIncreaseScreen";
import { PrivacyPolicyScreen } from "../screens/PrivacyPolicyScreen";
import { TermsScreen } from "../screens/TermsScreen";
import { BackupExportScreen } from "../screens/BackupExportScreen";

const Stack = createStackNavigator<RootStackParamList>();

import { NotificationController } from "../components/NotificationController";

// ... existing imports

export const AppNavigator = () => {
  return (
    <>
      <NotificationController />
      <Stack.Navigator
        initialRouteName="Startup"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="Startup" component={StartupScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="AddEditCard" component={AddEditCardScreen} />
        <Stack.Screen name="CardDetail" component={CardDetailScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen
          name="TransactionsList"
          component={TransactionsListScreen}
        />
        <Stack.Screen
          name="AddTransaction"
          component={AddTransactionScreen}
          options={{ title: "Tambah Transaksi" }}
        />
        <Stack.Screen
          name="AddSubscription"
          component={AddSubscriptionScreen}
        />
        <Stack.Screen
          name="SetPin"
          component={SetPinScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ArchivedCards"
          component={ArchivedCardsScreen}
          options={{ title: "Kartu Diarsipkan" }}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SubscriptionList"
          component={SubscriptionListScreen}
          options={{ title: "Langganan Saya" }}
        />
        <Stack.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{ title: "Kalender" }}
        />
        <Stack.Screen
          name="LimitIncreaseHistory"
          component={LimitIncreaseHistoryScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddLimitIncrease"
          component={AddLimitIncreaseScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PaymentHistory"
          component={PaymentHistoryScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Terms"
          component={TermsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BackupExport"
          component={BackupExportScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </>
  );
};
