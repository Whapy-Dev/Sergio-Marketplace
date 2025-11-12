import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export type BreakpointType = 'mobile' | 'tablet' | 'desktop';

const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
};

export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const width = dimensions.width;
  const height = dimensions.height;

  const isMobile = width < BREAKPOINTS.tablet;
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;
  const isWeb = Platform.OS === 'web';

  const breakpoint: BreakpointType = 
    width < BREAKPOINTS.tablet ? 'mobile' :
    width < BREAKPOINTS.desktop ? 'tablet' : 'desktop';

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isWeb,
    breakpoint,
    // Funciones de utilidad
    isSmallScreen: width < 640,
    isMediumScreen: width >= 640 && width < 1024,
    isLargeScreen: width >= 1024,
  };
};

// Hook para obtener clases responsive de Tailwind
export const useResponsiveClasses = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getClass = (mobileClass: string, tabletClass?: string, desktopClass?: string) => {
    if (isDesktop && desktopClass) return desktopClass;
    if (isTablet && tabletClass) return tabletClass;
    return mobileClass;
  };

  return { getClass, isMobile, isTablet, isDesktop };
};