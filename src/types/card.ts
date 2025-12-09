export interface PaymentRecord {
  id: string;
  paidDate: string; // ISO date
  amount: number;
  billingCycle: string; // "2024-12" format (YYYY-MM)
  notes?: string;
  paymentType?: "full" | "minimal"; // NEW: Track payment type
}

export interface Card {
  id: string;
  alias: string;
  bankName: string;
  network?: "Visa" | "Mastercard" | "JCB" | "Amex" | "Other";
  colorTheme: string; // Hex code or gradient ID
  themeId?: string;
  tags?: string[];
  billingCycleDay: number; // 1-31
  dueDay: number; // 1-31
  creditLimit: number;
  currentUsage: number;
  monthlyBudget?: number;
  minPayment?: number;
  statementAmount?: number;
  notes?: string;
  last4?: string; // Max 4 digits
  isArchived: boolean;
  isPaid?: boolean;
  paidForCycle?: string; // "YYYY-MM" - tracks which billing cycle was paid
  paymentHistory?: PaymentRecord[]; // NEW: Track payment history
  lastPaymentDate?: string; // NEW: ISO Date of last payment
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date

  // Annual Fee
  expiryMonth?: number; // 1-12 (Month on card)
  annualFeeAmount?: number;
  isAnnualFeeReminderEnabled?: boolean;

  // Limit Increase
  limitIncreaseType?: "permanent" | "temporary";
  lastLimitIncreaseDate?: string; // ISO Date
  limitIncreaseFrequency?: number; // Months (e.g., 6)
  nextLimitIncreaseDate?: string; // Calculated ISO Date
  isLimitIncreaseReminderEnabled?: boolean;

  // Linked/Shared Limits
  bankId?: string; // Reference to Bank.id from banks.ts
  useSharedLimit?: boolean; // If true, shares creditLimit with same bankId cards
  linkedGroupId?: string; // Reference to LinkedLimitGroup (legacy)
}

export interface Subscription {
  id: string;
  cardId: string;
  name: string;
  amount: number;
  billingDay: number; // 1-31
  category: string;
  isActive: boolean;
  // New fields
  currency?: string;
  originalAmount?: number;
  exchangeRate?: number;
}

export interface Transaction {
  id: string;
  cardId: string;
  amount: number;
  date: string;
  description: string;
  category: string;
  type: "expense" | "payment";
  installmentId?: string;
  installmentNumber?: number;
  installmentTotal?: number;
  isPaid?: boolean;
  // New fields
  currency?: string;
  originalAmount?: number;
  exchangeRate?: number;
}

export interface InstallmentPlan {
  id: string;
  cardId: string;
  originalAmount: number; // Total price (e.g., 12.000.000)
  totalMonths: number; // Tenor (e.g., 12)
  monthlyAmount: number; // (e.g., 1.000.000)
  description: string; // (e.g., "iPhone 15")
  startDate: string; // ISO Date of first installment
  createdAt: string;
  // New fields
  currency?: string;
  exchangeRate?: number;
  isZeroPercent?: boolean;
  startMonth?: number; // Default 1. If 4, means starts at 4/totalMonths
}

export interface CardTheme {
  id: string;
  name: string;
  colors: [string, string, ...string[]];
  textColor: string;
}

export const CARD_THEMES: CardTheme[] = [
  {
    id: "default",
    name: "Classic Blue",
    colors: ["#1a2a6c", "#b21f1f", "#fdbb2d"],
    textColor: "#ffffff",
  },
  {
    id: "midnight",
    name: "Midnight",
    colors: ["#232526", "#414345"],
    textColor: "#ffffff",
  },
  {
    id: "royal",
    name: "Royal Gold",
    colors: ["#BF953F", "#FCF6BA", "#B38728", "#FBF5B7", "#AA771C"],
    textColor: "#000000",
  },
  {
    id: "ocean",
    name: "Ocean Breeze",
    colors: ["#2193b0", "#6dd5ed"],
    textColor: "#ffffff",
  },
  {
    id: "sunset",
    name: "Sunset",
    colors: ["#FF512F", "#DD2476"],
    textColor: "#ffffff",
  },
  {
    id: "emerald",
    name: "Emerald City",
    colors: ["#134E5E", "#71B280"],
    textColor: "#ffffff",
  },
  {
    id: "amethyst",
    name: "Amethyst",
    colors: ["#9D50BB", "#6E48AA"],
    textColor: "#ffffff",
  },
  {
    id: "ruby",
    name: "Ruby Red",
    colors: ["#D31027", "#EA384D"],
    textColor: "#ffffff",
  },
  {
    id: "slate",
    name: "Slate",
    colors: ["#434343", "#000000"],
    textColor: "#ffffff",
  },
  {
    id: "neon",
    name: "Neon Life",
    colors: ["#F093FB", "#F5576C"],
    textColor: "#ffffff",
  },
  {
    id: "teal",
    name: "Teal Wave",
    colors: ["#0D9488", "#2DD4BF"],
    textColor: "#ffffff",
  },
  {
    id: "rose",
    name: "Rose Gold",
    colors: ["#B76E79", "#F8E3E3", "#C9A0A0"],
    textColor: "#1a1a1a",
  },
  {
    id: "lavender",
    name: "Lavender Dreams",
    colors: ["#667EEA", "#764BA2"],
    textColor: "#ffffff",
  },
  {
    id: "forest",
    name: "Forest Green",
    colors: ["#11998E", "#38EF7D"],
    textColor: "#ffffff",
  },
  {
    id: "bronze",
    name: "Bronze",
    colors: ["#8D6E63", "#D7CCC8", "#8D6E63"],
    textColor: "#ffffff",
  },
  {
    id: "azure",
    name: "Azure Blue",
    colors: ["#2196F3", "#21CBF3"],
    textColor: "#ffffff",
  },
];

export type CardFormData = Omit<
  Card,
  "id" | "createdAt" | "updatedAt" | "currentUsage"
>;

export interface LinkedLimitGroup {
  id: string;
  name: string; // e.g., "BCA Main + Supplementary"
  cardIds: string[];
  sharedLimit: number;
  createdAt: string;
  updatedAt: string;
}
