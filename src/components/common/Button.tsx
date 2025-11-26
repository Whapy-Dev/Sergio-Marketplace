import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { scale, moderateScale } from '../../utils/responsive';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
}

export default function Button({ 
  title, 
  onPress, 
  loading = false, 
  variant = 'primary',
  disabled = false 
}: ButtonProps) {
  
  const baseClass = "rounded-lg items-center justify-center";
  const paddingSize = { paddingVertical: scale(16), paddingHorizontal: scale(24) };
  
  const variantClasses = {
    primary: "bg-primary",
    secondary: "bg-gray-600",
    outline: "border-2 border-primary bg-transparent"
  };
  
  const textVariantClasses = {
    primary: "text-white font-semibold",
    secondary: "text-white font-semibold",
    outline: "text-primary font-semibold"
  };

  const textSize = { fontSize: moderateScale(16) };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseClass} ${variantClasses[variant]} ${(disabled || loading) ? 'opacity-50' : ''}`}
      style={paddingSize}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#2563EB' : 'white'} size={scale(24)} />
      ) : (
        <Text className={textVariantClasses[variant]} style={textSize}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}