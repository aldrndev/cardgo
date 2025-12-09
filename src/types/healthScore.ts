export interface HealthScoreBreakdown {
  creditUtilization: {
    score: number; // 0-40
    percentage: number; // actual usage %
    rating: "excellent" | "good" | "fair" | "poor";
  };
  paymentHistory: {
    score: number; // 0-30
    onTimeCount: number; // last 6 months
    lateCount: number;
    rating: "excellent" | "good" | "fair" | "poor";
  };
  spendingDiscipline: {
    score: number; // 0-20
    budgetUsage: number; // % of budget used
    rating: "excellent" | "good" | "fair" | "poor";
  };
  trend: {
    score: number; // 0-10
    direction: "improving" | "stable" | "declining";
  };
}

export interface HealthScore {
  totalScore: number; // 0-100
  breakdown: HealthScoreBreakdown;
  rating: "excellent" | "good" | "fair" | "poor";
  recommendations: string[];
  lastUpdated: Date;
  hasData: boolean; // true if there are active cards to calculate score from
}
