/**
 * Formats a number into a currency string with abbreviations for large values.
 * @param amount The amount to format
 * @param abbreviateThreshold The threshold above which to abbreviate (default: 10,000,000)
 * - > 1,000,000,000 -> "1 M" (Miliar)
 * - > 10,000,000 -> "10 Jt" (Juta)
 * - Otherwise standard currency format
 */
export const formatCurrency = (
  amount: number,
  abbreviateThreshold: number = 10_000_000
): string => {
  if (isNaN(amount)) {
    return "Rp 0";
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  // If amount is less than the threshold, show exact number
  if (absAmount < abbreviateThreshold) {
    const formatted = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    // Ensure space after Rp
    return formatted.replace(/Rp\s?/, "Rp ");
  }

  if (absAmount >= 1_000_000_000) {
    // 1.5 M, 10 M, etc.
    const value = absAmount / 1_000_000_000;
    // Check if it's a whole number to avoid .0
    const formattedValue =
      value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
    return `${isNegative ? "-" : ""}Rp ${formattedValue} M`;
  }

  if (absAmount >= 10_000_000) {
    // 10 Jt, 100 Jt
    const value = absAmount / 1_000_000;
    const formattedValue =
      value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
    return `${isNegative ? "-" : ""}Rp ${formattedValue} Jt`;
  }

  // Fallback
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return formatted.replace(/Rp\s?/, "Rp ");
};

/**
 * Parses a numeric string from an input, removing non-numeric characters.
 */
export const parseAmount = (text: string): number => {
  return parseInt(text.replace(/[^0-9]/g, "")) || 0;
};

/**
 * Formats a number string into a format with thousands separators (dots).
 * e.g. "1000000" -> "1.000.000"
 */
export const formatNumberInput = (
  value: string | number | undefined
): string => {
  if (value === undefined || value === "" || value === null) return "";
  const num = typeof value === "string" ? parseAmount(value) : value;
  if (isNaN(num)) return "";
  return num.toLocaleString("id-ID");
};

export const formatForeignCurrency = (amount: number, currency: string) => {
  if (amount >= 1000000) {
    return `${currency} ${(amount / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (amount >= 1000) {
    return `${currency} ${(amount / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
