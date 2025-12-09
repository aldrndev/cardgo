import { Card, Transaction } from "../types/card";
import { HealthScore, HealthScoreBreakdown } from "../types/healthScore";

export const HealthScoreService = {
  /**
   * Calculate overall health score for user
   */
  calculateHealthScore(
    cards: Card[],
    transactions: Transaction[]
  ): HealthScore {
    const breakdown = this.calculateBreakdown(cards, transactions);

    const totalScore =
      breakdown.creditUtilization.score +
      breakdown.paymentHistory.score +
      breakdown.spendingDiscipline.score +
      breakdown.trend.score;

    return {
      totalScore: Math.round(totalScore),
      breakdown,
      rating: this.getRating(totalScore),
      recommendations: this.generateRecommendations(breakdown),
      lastUpdated: new Date(),
    };
  },

  /**
   * Calculate individual components
   */
  calculateBreakdown(
    cards: Card[],
    transactions: Transaction[]
  ): HealthScoreBreakdown {
    return {
      creditUtilization: this.calculateCreditUtilization(cards),
      paymentHistory: this.calculatePaymentHistory(cards),
      spendingDiscipline: this.calculateSpendingDiscipline(cards, transactions),
      trend: this.calculateTrend(cards, transactions),
    };
  },

  /**
   * Credit Utilization Score (0-40 points)
   * Excellent: <30% usage = 40 points
   * Good: 30-50% = 30-39 points
   * Fair: 50-70% = 20-29 points
   * Poor: >70% = 0-19 points
   */
  calculateCreditUtilization(cards: Card[]) {
    const activeCards = cards.filter((c) => !c.isArchived);
    if (activeCards.length === 0) {
      return { score: 0, percentage: 0, rating: "poor" as const };
    }

    const totalLimit = activeCards.reduce((sum, c) => sum + c.creditLimit, 0);
    const totalUsage = activeCards.reduce((sum, c) => sum + c.currentUsage, 0);
    const percentage = (totalUsage / totalLimit) * 100;

    let score = 0;
    let rating: "excellent" | "good" | "fair" | "poor" = "poor";

    if (percentage < 30) {
      score = 40;
      rating = "excellent";
    } else if (percentage < 50) {
      score = 30 + ((50 - percentage) / 20) * 9; // 30-39
      rating = "good";
    } else if (percentage < 70) {
      score = 20 + ((70 - percentage) / 20) * 9; // 20-29
      rating = "fair";
    } else {
      score = Math.max(0, 20 - ((percentage - 70) / 30) * 20); // 0-19
      rating = "poor";
    }

    return { score: Math.round(score), percentage, rating };
  },

  /**
   * Payment History Score (0-30 points)
   * Based on last 6 months payment records
   */
  calculatePaymentHistory(cards: Card[]) {
    const activeCards = cards.filter((c) => !c.isArchived);
    if (activeCards.length === 0) {
      return {
        score: 0,
        onTimeCount: 0,
        lateCount: 0,
        rating: "poor" as const,
      };
    }

    // Get last 6 months payment records
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    let onTimeCount = 0;
    let lateCount = 0;

    activeCards.forEach((card) => {
      if (card.paymentHistory) {
        const recentPayments = card.paymentHistory.filter(
          (p) => new Date(p.paidDate) >= sixMonthsAgo
        );

        recentPayments.forEach((p) => {
          // Check if paid on time by comparing paidDate with dueDay
          const paidDate = new Date(p.paidDate);
          const dueDate = new Date(
            paidDate.getFullYear(),
            paidDate.getMonth(),
            card.dueDay
          );

          if (paidDate <= dueDate) {
            onTimeCount++;
          } else {
            lateCount++;
          }
        });
      }
    });

    const totalPayments = onTimeCount + lateCount;
    let score = 0;
    let rating: "excellent" | "good" | "fair" | "poor" = "poor";

    if (totalPayments === 0) {
      // No payment history yet
      score = 15; // neutral
      rating = "fair";
    } else if (lateCount === 0) {
      score = 30;
      rating = "excellent";
    } else if (lateCount === 1) {
      score = 20;
      rating = "good";
    } else if (lateCount <= 3) {
      score = 10;
      rating = "fair";
    } else {
      score = 0;
      rating = "poor";
    }

    return { score, onTimeCount, lateCount, rating };
  },

  /**
   * Spending Discipline Score (0-20 points)
   * Based on budget adherence
   */
  calculateSpendingDiscipline(cards: Card[], transactions: Transaction[]) {
    const activeCards = cards.filter(
      (c) => !c.isArchived && c.monthlyBudget && c.monthlyBudget > 0
    );

    if (activeCards.length === 0) {
      return { score: 10, budgetUsage: 0, rating: "fair" as const };
    }

    // Calculate average budget usage
    const budgetUsages = activeCards.map((card) => {
      return (card.currentUsage / card.monthlyBudget!) * 100;
    });
    const avgBudgetUsage =
      budgetUsages.reduce((a, b) => a + b, 0) / budgetUsages.length;

    let score = 0;
    let rating: "excellent" | "good" | "fair" | "poor" = "poor";

    if (avgBudgetUsage <= 100) {
      score = 20;
      rating = "excellent";
    } else if (avgBudgetUsage <= 110) {
      score = 15;
      rating = "good";
    } else if (avgBudgetUsage <= 120) {
      score = 10;
      rating = "fair";
    } else {
      score = Math.max(0, 10 - (avgBudgetUsage - 120) / 10);
      rating = "poor";
    }

    return { score: Math.round(score), budgetUsage: avgBudgetUsage, rating };
  },

  /**
   * Trend Score (0-10 points)
   * Based on improvement over last 3 months
   */
  calculateTrend(cards: Card[], transactions: Transaction[]) {
    // Calculate spending trend over last 3 months
    const now = new Date();
    const months = [0, 1, 2].map((i) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      return d;
    });

    const monthlySpending = months.map((month) => {
      return transactions
        .filter((t) => {
          const txDate = new Date(t.date);
          return (
            txDate.getMonth() === month.getMonth() &&
            txDate.getFullYear() === month.getFullYear()
          );
        })
        .reduce((sum, t) => sum + t.amount, 0);
    });

    const [thisMonth, lastMonth, twoMonthsAgo] = monthlySpending;

    let direction: "improving" | "stable" | "declining" = "stable";
    let score = 5;

    // Improving = spending decreasing
    if (thisMonth < lastMonth && lastMonth < twoMonthsAgo) {
      direction = "improving";
      score = 10;
    } else if (thisMonth > lastMonth && lastMonth > twoMonthsAgo) {
      direction = "declining";
      score = 0;
    }

    return { score, direction };
  },

  /**
   * Get overall rating based on total score
   */
  getRating(score: number): "excellent" | "good" | "fair" | "poor" {
    if (score >= 80) return "excellent";
    if (score >= 60) return "good";
    if (score >= 40) return "fair";
    return "poor";
  },

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(breakdown: HealthScoreBreakdown): string[] {
    const recommendations: string[] = [];

    // Credit Utilization
    if (
      breakdown.creditUtilization.rating === "poor" ||
      breakdown.creditUtilization.rating === "fair"
    ) {
      recommendations.push(
        `Kurangi penggunaan limit ke di bawah 30% untuk skor optimal (saat ini ${breakdown.creditUtilization.percentage.toFixed(
          0
        )}%)`
      );
    }

    // Payment History
    if (breakdown.paymentHistory.lateCount > 0) {
      recommendations.push(
        "Bayar tagihan tepat waktu untuk meningkatkan riwayat pembayaran"
      );
    }

    // Spending Discipline
    if (
      breakdown.spendingDiscipline.rating === "poor" ||
      breakdown.spendingDiscipline.rating === "fair"
    ) {
      recommendations.push(
        `Kontrol pengeluaran agar sesuai budget (saat ini ${breakdown.spendingDiscipline.budgetUsage.toFixed(
          0
        )}% dari budget)`
      );
    }

    // Trend
    if (breakdown.trend.direction === "declining") {
      recommendations.push(
        "Pengeluaran meningkat, review dan kurangi spending yang tidak perlu"
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("Pertahankan kebiasaan finansial yang baik! 🎉");
    }

    return recommendations;
  },

  /**
   * Calculate health score for a single card
   * Simplified: 3 components instead of 4
   */
  calculateCardHealthScore(
    card: Card,
    transactions: Transaction[]
  ): HealthScore {
    // Credit Utilization (50 points)
    const utilizationPercentage = (card.currentUsage / card.creditLimit) * 100;
    let utilizationScore = 0;
    let utilizationRating: "excellent" | "good" | "fair" | "poor" = "poor";

    if (utilizationPercentage < 30) {
      utilizationScore = 50;
      utilizationRating = "excellent";
    } else if (utilizationPercentage < 50) {
      utilizationScore = 40 + ((50 - utilizationPercentage) / 20) * 10;
      utilizationRating = "good";
    } else if (utilizationPercentage < 70) {
      utilizationScore = 25 + ((70 - utilizationPercentage) / 20) * 15;
      utilizationRating = "fair";
    } else {
      utilizationScore = Math.max(
        0,
        25 - ((utilizationPercentage - 70) / 30) * 25
      );
      utilizationRating = "poor";
    }

    // Payment History (30 points) - for THIS card only
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    let onTimeCount = 0;
    let lateCount = 0;

    if (card.paymentHistory) {
      const recentPayments = card.paymentHistory.filter(
        (p) => new Date(p.paidDate) >= sixMonthsAgo
      );

      recentPayments.forEach((p) => {
        const paidDate = new Date(p.paidDate);
        const dueDate = new Date(
          paidDate.getFullYear(),
          paidDate.getMonth(),
          card.dueDay
        );

        if (paidDate <= dueDate) {
          onTimeCount++;
        } else {
          lateCount++;
        }
      });
    }

    const totalPayments = onTimeCount + lateCount;
    let paymentScore = 0;
    let paymentRating: "excellent" | "good" | "fair" | "poor" = "poor";

    if (totalPayments === 0) {
      paymentScore = 30; // Clean slate for new cards
      paymentRating = "excellent";
    } else if (lateCount === 0) {
      paymentScore = 30;
      paymentRating = "excellent";
    } else if (lateCount === 1) {
      paymentScore = 20;
      paymentRating = "good";
    } else if (lateCount <= 2) {
      paymentScore = 10;
      paymentRating = "fair";
    } else {
      paymentScore = 0;
      paymentRating = "poor";
    }

    // Budget Discipline (20 points) - for THIS card only
    let budgetScore = 0;
    let budgetUsage = 0;
    let budgetRating: "excellent" | "good" | "fair" | "poor" = "fair";
    const hasBudget = card.monthlyBudget && card.monthlyBudget > 0;

    if (hasBudget) {
      budgetUsage = (card.currentUsage / card.monthlyBudget!) * 100;

      if (budgetUsage <= 100) {
        budgetScore = 20;
        budgetRating = "excellent";
      } else if (budgetUsage <= 110) {
        budgetScore = 15;
        budgetRating = "good";
      } else if (budgetUsage <= 120) {
        budgetScore = 10;
        budgetRating = "fair";
      } else {
        budgetScore = Math.max(0, 10 - (budgetUsage - 120) / 10);
        budgetRating = "poor";
      }
    }

    // If no budget, redistribute weights proportionally
    // Utilization: 70
    // Payment: 30
    let finalUtilizationScore = utilizationScore;
    let finalPaymentScore = paymentScore;

    if (!hasBudget) {
      finalUtilizationScore = (utilizationScore / 50) * 70;
      finalPaymentScore = paymentScore; // Max 30
    } else {
      // With Budget: 70/20/10 split
      // Utilization 0-50 -> map to 0-70
      finalUtilizationScore = (utilizationScore / 50) * 70;
      // Payment 0-30 -> map to 0-20
      finalPaymentScore = (paymentScore / 30) * 20;
      // Budget 0-20 -> map to 0-10
      budgetScore = (budgetScore / 20) * 10;
    }

    const totalScore = Math.round(
      finalUtilizationScore + finalPaymentScore + (hasBudget ? budgetScore : 0)
    );

    // Create breakdown (trend set to neutral for single card)
    const breakdown: HealthScoreBreakdown = {
      creditUtilization: {
        score: Math.round(finalUtilizationScore),
        percentage: utilizationPercentage,
        rating: utilizationRating,
      },
      paymentHistory: {
        score: Math.round(finalPaymentScore),
        onTimeCount,
        lateCount,
        rating: paymentRating,
      },
      spendingDiscipline: {
        score: Math.round(budgetScore),
        budgetUsage,
        rating: budgetRating,
      },
      trend: {
        score: 0, // Not applicable for single card
        direction: "stable",
      },
    };

    // Generate card-specific recommendations
    const recommendations: string[] = [];

    if (utilizationRating === "poor" || utilizationRating === "fair") {
      recommendations.push(
        `Kurangi penggunaan limit ${
          card.alias
        } ke di bawah 30% (saat ini ${utilizationPercentage.toFixed(0)}%)`
      );
    }

    if (lateCount > 0) {
      recommendations.push(
        `Bayar ${card.alias} tepat waktu untuk meningkatkan skor`
      );
    }

    if (budgetRating === "poor" || budgetRating === "fair") {
      if (card.monthlyBudget && card.monthlyBudget > 0) {
        recommendations.push(
          `Kontrol spending ${card.alias} sesuai budget (${budgetUsage.toFixed(
            0
          )}% terpakai)`
        );
      } else {
        recommendations.push(
          `Set budget untuk ${card.alias} untuk tracking yang lebih baik`
        );
      }
    }

    if (recommendations.length === 0) {
      recommendations.push(`${card.alias} dalam kondisi sehat! 🎉`);
    }

    return {
      totalScore,
      breakdown,
      rating: this.getRating(totalScore),
      recommendations,
      lastUpdated: new Date(),
    };
  },
};
