import { Card } from "../types/card";

export const calculateHealthScore = (
  card: Card
): { score: number; factors: string[] } => {
  let score = 0;
  const factors: string[] = [];

  // 1. Utilization (Max 40 pts)
  const utilization =
    card.creditLimit > 0 ? (card.currentUsage / card.creditLimit) * 100 : 0;

  if (utilization === 0) {
    score += 40;
    factors.push("Belum Digunakan (+40)");
  } else if (utilization < 30) {
    score += 35;
    factors.push("Penggunaan < 30% (+35)");
  } else if (utilization < 50) {
    score += 20;
    factors.push("Penggunaan < 50% (+20)");
  } else if (utilization < 75) {
    score += 10;
    factors.push("Penggunaan < 75% (+10)");
  } else {
    factors.push("Penggunaan Tinggi (+0)");
  }

  // 2. Payment Status (Max 40 pts)
  // Since we don't have full payment history yet, we use current status
  // If statement amount is 0 or less, it means paid off or no bill
  if ((card.statementAmount || 0) <= 0) {
    score += 40;
    factors.push("Tidak Ada Tagihan (+40)");
  } else {
    // If has statement amount, check if due date is near
    // For now, we assume if not overdue, it's good
    score += 30;
    factors.push("Belum Lunas (+30)");
  }

  // 3. Budget Adherence (Max 20 pts)
  if (card.monthlyBudget && card.monthlyBudget > 0) {
    if (card.currentUsage <= card.monthlyBudget) {
      score += 20;
      factors.push("Sesuai Budget (+20)");
    } else {
      factors.push("Over Budget (+0)");
    }
  } else {
    // If no budget set, give partial points to encourage setting it?
    // Or just give full points if usage is reasonable?
    // Let's give 10 points for not having budget but being safe
    score += 10;
    factors.push("Tanpa Budget (+10)");
  }

  return { score: Math.min(100, score), factors };
};

export const getHealthColor = (score: number): string => {
  if (score >= 80) return "#4CAF50"; // Green
  if (score >= 60) return "#FFC107"; // Amber
  return "#F44336"; // Red
};
