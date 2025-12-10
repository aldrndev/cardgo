export const FREE_TIER_LIMITS = {
  MAX_CARDS: 3,
} as const;

export const PRODUCT_IDS = {
  MONTHLY: "com.cardgo.premium.monthly",
  YEARLY: "com.cardgo.premium.yearly",
  LIFETIME: "com.cardgo.premium.lifetime",
} as const;

export const PRICING = {
  MONTHLY: 15000,
  YEARLY: 120000,
  LIFETIME: 200000,
} as const;

export type SubscriptionType = "none" | "monthly" | "yearly" | "lifetime";

export interface PremiumState {
  isPremium: boolean;
  subscriptionType: SubscriptionType;
  purchaseDate?: string;
  expiryDate?: string; // null for lifetime
  isTrialActive: boolean;
  trialEndDate?: string;
}

export const DEFAULT_PREMIUM_STATE: PremiumState = {
  isPremium: false,
  subscriptionType: "none",
  isTrialActive: false,
};
