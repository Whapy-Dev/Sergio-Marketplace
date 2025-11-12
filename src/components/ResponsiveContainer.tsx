import React from 'react';
import { View, ViewProps } from 'react-native';
import { useResponsive } from '../utils/useResponsive';

interface ResponsiveContainerProps extends ViewProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',   // 640px
  md: 'max-w-screen-md',   // 768px
  lg: 'max-w-screen-lg',   // 1024px
  xl: 'max-w-screen-xl',   // 1280px
  full: 'max-w-full',
};

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({ 
  children, 
  maxWidth = 'xl',
  className,
  ...props 
}) => {
  const { isWeb, isMobile } = useResponsive();

  const containerClass = isWeb 
    ? `w-full mx-auto ${maxWidthClasses[maxWidth]} ${isMobile ? 'px-4' : 'px-6 lg:px-8'}`
    : 'flex-1 px-4';

  return (
    <View className={`${containerClass} ${className || ''}`} {...props}>
      {children}
    </View>
  );
};

// Componente Grid Responsive
interface ResponsiveGridProps extends ViewProps {
  children: React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  className,
  ...props
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getGridClass = () => {
    if (isDesktop) return `grid-cols-${columns.desktop || 3}`;
    if (isTablet) return `grid-cols-${columns.tablet || 2}`;
    return `grid-cols-${columns.mobile || 1}`;
  };

  return (
    <View className={`grid ${getGridClass()} gap-4 ${className || ''}`} {...props}>
      {children}
    </View>
  );
};