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
import { getBillingCycleRange } from "../utils/billingCycle";

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
}

const CardsContext = createContext<CardsContextType | undefined>(undefined);

export const CardsProvider = ({ children }: { children: ReactNode }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>(
    []
  );
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCards();
  }, []);

  const calculateCardUsage = (card: Card, cardTransactions: Transaction[]) => {
    const { startDate } = getBillingCycleRange(card.billingCycleDay);

    const cycleTransactions = cardTransactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= startDate;
    });

    return cycleTransactions.reduce((sum, t) => sum + t.amount, 0);
  };

  const loadCards = async () => {
    setIsLoading(true);
    const [storedCards, storedTransactions, storedPlans, storedSubscriptions] =
      await Promise.all([
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
    setIsLoading(false);

    // Check for due subscriptions after loading
    checkSubscriptions(storedSubscriptions, storedTransactions, updatedCards);
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
    for (let i = 0; i < planData.totalMonths; i++) {
      const txDate = new Date(startDate);
      txDate.setMonth(startDate.getMonth() + i);

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
