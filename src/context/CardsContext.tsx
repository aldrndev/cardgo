import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  Card,
  CardFormData,
  Transaction,
  InstallmentPlan,
  PaymentRecord,
} from "../types/card";
import { Subscription } from "../types/subscription";
import { NotificationService } from "../services/NotificationService";
import { storage } from "../utils/storage";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import {
  scheduleCardReminder,
  cancelCardReminder,
} from "../utils/notifications";
import {
  getBillingCycleRange,
  getCurrentBillingCycle,
} from "../utils/billingCycle";

interface CardsContextType {
  cards: Card[];
  isLoading: boolean;
  addCard: (data: CardFormData) => Promise<void>;
  updateCard: (id: string, data: Partial<Card>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  archiveCard: (id: string, isArchived: boolean) => Promise<void>;
  refreshCards: () => Promise<void>;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  restoreData: (
    cards: Card[],
    transactions: Transaction[],
    subscriptions?: Subscription[],
    installmentPlans?: InstallmentPlan[]
  ) => Promise<void>;
  addInstallmentPlan: (
    planData: Omit<InstallmentPlan, "id" | "createdAt">,
    adminFee?: number
  ) => Promise<void>;
  installmentPlans: InstallmentPlan[];
  subscriptions: Subscription[];
  addSubscription: (
    data: Omit<Subscription, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateSubscription: (
    id: string,
    data: Partial<Subscription>
  ) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  // Payment Management
  markCardAsPaid: (
    cardId: string,
    amount?: number,
    notes?: string,
    paymentType?: "full" | "minimal",
    paidDate?: Date
  ) => Promise<void>;
  getPaymentHistory: (cardId: string) => PaymentRecord[];
  checkAndResetPaidStatus: () => Promise<void>;
  // Linked Limits
  linkedLimitGroups: any[];
  getGroupUsage: (groupId: string) => number;
  // Shared Limit by Bank
  getSharedLimitUsage: (bankId: string) => number;
  getSharedLimitInfo: (bankId: string) => {
    sharedLimit: number;
    totalUsage: number;
    cards: Card[];
  } | null;
}

const CardsContext = createContext<CardsContextType | undefined>(undefined);

export const CardsProvider = ({ children }: { children: ReactNode }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>(
    []
  );
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [linkedLimitGroups, setLinkedLimitGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCards();
  }, []);

  const calculateCardUsage = (card: Card, cardTransactions: Transaction[]) => {
    const { startDate } = getBillingCycleRange(card.billingCycleDay);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    const cycleTransactions = cardTransactions.filter((t) => {
      const tDate = new Date(t.date);
      // Only count transactions within the cycle AND already occurred (not future installments)
      return tDate >= startDate && tDate <= today;
    });

    return cycleTransactions.reduce((sum, t) => sum + t.amount, 0);
  };

  const loadCards = async () => {
    setIsLoading(true);

    // Safety timeout
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 10000); // 10 seconds max

    try {
      const [
        storedCards,
        storedTransactions,
        storedPlans,
        storedSubscriptions,
      ] = await Promise.all([
        storage.getCards(),
        storage.getTransactions(),
        storage.getInstallmentPlans(),
        storage.getSubscriptions(),
      ]);

      // Recalculate usage for all cards based on current date
      const updatedCards = storedCards.map((card) => {
        const cardTransactions = storedTransactions.filter(
          (t) => t.cardId === card.id
        );
        const usage = calculateCardUsage(card, cardTransactions);
        return { ...card, currentUsage: usage };
      });

      // If usage changed, save it back
      const hasChanges = updatedCards.some((card, index) => {
        return card.currentUsage !== storedCards[index].currentUsage;
      });

      if (hasChanges) {
        await storage.saveCards(updatedCards);
      }

      setCards(updatedCards);
      setTransactions(storedTransactions);
      setInstallmentPlans(storedPlans);
      setSubscriptions(storedSubscriptions);

      // Check and reset paid status if we've entered a NEW billing cycle
      const today = new Date();
      const cardsWithResetStatus = updatedCards.map((card) => {
        if (!card.isPaid) return card;

        const currentCycle = getCurrentBillingCycle(card.billingCycleDay);

        // Only reset if the current cycle is different from the paid cycle
        // This means we've entered a new billing cycle since payment
        if (card.paidForCycle !== currentCycle) {
          // Reschedule notifications for the new cycle
          NotificationService.schedulePaymentReminder(card);
          return {
            ...card,
            isPaid: false,
            updatedAt: today.toISOString(),
          };
        }
        return card;
      });

      const statusChanged = cardsWithResetStatus.some(
        (card, idx) => card.isPaid !== updatedCards[idx].isPaid
      );

      if (statusChanged) {
        setCards(cardsWithResetStatus);
        await storage.saveCards(cardsWithResetStatus);
      }

      // Check for due subscriptions after loading
      checkSubscriptions(
        storedSubscriptions,
        storedTransactions,
        cardsWithResetStatus
      );
    } catch (error) {
      console.error("Error loading cards:", error);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const checkSubscriptions = async (
    subs: Subscription[],
    txs: Transaction[],
    currentCards: Card[]
  ) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newTransactions: Transaction[] = [];
    let updatedSubs: Subscription[] = [];
    let hasUpdates = false;

    const subsToProcess = subs.map((sub) => ({ ...sub })); // Clone

    for (const sub of subsToProcess) {
      if (!sub.isActive) continue;

      const nextDate = new Date(sub.nextBillingDate);
      nextDate.setHours(0, 0, 0, 0);

      if (nextDate <= today) {
        // Subscription is due!
        hasUpdates = true;

        // 1. Create Transaction
        const newTx: Transaction = {
          id: uuidv4(),
          cardId: sub.cardId,
          type: "expense",
          date: new Date().toISOString(), // Charged today
          amount: sub.amount,
          category: sub.category,
          description: `Tagihan Langganan: ${sub.name}`,
          isPaid: false,
          // Multi-currency support
          currency: sub.currency,
          originalAmount: sub.originalAmount,
        };
        newTransactions.push(newTx);

        // 2. Update Next Billing Date
        const nextBilling = new Date(nextDate);
        if (sub.billingCycle === "monthly") {
          nextBilling.setMonth(nextBilling.getMonth() + 1);
        } else {
          nextBilling.setFullYear(nextBilling.getFullYear() + 1);
        }
        sub.nextBillingDate = nextBilling.toISOString();
        sub.updatedAt = new Date().toISOString();
        updatedSubs.push(sub);
      } else {
        updatedSubs.push(sub);
      }
    }

    if (hasUpdates) {
      // Save Transactions
      const allTransactions = [...newTransactions, ...txs];
      setTransactions(allTransactions);
      await storage.saveTransactions(allTransactions);

      // Save Subscriptions
      setSubscriptions(updatedSubs);
      await storage.saveSubscriptions(updatedSubs);

      // Update Card Usage
      let cardsToUpdate = [...currentCards];
      for (const tx of newTransactions) {
        const card = cardsToUpdate.find((c) => c.id === tx.cardId);
        if (card) {
          const cardTransactions = allTransactions.filter(
            (t) => t.cardId === card.id
          );
          const newUsage = calculateCardUsage(card, cardTransactions);
          cardsToUpdate = cardsToUpdate.map((c) =>
            c.id === card.id ? { ...c, currentUsage: newUsage } : c
          );
        }
      }
      setCards(cardsToUpdate);
      await storage.saveCards(cardsToUpdate);

      // Notify User (Simple alert for now, could be a toast)
      // Alert.alert("Tagihan Otomatis", `${newTransactions.length} tagihan langganan telah dicatat.`);
    }
  };

  const addCard = async (data: CardFormData) => {
    const newCard: Card = {
      ...data,
      id: uuidv4(),
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentUsage: 0, // Initial usage is 0, will be calculated if there are transactions (unlikely for new card)
    };
    const updatedCards = [...cards, newCard];
    setCards(updatedCards);
    await storage.saveCards(updatedCards);

    // Schedule reminders
    NotificationService.schedulePaymentReminder(newCard);
    NotificationService.scheduleLimitIncreaseReminder(newCard);
    NotificationService.scheduleAnnualFeeReminder(newCard);
    await scheduleCardReminder(newCard);
  };

  const updateCard = async (id: string, data: Partial<Card>) => {
    // If billing cycle day changes, we need to recalculate usage
    let updatedCards = cards.map((card) =>
      card.id === id
        ? { ...card, ...data, updatedAt: new Date().toISOString() }
        : card
    );

    if (data.billingCycleDay) {
      updatedCards = updatedCards.map((card) => {
        if (card.id === id) {
          const cardTransactions = transactions.filter(
            (t) => t.cardId === card.id
          );
          const usage = calculateCardUsage(card, cardTransactions);
          return { ...card, currentUsage: usage };
        }
        return card;
      });
    }

    setCards(updatedCards);
    await storage.saveCards(updatedCards);

    const updatedCard = updatedCards.find((c) => c.id === id);
    if (updatedCard) {
      // Reschedule reminders
      NotificationService.schedulePaymentReminder(updatedCard);
      NotificationService.scheduleLimitIncreaseReminder(updatedCard);
      NotificationService.scheduleAnnualFeeReminder(updatedCard);
      await scheduleCardReminder(updatedCard);
    }
  };

  const deleteCard = async (id: string) => {
    const updatedCards = cards.filter((card) => card.id !== id);
    setCards(updatedCards);
    await storage.saveCards(updatedCards);
    await cancelCardReminder(id);
  };

  const archiveCard = async (id: string, isArchived: boolean) => {
    await updateCard(id, { isArchived });
  };

  const addTransaction = async (data: Omit<Transaction, "id">) => {
    const newTransaction: Transaction = {
      ...data,
      id: uuidv4(),
    };
    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);
    await storage.saveTransactions(updatedTransactions);

    // Update card usage
    const card = cards.find((c) => c.id === data.cardId);
    if (card) {
      const cardTransactions = updatedTransactions.filter(
        (t) => t.cardId === card.id
      );
      const newUsage = calculateCardUsage(card, cardTransactions);

      // We use the internal update logic directly to avoid circular dependency or extra overhead
      // But here we can just use setCards since we have the full list
      const updatedCards = cards.map((c) =>
        c.id === card.id ? { ...c, currentUsage: newUsage } : c
      );
      setCards(updatedCards);
      await storage.saveCards(updatedCards);
    }

    // Check category budget alerts after adding transaction
    await NotificationService.checkCategoryBudgetAlerts(updatedTransactions);
  };

  const addInstallmentPlan = async (
    planData: Omit<InstallmentPlan, "id" | "createdAt">,
    adminFee?: number
  ) => {
    const planId = uuidv4();
    const newPlan: InstallmentPlan = {
      ...planData,
      id: planId,
      createdAt: new Date().toISOString(),
    };

    const newTransactions: Transaction[] = [];
    const startDate = new Date(planData.startDate);

    // 1. Create Installment Transactions
    const startMonthIndex = (planData.startMonth || 1) - 1; // 0-based index. If startMonth 4, we start loop at 3 (representing month 4)

    // We only create transactions for the REMAINING months
    // Example: Tenor 12, Started 3 (Start Month 4). Loop i from 3 to 11.
    // Transactions created: 4/12, 5/12 ... 12/12.
    for (let i = startMonthIndex; i < planData.totalMonths; i++) {
      const txDate = new Date(startDate);
      // We add (i - startMonthIndex) to the start date because "startDate" represents the date of the NEXT billing
      // If user says "Started 3 months ago", the startDate passed from UI is usually "Today/Next Bill".
      // Wait, let's stick to the logic: startDate is the first installment date for THIS created plan.
      txDate.setMonth(startDate.getMonth() + (i - startMonthIndex));

      newTransactions.push({
        id: uuidv4(),
        cardId: planData.cardId,
        type: "expense",
        date: txDate.toISOString(),
        amount: planData.monthlyAmount,
        category: "Cicilan",
        description: `${planData.description} (Cicilan ${i + 1}/${
          planData.totalMonths
        })`,
        isPaid: false,
        installmentId: planId,
        installmentNumber: i + 1,
        installmentTotal: planData.totalMonths,
        // Multi-currency support
        // Multi-currency support
        currency: planData.currency,
        originalAmount: planData.originalAmount,
        exchangeRate: planData.exchangeRate,
      });
    }

    // 2. Create Admin Fee Transaction (if exists)
    if (adminFee && adminFee > 0) {
      newTransactions.push({
        id: uuidv4(),
        cardId: planData.cardId,
        type: "expense",
        date: new Date().toISOString(), // Charged immediately
        amount: adminFee,
        category: "Biaya & Admin",
        description: `Biaya Admin Cicilan: ${planData.description}`,
        isPaid: false,
      });
    }

    // Update Plans
    const updatedPlans = [...installmentPlans, newPlan];
    setInstallmentPlans(updatedPlans);
    await storage.saveInstallmentPlans(updatedPlans);

    // Update Transactions
    // We add new transactions to the existing list
    const updatedTransactions = [...newTransactions, ...transactions];
    // Sort transactions by date descending is usually good, but here we just prepend.
    // Ideally we should sort them if the list relies on order.
    // For now, let's just add them.
    setTransactions(updatedTransactions);
    await storage.saveTransactions(updatedTransactions);

    // Update Card Usage (only for current billing cycle transactions)
    const card = cards.find((c) => c.id === planData.cardId);
    if (card) {
      const cardTransactions = updatedTransactions.filter(
        (t) => t.cardId === card.id
      );
      const newUsage = calculateCardUsage(card, cardTransactions);
      const updatedCards = cards.map((c) =>
        c.id === card.id ? { ...c, currentUsage: newUsage } : c
      );
      setCards(updatedCards);
      await storage.saveCards(updatedCards);
    }
  };

  const addSubscription = async (
    data: Omit<Subscription, "id" | "createdAt" | "updatedAt">
  ) => {
    const newSub: Subscription = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedSubs = [...subscriptions, newSub];
    setSubscriptions(updatedSubs);
    await storage.saveSubscriptions(updatedSubs);
  };

  const updateSubscription = async (
    id: string,
    data: Partial<Subscription>
  ) => {
    const updatedSubs = subscriptions.map((sub) =>
      sub.id === id
        ? { ...sub, ...data, updatedAt: new Date().toISOString() }
        : sub
    );
    setSubscriptions(updatedSubs);
    await storage.saveSubscriptions(updatedSubs);
  };

  const deleteSubscription = async (id: string) => {
    const updatedSubs = subscriptions.filter((sub) => sub.id !== id);
    setSubscriptions(updatedSubs);
    await storage.saveSubscriptions(updatedSubs);
  };

  const deleteTransaction = async (id: string) => {
    const transaction = transactions.find((t) => t.id === id);
    const updatedTransactions = transactions.filter((t) => t.id !== id);
    setTransactions(updatedTransactions);
    await storage.saveTransactions(updatedTransactions);

    // Revert card usage
    if (transaction) {
      const card = cards.find((c) => c.id === transaction.cardId);
      if (card) {
        const cardTransactions = updatedTransactions.filter(
          (t) => t.cardId === card.id
        );
        const newUsage = calculateCardUsage(card, cardTransactions);

        const updatedCards = cards.map((c) =>
          c.id === card.id ? { ...c, currentUsage: newUsage } : c
        );
        setCards(updatedCards);
        await storage.saveCards(updatedCards);
      }
    }
  };

  // Payment Management Functions
  const markCardAsPaid = async (
    cardId: string,
    amount?: number,
    notes?: string,
    paymentType?: "full" | "minimal",
    paidDate?: Date // User-selected payment date
  ) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    const paymentDate = paidDate || new Date();
    // Get the CURRENT billing cycle based on the card's billing day
    const currentCycle = getCurrentBillingCycle(card.billingCycleDay);

    // Calculate payment amount
    const paymentAmount = amount || card.currentUsage || 0;

    // Create payment record
    const paymentRecord: PaymentRecord = {
      id: uuidv4(),
      paidDate: paymentDate.toISOString(),
      amount: paymentAmount,
      billingCycle: currentCycle,
      notes,
      paymentType: paymentType || "full",
    };

    // Update card
    const paymentHistory = card.paymentHistory || [];
    const updatedPaymentHistory = [paymentRecord, ...paymentHistory];

    // Keep only last 24 months
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const filteredHistory = updatedPaymentHistory.filter((record) => {
      const recordDate = new Date(record.paidDate);
      return recordDate >= twoYearsAgo;
    });

    // Payment restores limit INSTANTLY
    // Full payment: usage goes to 0
    // Partial payment: usage reduced by payment amount
    const newUsage =
      paymentType === "full" || paymentAmount >= (card.currentUsage || 0)
        ? 0
        : Math.max(0, (card.currentUsage || 0) - paymentAmount);

    const isFullyPaid = newUsage === 0;

    const updatedCard: Card = {
      ...card,
      currentUsage: newUsage, // Reduce usage by payment
      isPaid: isFullyPaid,
      paidForCycle: isFullyPaid ? currentCycle : card.paidForCycle,
      lastPaymentDate: paymentDate.toISOString(),
      paymentHistory: filteredHistory,
      updatedAt: new Date().toISOString(),
    };

    const updatedCards = cards.map((c) => (c.id === cardId ? updatedCard : c));
    setCards(updatedCards);
    await storage.saveCards(updatedCards);

    // Only cancel notifications if fully paid
    if (isFullyPaid) {
      await NotificationService.cancelPaymentReminders(cardId);
    }
  };

  const getPaymentHistory = (cardId: string): PaymentRecord[] => {
    const card = cards.find((c) => c.id === cardId);
    if (!card || !card.paymentHistory) return [];

    // Return sorted by date descending (newest first)
    return [...card.paymentHistory].sort(
      (a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime()
    );
  };

  const checkAndResetPaidStatus = async () => {
    const today = new Date();

    let hasChanges = false;
    const updatedCards = cards.map((card) => {
      // Only check cards that are marked as paid
      if (!card.isPaid) return card;

      const currentCycle = getCurrentBillingCycle(card.billingCycleDay);

      // Only reset if we've entered a new billing cycle
      if (card.paidForCycle !== currentCycle) {
        hasChanges = true;
        return {
          ...card,
          isPaid: false,
          updatedAt: today.toISOString(),
        };
      }

      return card;
    });

    if (hasChanges) {
      setCards(updatedCards);
      await storage.saveCards(updatedCards);

      // Reschedule payment notifications for reset cards
      updatedCards.forEach((card) => {
        if (!card.isPaid) {
          NotificationService.schedulePaymentReminder(card);
        }
      });
    }
  };

  const restoreData = async (
    newCards: Card[],
    newTransactions: Transaction[],
    newSubscriptions: Subscription[] = [],
    newInstallmentPlans: InstallmentPlan[] = []
  ) => {
    setIsLoading(true);
    // Recalculate usage for restored data
    const updatedCards = newCards.map((card) => {
      const cardTransactions = newTransactions.filter(
        (t) => t.cardId === card.id
      );
      const usage = calculateCardUsage(card, cardTransactions);
      return { ...card, currentUsage: usage };
    });

    setCards(updatedCards);
    setTransactions(newTransactions);
    setSubscriptions(newSubscriptions);
    setInstallmentPlans(newInstallmentPlans);

    await storage.saveCards(updatedCards);
    await storage.saveTransactions(newTransactions);
    await storage.saveSubscriptions(newSubscriptions);
    await storage.saveInstallmentPlans(newInstallmentPlans);

    setIsLoading(false);
  };

  // Linked Limit Groups
  const getGroupUsage = (groupId: string): number => {
    const group = linkedLimitGroups.find((g) => g.id === groupId);
    if (!group) return 0;

    return cards
      .filter((card) => group.cardIds.includes(card.id))
      .reduce((sum, card) => sum + (card.currentUsage || 0), 0);
  };

  // Shared Limit by Bank - Get total usage for all cards with same bankId that have useSharedLimit enabled
  const getSharedLimitUsage = (bankId: string): number => {
    return cards
      .filter((c) => c.bankId === bankId && c.useSharedLimit && !c.isArchived)
      .reduce((sum, card) => sum + (card.currentUsage || 0), 0);
  };

  // Shared Limit by Bank - Get full info including the shared limit (from latest card's creditLimit)
  const getSharedLimitInfo = (bankId: string) => {
    const sharedCards = cards
      .filter((c) => c.bankId === bankId && c.useSharedLimit && !c.isArchived)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

    if (sharedCards.length === 0) return null;

    // The shared limit is the creditLimit of the most recently updated card
    const sharedLimit = sharedCards[0].creditLimit || 0;
    const totalUsage = sharedCards.reduce(
      (sum, card) => sum + (card.currentUsage || 0),
      0
    );

    return {
      sharedLimit,
      totalUsage,
      cards: sharedCards,
    };
  };

  return (
    <CardsContext.Provider
      value={{
        cards,
        isLoading,
        addCard,
        updateCard,
        deleteCard,
        archiveCard,
        refreshCards: loadCards,
        transactions,
        addTransaction,
        deleteTransaction,
        restoreData,
        addInstallmentPlan,
        installmentPlans,
        subscriptions,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        // Payment Management
        markCardAsPaid,
        getPaymentHistory,
        checkAndResetPaidStatus,
        // Linked Limits
        linkedLimitGroups,
        getGroupUsage,
        // Shared Limit by Bank
        getSharedLimitUsage,
        getSharedLimitInfo,
      }}
    >
      {children}
    </CardsContext.Provider>
  );
};

export const useCards = () => {
  const context = useContext(CardsContext);
  if (context === undefined) {
    throw new Error("useCards must be used within a CardsProvider");
  }
  return context;
};
