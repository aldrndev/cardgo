import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { storage } from "../utils/storage";
import {
  PremiumState,
  DEFAULT_PREMIUM_STATE,
  SubscriptionType,
  FREE_TIER_LIMITS,
} from "../constants/premiumConfig";
import { BillingService, PurchaseResult } from "../services/BillingService";

interface PremiumContextType extends PremiumState {
  // Status
  isLoading: boolean;

  // Actions
  checkPremiumStatus: () => Promise<void>;
  setPremiumStatus: (
    type: SubscriptionType,
    expiryDate?: string
  ) => Promise<void>;
  clearPremiumStatus: () => Promise<void>;
  purchasePremium: (productId: string) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<PurchaseResult>;

  // Feature Checks
  canAddCard: (currentCount: number) => boolean;
  canExport: () => boolean;
  canBackup: () => boolean;
  canUseLimitReminder: () => boolean;
  canUseAnnualFeeReminder: () => boolean;
  canUseAdvancedInsights: () => boolean;
  canCustomizeTheme: () => boolean;
  canUseCategoryBudget: () => boolean;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PremiumState>(DEFAULT_PREMIUM_STATE);
  const [isLoading, setIsLoading] = useState(true);

  // Load premium state on mount
  useEffect(() => {
    loadPremiumState();
  }, []);

  const loadPremiumState = async () => {
    try {
      const savedState = await storage.getPremiumState();
      if (savedState) {
        // Check if subscription has expired
        if (
          savedState.expiryDate &&
          savedState.subscriptionType !== "lifetime"
        ) {
          const expiry = new Date(savedState.expiryDate);
          if (expiry < new Date()) {
            // Subscription expired
            await storage.savePremiumState({
              ...DEFAULT_PREMIUM_STATE,
              subscriptionType: "none",
            });
            setState(DEFAULT_PREMIUM_STATE);
            setIsLoading(false);
            return;
          }
        }
        setState({
          isPremium: savedState.isPremium,
          subscriptionType: savedState.subscriptionType as SubscriptionType,
          purchaseDate: savedState.purchaseDate,
          expiryDate: savedState.expiryDate,
          isTrialActive: savedState.isTrialActive,
          trialEndDate: savedState.trialEndDate,
        });
      }
    } catch (error) {
      console.error("Failed to load premium state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPremiumStatus = useCallback(async () => {
    await loadPremiumState();
    // In a real implementation, this would also check with Google Play
    // to validate the subscription status
  }, []);

  const setPremiumStatus = useCallback(
    async (type: SubscriptionType, expiryDate?: string) => {
      const now = new Date().toISOString();
      const newState: PremiumState = {
        isPremium: type !== "none",
        subscriptionType: type,
        purchaseDate: now,
        expiryDate: type === "lifetime" ? undefined : expiryDate,
        isTrialActive: false,
        trialEndDate: undefined,
      };

      await storage.savePremiumState(newState);
      setState(newState);
    },
    []
  );

  const clearPremiumStatus = useCallback(async () => {
    await storage.savePremiumState({
      ...DEFAULT_PREMIUM_STATE,
      subscriptionType: "none",
    });
    setState(DEFAULT_PREMIUM_STATE);
  }, []);

  // Purchase premium via BillingService
  const purchasePremium = useCallback(
    async (productId: string): Promise<PurchaseResult> => {
      const result = await BillingService.purchase(productId);
      if (result.success) {
        // Reload premium state after successful purchase
        await loadPremiumState();
      }
      return result;
    },
    []
  );

  // Restore purchases via BillingService
  const restorePurchases = useCallback(async (): Promise<PurchaseResult> => {
    const result = await BillingService.restorePurchases();
    if (result.success) {
      // Reload premium state after successful restore
      await loadPremiumState();
    }
    return result;
  }, []);

  // Feature check functions
  const canAddCard = useCallback(
    (currentCount: number) => {
      return state.isPremium || currentCount < FREE_TIER_LIMITS.MAX_CARDS;
    },
    [state.isPremium]
  );

  const canExport = useCallback(() => state.isPremium, [state.isPremium]);

  const canBackup = useCallback(() => state.isPremium, [state.isPremium]);

  const canUseLimitReminder = useCallback(
    () => state.isPremium,
    [state.isPremium]
  );

  const canUseAnnualFeeReminder = useCallback(
    () => state.isPremium,
    [state.isPremium]
  );

  const canUseAdvancedInsights = useCallback(
    () => state.isPremium,
    [state.isPremium]
  );

  const canCustomizeTheme = useCallback(
    () => state.isPremium,
    [state.isPremium]
  );

  const canUseCategoryBudget = useCallback(
    () => state.isPremium,
    [state.isPremium]
  );

  const value: PremiumContextType = {
    ...state,
    isLoading,
    checkPremiumStatus,
    setPremiumStatus,
    clearPremiumStatus,
    purchasePremium,
    restorePurchases,
    canAddCard,
    canExport,
    canBackup,
    canUseLimitReminder,
    canUseAnnualFeeReminder,
    canUseAdvancedInsights,
    canCustomizeTheme,
    canUseCategoryBudget,
  };

  return (
    <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error("usePremium must be used within a PremiumProvider");
  }
  return context;
}
