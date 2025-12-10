/**
 * Billing Service - Skeleton Implementation
 *
 * This service handles Google Play Billing (In-App Purchases).
 * Actual purchases only work when ENABLE_BILLING is true.
 *
 * Dependencies to install when ready:
 * npm install react-native-iap
 */

import { MONETIZATION_CONFIG } from "../config/monetization";
import { storage } from "../utils/storage";
import { PremiumState, SubscriptionType } from "../constants/premiumConfig";

// Product types
export interface Product {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
}

// Purchase result
export interface PurchaseResult {
  success: boolean;
  productId?: string;
  transactionId?: string;
  error?: string;
}

class BillingServiceClass {
  private isInitialized = false;
  private products: Product[] = [];

  /**
   * Initialize billing connection
   * Call this in App.tsx on startup
   */
  async initialize(): Promise<void> {
    if (!MONETIZATION_CONFIG.ENABLE_BILLING) {
      console.log("[Billing] Billing disabled - skipping initialization");
      return;
    }

    if (this.isInitialized) {
      return;
    }

    try {
      // TODO: Uncomment when react-native-iap is installed
      // const RNIap = require('react-native-iap');
      // await RNIap.initConnection();

      this.isInitialized = true;
      console.log("[Billing] Connection initialized successfully");

      // Load products
      await this.loadProducts();
    } catch (error) {
      console.error("[Billing] Failed to initialize:", error);
    }
  }

  /**
   * Load available products from Play Store
   */
  async loadProducts(): Promise<Product[]> {
    if (!MONETIZATION_CONFIG.ENABLE_BILLING) {
      // Return mock products for testing
      return this.getMockProducts();
    }

    try {
      const skus = [
        MONETIZATION_CONFIG.SKU_MONTHLY,
        MONETIZATION_CONFIG.SKU_YEARLY,
        MONETIZATION_CONFIG.SKU_LIFETIME,
      ];

      // TODO: Uncomment when react-native-iap is installed
      /*
      const RNIap = require('react-native-iap');
      const products = await RNIap.getProducts({ skus });
      
      this.products = products.map((p: any) => ({
        productId: p.productId,
        title: p.title,
        description: p.description,
        price: p.localizedPrice,
        priceAmount: parseFloat(p.price),
        currency: p.currency,
      }));
      */

      return this.products;
    } catch (error) {
      console.error("[Billing] Failed to load products:", error);
      return [];
    }
  }

  /**
   * Purchase a product
   */
  async purchase(productId: string): Promise<PurchaseResult> {
    if (!MONETIZATION_CONFIG.ENABLE_BILLING) {
      console.log("[Billing] Billing disabled - simulating purchase");
      // Simulate successful purchase for testing
      await this.simulatePurchase(productId);
      return {
        success: true,
        productId,
        transactionId: "mock-transaction-" + Date.now(),
      };
    }

    try {
      console.log("[Billing] Initiating purchase:", productId);

      // TODO: Uncomment when react-native-iap is installed
      /*
      const RNIap = require('react-native-iap');
      
      // For subscriptions
      if (productId.includes('monthly') || productId.includes('yearly')) {
        const purchase = await RNIap.requestSubscription({ sku: productId });
        await this.handleSuccessfulPurchase(productId, purchase.transactionId);
        return {
          success: true,
          productId,
          transactionId: purchase.transactionId,
        };
      }
      
      // For one-time purchases (lifetime)
      const purchase = await RNIap.requestPurchase({ sku: productId });
      await this.handleSuccessfulPurchase(productId, purchase.transactionId);
      return {
        success: true,
        productId,
        transactionId: purchase.transactionId,
      };
      */

      return { success: false, error: "Billing not implemented yet" };
    } catch (error: any) {
      console.error("[Billing] Purchase failed:", error);
      return {
        success: false,
        error: error.message || "Purchase failed",
      };
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<PurchaseResult> {
    if (!MONETIZATION_CONFIG.ENABLE_BILLING) {
      console.log("[Billing] Billing disabled - cannot restore");
      return { success: false, error: "Billing not enabled" };
    }

    try {
      console.log("[Billing] Restoring purchases...");

      // TODO: Uncomment when react-native-iap is installed
      /*
      const RNIap = require('react-native-iap');
      const purchases = await RNIap.getAvailablePurchases();
      
      if (purchases.length > 0) {
        // Find the most valuable purchase
        const sortedPurchases = purchases.sort((a, b) => {
          const priority = { lifetime: 3, yearly: 2, monthly: 1 };
          const aPriority = a.productId.includes('lifetime') ? 3 : 
                          a.productId.includes('yearly') ? 2 : 1;
          const bPriority = b.productId.includes('lifetime') ? 3 : 
                          b.productId.includes('yearly') ? 2 : 1;
          return bPriority - aPriority;
        });
        
        const bestPurchase = sortedPurchases[0];
        await this.handleSuccessfulPurchase(bestPurchase.productId, bestPurchase.transactionId);
        
        return {
          success: true,
          productId: bestPurchase.productId,
          transactionId: bestPurchase.transactionId,
        };
      }
      */

      return { success: false, error: "No purchases to restore" };
    } catch (error: any) {
      console.error("[Billing] Restore failed:", error);
      return {
        success: false,
        error: error.message || "Restore failed",
      };
    }
  }

  /**
   * Handle successful purchase - update premium state
   */
  private async handleSuccessfulPurchase(
    productId: string,
    transactionId: string
  ): Promise<void> {
    const subscriptionType = this.getSubscriptionTypeFromProductId(productId);
    const expiryDate = this.calculateExpiryDate(subscriptionType);

    const premiumState: PremiumState = {
      isPremium: true,
      subscriptionType,
      purchaseDate: new Date().toISOString(),
      expiryDate: expiryDate?.toISOString(),
      isTrialActive: false,
      trialEndDate: undefined,
    };

    await storage.savePremiumState(premiumState);
    console.log("[Billing] Premium state saved:", premiumState);
  }

  /**
   * Simulate purchase for dev testing
   */
  private async simulatePurchase(productId: string): Promise<void> {
    await this.handleSuccessfulPurchase(
      productId,
      "mock-" + Date.now().toString()
    );
  }

  /**
   * Get subscription type from product ID
   */
  private getSubscriptionTypeFromProductId(
    productId: string
  ): SubscriptionType {
    if (productId.includes("lifetime")) return "lifetime";
    if (productId.includes("yearly")) return "yearly";
    return "monthly";
  }

  /**
   * Calculate expiry date based on subscription type
   */
  private calculateExpiryDate(
    subscriptionType: SubscriptionType
  ): Date | undefined {
    if (subscriptionType === "lifetime") return undefined;

    const now = new Date();
    if (subscriptionType === "yearly") {
      now.setFullYear(now.getFullYear() + 1);
    } else {
      now.setMonth(now.getMonth() + 1);
    }
    return now;
  }

  /**
   * Get mock products for testing
   */
  private getMockProducts(): Product[] {
    return [
      {
        productId: MONETIZATION_CONFIG.SKU_MONTHLY,
        title: "Premium Bulanan",
        description: "Akses semua fitur premium selama 1 bulan",
        price: "Rp 29.000",
        priceAmount: 29000,
        currency: "IDR",
      },
      {
        productId: MONETIZATION_CONFIG.SKU_YEARLY,
        title: "Premium Tahunan",
        description: "Akses semua fitur premium selama 1 tahun (hemat 50%)",
        price: "Rp 149.000",
        priceAmount: 149000,
        currency: "IDR",
      },
      {
        productId: MONETIZATION_CONFIG.SKU_LIFETIME,
        title: "Premium Selamanya",
        description: "Akses semua fitur premium selamanya",
        price: "Rp 299.000",
        priceAmount: 299000,
        currency: "IDR",
      },
    ];
  }

  /**
   * Get available products
   */
  getProducts(): Product[] {
    if (!MONETIZATION_CONFIG.ENABLE_BILLING) {
      return this.getMockProducts();
    }
    return this.products;
  }

  /**
   * Check if billing is enabled
   */
  isEnabled(): boolean {
    return MONETIZATION_CONFIG.ENABLE_BILLING;
  }

  /**
   * Cleanup connection
   */
  async cleanup(): Promise<void> {
    if (!MONETIZATION_CONFIG.ENABLE_BILLING || !this.isInitialized) {
      return;
    }

    try {
      // TODO: Uncomment when react-native-iap is installed
      // const RNIap = require('react-native-iap');
      // await RNIap.endConnection();
      this.isInitialized = false;
    } catch (error) {
      console.error("[Billing] Cleanup error:", error);
    }
  }
}

// Export singleton instance
export const BillingService = new BillingServiceClass();
