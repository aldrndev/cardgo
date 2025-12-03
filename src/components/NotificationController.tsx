import React, { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/types";

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const NotificationController = () => {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        const { cardId, type } = data;

        if (cardId) {
          const cardIdString = String(cardId);
          if (type === "payment" || type === "annual") {
            // Navigate to Card Detail
            navigation.navigate("CardDetail", { cardId: cardIdString });
          } else if (type === "limit") {
            // Navigate to Limit Increase History
            navigation.navigate("LimitIncreaseHistory", {
              cardId: cardIdString,
            });
          } else if (type === "limit_status") {
            // Navigate to Limit Increase History
            navigation.navigate("LimitIncreaseHistory", {
              cardId: cardIdString,
            });
          }
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  return null; // This component doesn't render anything
};
