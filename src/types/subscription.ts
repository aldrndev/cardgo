export interface Subscription {
  id: string;
  cardId: string;
  name: string;
  amount: number;
  originalAmount?: number;
  exchangeRate?: number;
  currency: string; // Default "IDR"
  billingCycle: "monthly" | "yearly";
  billingDay: number; // 1-31
  nextBillingDate: string; // ISO Date string
  category: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
