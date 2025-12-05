import { Dimensions, PixelRatio } from "react-native";

const { width, height } = Dimensions.get("window");

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

// Tablet detection (width > 768px is typically tablet)
const isTablet = width >= 768;

// Max content width for better readability on large screens
const maxContentWidth = isTablet ? 600 : width;

// Get responsive horizontal padding for centering content on tablets
const getResponsiveHorizontalPadding = () => {
  if (width >= 1024) {
    return (width - 700) / 2; // Large tablets/desktop
  } else if (width >= 768) {
    return (width - 550) / 2; // iPad
  }
  return 16; // Mobile
};

export {
  scale,
  verticalScale,
  moderateScale,
  width,
  height,
  isTablet,
  maxContentWidth,
  getResponsiveHorizontalPadding,
};
