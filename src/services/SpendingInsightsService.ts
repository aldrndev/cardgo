import { Card, Transaction } from "../types/card";

// Insight types
export interface SpendingInsight {
  id: string;
  type:
    | "unusual_spending"
    | "category_trend"
    | "budget_warning"
    | "savings_tip"
    | "milestone"
    | "month_comparison";
  title: string;
  description: string;
  category?: string;
  amount?: number;
  percentageChange?: number;
  severity: "info" | "warning" | "success";
  actionable: boolean;
  icon: string;
}

export interface CategoryBudget {
  category: string;
  budget: number;
  alertThreshold: number;
}

// Helper function for compact currency format
const formatCompact = (amount: number): string => {
  if (amount >= 1000000000) {
    return `Rp ${(amount / 1000000000).toFixed(1)} M`;
  } else if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(1)} Jt`;
  } else if (amount >= 1000) {
    return `Rp ${(amount / 1000).toFixed(0)} Rb`;
  }
  return `Rp ${amount}`;
};

export const SpendingInsightsService = {
  /**
   * Generate all insights based on transactions and cards
   */
  generateInsights(
    transactions: Transaction[],
    cards: Card[],
    budgets: CategoryBudget[] = []
  ): SpendingInsight[] {
    const insights: SpendingInsight[] = [];

    // Detect unusual spending patterns
    insights.push(...this.detectUnusualSpending(transactions));

    // Analyze month-over-month changes
    insights.push(...this.analyzeMonthOverMonth(transactions));

    // Check budget status
    insights.push(...this.checkBudgetStatus(transactions, budgets));

    // Generate savings tips
    insights.push(...this.generateSavingsTips(transactions, cards));

    // Check for spending milestones
    insights.push(...this.checkMilestones(transactions, cards));

    // Sort by severity (warnings first, then info, then success)
    const severityOrder = { warning: 0, info: 1, success: 2 };
    insights.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );

    return insights;
  },

  /**
   * Detect unusual spending - categories with significantly higher spending than average
   */
  detectUnusualSpending(transactions: Transaction[]): SpendingInsight[] {
    const insights: SpendingInsight[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get transactions from current month
    const currentMonthTx = transactions.filter((t) => {
      const txDate = new Date(t.date);
      return (
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear
      );
    });

    // Get transactions from last 3 months for average
    const threeMonthsAgo = new Date(currentYear, currentMonth - 3, 1);
    const historicalTx = transactions.filter((t) => {
      const txDate = new Date(t.date);
      return (
        txDate >= threeMonthsAgo &&
        !(
          txDate.getMonth() === currentMonth &&
          txDate.getFullYear() === currentYear
        )
      );
    });

    // Calculate average spending per category (last 3 months)
    const categoryAverages: Record<string, number> = {};
    const categoryHistoricalTotals: Record<string, number> = {};

    historicalTx.forEach((t) => {
      const cat = t.category || "Lainnya";
      categoryHistoricalTotals[cat] =
        (categoryHistoricalTotals[cat] || 0) + t.amount;
    });

    // Divide by 3 to get monthly average
    Object.keys(categoryHistoricalTotals).forEach((cat) => {
      categoryAverages[cat] = categoryHistoricalTotals[cat] / 3;
    });

    // Calculate current month spending per category
    const currentCategoryTotals: Record<string, number> = {};
    currentMonthTx.forEach((t) => {
      const cat = t.category || "Lainnya";
      currentCategoryTotals[cat] = (currentCategoryTotals[cat] || 0) + t.amount;
    });

    // Detect categories with 50%+ higher spending than average
    Object.entries(currentCategoryTotals).forEach(([category, amount]) => {
      const average = categoryAverages[category] || 0;
      if (average > 0) {
        const percentageChange = ((amount - average) / average) * 100;

        if (percentageChange >= 50) {
          insights.push({
            id: `unusual-${category}`,
            type: "unusual_spending",
            title: `Pengeluaran ${category} Meningkat`,
            description: `Pengeluaran ${category} bulan ini ${Math.round(
              percentageChange
            )}% lebih tinggi dari rata-rata 3 bulan terakhir.`,
            category,
            amount,
            percentageChange,
            severity: percentageChange >= 100 ? "warning" : "info",
            actionable: true,
            icon: "trending-up",
          });
        }
      }
    });

    return insights;
  },

  /**
   * Analyze month-over-month spending changes
   */
  analyzeMonthOverMonth(transactions: Transaction[]): SpendingInsight[] {
    const insights: SpendingInsight[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Current month spending
    const currentMonthTotal = transactions
      .filter((t) => {
        const txDate = new Date(t.date);
        return (
          txDate.getMonth() === currentMonth &&
          txDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // Last month spending
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthTotal = transactions
      .filter((t) => {
        const txDate = new Date(t.date);
        return (
          txDate.getMonth() === lastMonth &&
          txDate.getFullYear() === lastMonthYear
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    if (lastMonthTotal > 0) {
      const percentageChange =
        ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;

      if (Math.abs(percentageChange) >= 10) {
        const isIncrease = percentageChange > 0;
        insights.push({
          id: "mom-comparison",
          type: "month_comparison",
          title: isIncrease
            ? "Pengeluaran Bulan Ini Naik"
            : "Pengeluaran Bulan Ini Turun",
          description: `Total pengeluaran ${Math.abs(
            Math.round(percentageChange)
          )}% ${isIncrease ? "lebih tinggi" : "lebih rendah"} dari bulan lalu.`,
          amount: currentMonthTotal,
          percentageChange,
          severity: isIncrease ? "warning" : "success",
          actionable: isIncrease,
          icon: isIncrease ? "arrow-up-circle" : "arrow-down-circle",
        });
      }
    }

    return insights;
  },

  /**
   * Check budget status for each category
   */
  checkBudgetStatus(
    transactions: Transaction[],
    budgets: CategoryBudget[]
  ): SpendingInsight[] {
    const insights: SpendingInsight[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Current month spending per category
    const categoryTotals: Record<string, number> = {};
    transactions
      .filter((t) => {
        const txDate = new Date(t.date);
        return (
          txDate.getMonth() === currentMonth &&
          txDate.getFullYear() === currentYear
        );
      })
      .forEach((t) => {
        const cat = t.category || "Lainnya";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
      });

    // Check each budget
    budgets.forEach((budget) => {
      const spent = categoryTotals[budget.category] || 0;
      const percentage = (spent / budget.budget) * 100;

      if (percentage >= 100) {
        insights.push({
          id: `budget-over-${budget.category}`,
          type: "budget_warning",
          title: `Budget ${budget.category} Terlampaui!`,
          description: `Pengeluaran sudah ${Math.round(
            percentage
          )}% dari budget. Pertimbangkan untuk mengurangi pengeluaran.`,
          category: budget.category,
          amount: spent,
          percentageChange: percentage - 100,
          severity: "warning",
          actionable: true,
          icon: "alert-circle",
        });
      } else if (percentage >= budget.alertThreshold) {
        insights.push({
          id: `budget-warning-${budget.category}`,
          type: "budget_warning",
          title: `Budget ${budget.category} Hampir Habis`,
          description: `Sudah terpakai ${Math.round(percentage)}% dari budget ${
            budget.category
          }.`,
          category: budget.category,
          amount: spent,
          percentageChange: percentage,
          severity: "info",
          actionable: true,
          icon: "warning",
        });
      }
    });

    return insights;
  },

  /**
   * Generate savings tips based on spending patterns
   */
  generateSavingsTips(
    transactions: Transaction[],
    cards: Card[]
  ): SpendingInsight[] {
    const insights: SpendingInsight[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Current month spending per category
    const categoryTotals: Record<string, number> = {};
    const currentMonthTx = transactions.filter((t) => {
      const txDate = new Date(t.date);
      return (
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear
      );
    });

    currentMonthTx.forEach((t) => {
      const cat = t.category || "Lainnya";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
    });

    // Find top spending categories
    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    // Suggest savings for discretionary categories
    const discretionaryCategories = [
      "Food & Drink",
      "Entertainment",
      "Shopping",
      "Online Shopping",
      "Belanja",
      "Hiburan",
      "Makanan",
    ];

    sortedCategories.forEach(([category, amount]) => {
      if (
        discretionaryCategories.some((dc) =>
          category.toLowerCase().includes(dc.toLowerCase())
        )
      ) {
        const potentialSavings = Math.round(amount * 0.2); // 20% potential savings
        if (potentialSavings > 50000) {
          // Only show if savings > 50k
          insights.push({
            id: `savings-${category}`,
            type: "savings_tip",
            title: `Potensi Hemat di ${category}`,
            description: `Kurangi 20% pengeluaran ${category} untuk hemat sekitar ${formatCompact(
              potentialSavings
            )}/bulan.`,
            category,
            amount: potentialSavings,
            severity: "info",
            actionable: true,
            icon: "bulb",
          });
        }
      }
    });

    return insights;
  },

  /**
   * Check for spending milestones
   */
  checkMilestones(
    transactions: Transaction[],
    cards: Card[]
  ): SpendingInsight[] {
    const insights: SpendingInsight[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Current month spending
    const currentMonthTotal = transactions
      .filter((t) => {
        const txDate = new Date(t.date);
        return (
          txDate.getMonth() === currentMonth &&
          txDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // Total limit across all cards
    const totalLimit = cards
      .filter((c) => !c.isArchived)
      .reduce((sum, c) => sum + c.creditLimit, 0);

    if (totalLimit > 0) {
      const usagePercentage = (currentMonthTotal / totalLimit) * 100;

      if (usagePercentage < 30) {
        insights.push({
          id: "milestone-low-usage",
          type: "milestone",
          title: "Penggunaan Limit Sehat! 🎉",
          description: `Penggunaan limit hanya ${Math.round(
            usagePercentage
          )}%. Pertahankan kebiasaan baik ini!`,
          percentageChange: usagePercentage,
          severity: "success",
          actionable: false,
          icon: "checkmark-circle",
        });
      } else if (usagePercentage >= 70) {
        insights.push({
          id: "milestone-high-usage",
          type: "milestone",
          title: "Penggunaan Limit Tinggi",
          description: `Penggunaan limit sudah ${Math.round(
            usagePercentage
          )}%. Pertimbangkan untuk mengurangi pengeluaran.`,
          percentageChange: usagePercentage,
          severity: "warning",
          actionable: true,
          icon: "alert-circle",
        });
      }
    }

    return insights;
  },

  /**
   * Get insight icon name for Ionicons
   */
  getInsightIcon(type: SpendingInsight["type"]): string {
    switch (type) {
      case "unusual_spending":
        return "trending-up";
      case "category_trend":
        return "analytics";
      case "budget_warning":
        return "alert-circle";
      case "savings_tip":
        return "bulb";
      case "milestone":
        return "trophy";
      case "month_comparison":
        return "swap-vertical";
      default:
        return "information-circle";
    }
  },

  /**
   * Get severity color
   */
  getSeverityColor(severity: SpendingInsight["severity"], theme: any): string {
    switch (severity) {
      case "warning":
        return theme.colors.status.warning || "#F59E0B";
      case "success":
        return theme.colors.status.success || "#10B981";
      case "info":
      default:
        return theme.colors.primary || "#6366F1";
    }
  },
};
