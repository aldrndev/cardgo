import AsyncStorage from "@react-native-async-storage/async-storage";
import { Card } from "../types/card";
import { LimitIncreaseRecord } from "../types/limitIncrease";

const STORAGE_KEYS = {
  CARDS: "@card_go_cards",
  USER_PREFS: "@card_go_prefs",
  HAS_SEEN_ONBOARDING: "@card_go_has_seen_onboarding",
  USER_PROFILE: "@card_go_user_profile",
};

export const storage = {
  async saveCards(cards: Card[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(cards);
      await AsyncStorage.setItem(STORAGE_KEYS.CARDS, jsonValue);
    } catch (e) {
      console.error("Failed to save cards", e);
      throw e;
    }
  },

  async getCards(): Promise<Card[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.CARDS);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error("Failed to fetch cards", e);
      return [];
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error("Failed to clear storage", e);
    }
  },

  async setHasSeenOnboarding(value: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.HAS_SEEN_ONBOARDING,
        JSON.stringify(value)
      );
    } catch (e) {
      console.error("Failed to set onboarding status", e);
    }
  },

  async getHasSeenOnboarding(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(
        STORAGE_KEYS.HAS_SEEN_ONBOARDING
      );
      return value != null ? JSON.parse(value) : false;
    } catch (e) {
      console.error("Failed to get onboarding status", e);
      return false;
    }
  },

  async saveTransactions(transactions: any[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(transactions);
      await AsyncStorage.setItem("@card_go_transactions", jsonValue);
    } catch (e) {
      console.error("Failed to save transactions", e);
      throw e;
    }
  },

  async getTransactions(): Promise<any[]> {
    try {
      const jsonValue = await AsyncStorage.getItem("@card_go_transactions");
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error("Failed to fetch transactions", e);
      return [];
    }
  },

  async saveUserProfile(profile: {
    nickname: string;
    joinDate: string;
  }): Promise<void> {
    try {
      const jsonValue = JSON.stringify(profile);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, jsonValue);
    } catch (e) {
      console.error("Failed to save user profile", e);
    }
  },

  async getUserProfile(): Promise<{
    nickname: string;
    joinDate: string;
  } | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error("Failed to get user profile", e);
      return null;
    }
  },

  async saveInstallmentPlans(plans: any[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(plans);
      await AsyncStorage.setItem("@card_go_installment_plans", jsonValue);
    } catch (e) {
      console.error("Failed to save installment plans", e);
      throw e;
    }
  },

  async getInstallmentPlans(): Promise<any[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(
        "@card_go_installment_plans"
      );
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error("Failed to fetch installment plans", e);
      return [];
    }
  },

  async saveSubscriptions(subscriptions: any[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(subscriptions);
      await AsyncStorage.setItem("@card_go_subscriptions", jsonValue);
    } catch (e) {
      console.error("Failed to save subscriptions", e);
      throw e;
    }
  },

  async getSubscriptions(): Promise<any[]> {
    try {
      const jsonValue = await AsyncStorage.getItem("@card_go_subscriptions");
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error("Failed to fetch subscriptions", e);
      return [];
    }
  },

  async saveLimitIncreaseRecords(
    records: LimitIncreaseRecord[]
  ): Promise<void> {
    try {
      const jsonValue = JSON.stringify(records);
      await AsyncStorage.setItem("@card_go_limit_increases", jsonValue);
    } catch (e) {
      console.error("Failed to save limit increases", e);
      throw e;
    }
  },

  async getLimitIncreaseRecords(): Promise<LimitIncreaseRecord[]> {
    try {
      const jsonValue = await AsyncStorage.getItem("@card_go_limit_increases");
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error("Failed to fetch limit increases", e);
      return [];
    }
  },
};
