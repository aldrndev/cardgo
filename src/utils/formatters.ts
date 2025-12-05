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
    const value = absAmount / 1_000_000_000;
    // 2 decimal places, with dot separator (default JS behavior)
    return `${isNegative ? "-" : ""}Rp ${value
      .toFixed(2)
      .replace(/\.00$/, "")} M`;
  }

  if (absAmount >= 10_000_000) {
    // 10 Jt, 100 Jt
    const value = absAmount / 1_000_000;
    return `${isNegative ? "-" : ""}Rp ${value
      .toFixed(2)
      .replace(/\.00$/, "")} Jt`;
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
  const absAmount = Math.abs(amount);
  const isNegative = amount < 0;
  const prefix = isNegative ? "-" : "";

  // Helper to format with dot decimal, max 2 places, remove trailing zeros
  const formatVal = (val: number) => {
    // en-US uses dot for decimal.
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);
  };

  if (absAmount >= 1_000_000) {
    const val = absAmount / 1_000_000;
    return `${prefix}${currency} ${formatVal(val)}M`;
  }

  // User requested "1K - 999K DISINGKAT JADI K"
  if (absAmount >= 1_000) {
    const val = absAmount / 1_000;
    return `${prefix}${currency} ${formatVal(val)}K`;
  }

  // < 1000 -> Full number. Use en-US for dot decimal separator.
  const formattedDecimal = new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(absAmount);

  return `${prefix}${currency} ${formattedDecimal}`;
};

/**
 * Formats a number into a currency string WITHOUT abbreviations.
 * Use this for reports, exports, and anywhere exact amounts are needed.
 * @param amount The amount to format
 * @returns Exact formatted currency string (e.g., "Rp 12.500.000")
 */
export const formatCurrencyExact = (amount: number): string => {
  if (isNaN(amount)) {
    return "Rp 0";
  }
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return formatted.replace(/Rp\s?/, "Rp ");
};
