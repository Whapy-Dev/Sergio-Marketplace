import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone SE / small phone)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 667;

// Scale based on screen width
export const scale = (size: number): number => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

// Scale based on screen height
export const verticalScale = (size: number): number => {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
};

// Moderate scale - for font sizes (less aggressive scaling)
export const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

// For font sizes specifically
export const fontScale = (size: number): number => {
  const newSize = scale(size);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Screen dimensions
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

// Percentage of screen width
export const wp = (percentage: number): number => {
  return (percentage * SCREEN_WIDTH) / 100;
};

// Percentage of screen height
export const hp = (percentage: number): number => {
  return (percentage * SCREEN_HEIGHT) / 100;
};

// Check if small screen
export const isSmallScreen = SCREEN_WIDTH < 375;
export const isMediumScreen = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
export const isLargeScreen = SCREEN_WIDTH >= 414;

// Common scaled values for consistency
export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(48),
};

export const fontSize = {
  xs: moderateScale(10),
  sm: moderateScale(12),
  md: moderateScale(14),
  lg: moderateScale(16),
  xl: moderateScale(18),
  xxl: moderateScale(20),
  title: moderateScale(24),
  header: moderateScale(28),
};

export const iconSize = {
  sm: scale(16),
  md: scale(24),
  lg: scale(32),
  xl: scale(48),
};
