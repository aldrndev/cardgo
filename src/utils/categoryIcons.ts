import { theme } from "../constants/theme";

export const getCategoryIcon = (category: string) => {
  let iconName: any = "document-text-outline";
  let iconColor = theme.colors.primary;

  // Normalize category for matching (handle variations like "Makanan" vs "Makanan & Minuman")
  const normalizedCategory = category.toLowerCase();

  if (normalizedCategory.includes("makanan")) {
    iconName = "fast-food-outline";
    iconColor = "#F59E0B";
  } else if (normalizedCategory.includes("transportasi")) {
    iconName = "car-outline";
    iconColor = "#3B82F6";
  } else if (normalizedCategory.includes("belanja")) {
    iconName = "cart-outline";
    iconColor = "#EC4899";
  } else if (normalizedCategory.includes("tagihan")) {
    iconName = "receipt-outline";
    iconColor = "#EF4444";
  } else if (normalizedCategory.includes("hiburan")) {
    iconName = "film-outline";
    iconColor = "#8B5CF6";
  } else if (normalizedCategory.includes("kesehatan")) {
    iconName = "medkit-outline";
    iconColor = "#10B981";
  } else if (normalizedCategory.includes("pendidikan")) {
    iconName = "school-outline";
    iconColor = "#F97316";
  } else {
    iconName = "ellipsis-horizontal-circle-outline";
    iconColor = theme.colors.text.secondary;
  }

  return { iconName, iconColor };
};
