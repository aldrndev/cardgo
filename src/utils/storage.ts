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

  async saveNotificationPreferences(prefs: {
    payment: boolean;
    limitIncrease: boolean;
    annualFee: boolean;
    applicationStatus: boolean;
  }): Promise<void> {
    try {
      const jsonValue = JSON.stringify(prefs);
      await AsyncStorage.setItem("@card_go_notification_prefs", jsonValue);
    } catch (e) {
      console.error("Failed to save notification prefs", e);
    }
  },

  async getNotificationPreferences(): Promise<{
    payment: boolean;
    limitIncrease: boolean;
    annualFee: boolean;
    applicationStatus: boolean;
  }> {
    try {
      const jsonValue = await AsyncStorage.getItem(
        "@card_go_notification_prefs"
      );
      return jsonValue != null
        ? JSON.parse(jsonValue)
        : {
            payment: true,
            limitIncrease: false, // Premium feature - default off
            annualFee: false, // Premium feature - default off
            applicationStatus: true,
          };
    } catch (e) {
      console.error("Failed to fetch notification prefs", e);
      return {
        payment: true,
        limitIncrease: false, // Premium feature - default off
        annualFee: false, // Premium feature - default off
        applicationStatus: true,
      };
    }
  },
  // Custom categories with icons
  async saveCustomCategories(
    categories: { name: string; icon: string }[]
  ): Promise<void> {
    try {
      const jsonValue = JSON.stringify(categories);
      await AsyncStorage.setItem("@card_go_custom_categories", jsonValue);
    } catch (e) {
      console.error("Failed to save custom categories", e);
    }
  },

  async getCustomCategories(): Promise<{ name: string; icon: string }[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(
        "@card_go_custom_categories"
      );
      if (!jsonValue) return [];
      const parsed = JSON.parse(jsonValue);
      // Handle migration from old string[] format
      if (parsed.length > 0 && typeof parsed[0] === "string") {
        return parsed.map((name: string) => ({
          name,
          icon: "pricetag-outline",
        }));
      }
      return parsed;
    } catch (e) {
      console.error("Failed to fetch custom categories", e);
      return [];
    }
  },

  async saveDefaultCurrency(currency: string): Promise<void> {
    try {
      await AsyncStorage.setItem("@card_go_default_currency", currency);
    } catch (e) {
      console.error("Failed to save default currency", e);
    }
  },

  async getDefaultCurrency(): Promise<string> {
    try {
      const value = await AsyncStorage.getItem("@card_go_default_currency");
      return value || "IDR";
    } catch (e) {
      console.error("Failed to fetch default currency", e);
      return "IDR";
    }
  },

  async saveLinkedLimitGroups(groups: any[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(groups);
      await AsyncStorage.setItem("@card_go_linked_limits", jsonValue);
    } catch (e) {
      console.error("Failed to save linked limit groups", e);
    }
  },

  async getLinkedLimitGroups(): Promise<any[]> {
    try {
      const jsonValue = await AsyncStorage.getItem("@card_go_linked_limits");
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error("Failed to fetch linked limit groups", e);
      return [];
    }
  },

  // Category Budgets
  async saveCategoryBudgets(
    budgets: { category: string; budget: number; alertThreshold: number }[]
  ): Promise<void> {
    try {
      const jsonValue = JSON.stringify(budgets);
      await AsyncStorage.setItem("@card_go_category_budgets", jsonValue);
    } catch (e) {
      console.error("Failed to save category budgets", e);
    }
  },

  async getCategoryBudgets(): Promise<
    { category: string; budget: number; alertThreshold: number }[]
  > {
    try {
      const jsonValue = await AsyncStorage.getItem("@card_go_category_budgets");
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error("Failed to fetch category budgets", e);
      return [];
    }
  },

  // Notification sent tracking (to avoid duplicate notifications)
  async getNotificationSent(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(`@card_go_notif_${key}`);
      return value === "true";
    } catch (e) {
      console.error("Failed to get notification status", e);
      return false;
    }
  },

  async setNotificationSent(key: string, sent: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `@card_go_notif_${key}`,
        sent ? "true" : "false"
      );
    } catch (e) {
      console.error("Failed to set notification status", e);
    }
  },

  // Premium State
  async savePremiumState(state: {
    isPremium: boolean;
    subscriptionType: string;
    purchaseDate?: string;
    expiryDate?: string;
    isTrialActive: boolean;
    trialEndDate?: string;
  }): Promise<void> {
    try {
      const jsonValue = JSON.stringify(state);
      await AsyncStorage.setItem("@card_go_premium_state", jsonValue);
    } catch (e) {
      console.error("Failed to save premium state", e);
    }
  },

  async getPremiumState(): Promise<{
    isPremium: boolean;
    subscriptionType: string;
    purchaseDate?: string;
    expiryDate?: string;
    isTrialActive: boolean;
    trialEndDate?: string;
  } | null> {
    try {
      const jsonValue = await AsyncStorage.getItem("@card_go_premium_state");
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error("Failed to get premium state", e);
      return null;
    }
  },

  // Ad Cooldown (to prevent showing ads too frequently)
  async getLastAdShown(): Promise<number> {
    try {
      const value = await AsyncStorage.getItem("@card_go_last_ad_shown");
      return value ? parseInt(value, 10) : 0;
    } catch (e) {
      return 0;
    }
  },

  async setLastAdShown(timestamp: number): Promise<void> {
    try {
      await AsyncStorage.setItem(
        "@card_go_last_ad_shown",
        timestamp.toString()
      );
    } catch (e) {
      console.error("Failed to set last ad shown", e);
    }
  },
};
