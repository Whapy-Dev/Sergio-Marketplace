import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function Button({
  title,
  onPress,
  loading = false,
  variant = 'primary',
  disabled = false,
  size = 'large'
}: ButtonProps) {

  const isDisabled = disabled || loading;

  const getBackgroundColor = () => {
    if (isDisabled) {
      return variant === 'outline' ? 'transparent' : '#D1D5DB';
    }
    switch (variant) {
      case 'primary': return COLORS.primary;
      case 'secondary': return '#4B5563';
      case 'outline': return 'transparent';
      default: return COLORS.primary;
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') {
      return isDisabled ? '#D1D5DB' : COLORS.primary;
    }
    return 'transparent';
  };

  const getTextColor = () => {
    if (variant === 'outline') {
      return isDisabled ? '#9CA3AF' : COLORS.primary;
    }
    return 'white';
  };

  const getPadding = () => {
    switch (size) {
      case 'small': return { paddingVertical: 10, paddingHorizontal: 16 };
      case 'medium': return { paddingVertical: 14, paddingHorizontal: 20 };
      case 'large': return { paddingVertical: 16, paddingHorizontal: 24 };
      default: return { paddingVertical: 16, paddingHorizontal: 24 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return 14;
      case 'medium': return 15;
      case 'large': return 16;
      default: return 16;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        getPadding(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 2 : 0,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size={20} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: getTextColor(),
              fontSize: getFontSize(),
            },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 48,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});