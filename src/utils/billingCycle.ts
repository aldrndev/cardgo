export const getBillingCycleRange = (billingDay: number) => {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let startMonth = currentMonth;
  let startYear = currentYear;

  // If today is before the billing day, the cycle started last month
  if (currentDay < billingDay) {
    startMonth = currentMonth - 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear = currentYear - 1;
    }
  }

  // Handle months with fewer days (e.g., billing day 31 in Feb)
  const lastDayOfStartMonth = new Date(startYear, startMonth + 1, 0).getDate();
  const actualBillingDay = Math.min(billingDay, lastDayOfStartMonth);

  const startDate = new Date(startYear, startMonth, actualBillingDay);
  startDate.setHours(0, 0, 0, 0);

  // End date is the day before the next billing day
  // Next billing day is roughly startDate + 1 month
  let endMonth = startMonth + 1;
  let endYear = startYear;
  if (endMonth > 11) {
    endMonth = 0;
    endYear = startYear + 1;
  }

  const lastDayOfEndMonth = new Date(endYear, endMonth + 1, 0).getDate();
  const actualNextBillingDay = Math.min(billingDay, lastDayOfEndMonth);

  const nextBillingDate = new Date(endYear, endMonth, actualNextBillingDay);
  nextBillingDate.setHours(0, 0, 0, 0);

  const endDate = new Date(nextBillingDate);
  endDate.setDate(endDate.getDate() - 1);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate, nextBillingDate };
};

export const formatDateRange = (startDate: Date, endDate: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };
  const startStr = startDate.toLocaleDateString("id-ID", options);
  const endStr = endDate.toLocaleDateString("id-ID", options);
  return `${startStr} - ${endStr}`;
};

/**
 * Get the current billing cycle identifier (YYYY-MM format).
 * This represents which billing cycle we are currently in.
 *
 * Example: If billing day is 10 and today is Dec 15:
 * - We are in the Dec cycle (cycle started Dec 10)
 * - Returns "2024-12"
 *
 * If billing day is 10 and today is Dec 5:
 * - We are still in the Nov cycle (cycle started Nov 10, ends Dec 9)
 * - Returns "2024-11"
 */
export const getCurrentBillingCycle = (billingDay: number): string => {
  const today = new Date();
  const currentDay = today.getDate();

  let year = today.getFullYear();
  let month = today.getMonth(); // 0-indexed

  // If today < billing day, we're still in the previous month's cycle
  if (currentDay < billingDay) {
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }

  return `${year}-${String(month + 1).padStart(2, "0")}`;
};
