import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

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
  
  const baseClass = "py-4 px-6 rounded-lg items-center justify-center";
  
  const variantClasses = {
    primary: "bg-primary",
    secondary: "bg-gray-600",
    outline: "border-2 border-primary bg-transparent"
  };
  
  const textVariantClasses = {
    primary: "text-white font-semibold text-base",
    secondary: "text-white font-semibold text-base",
    outline: "text-primary font-semibold text-base"
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseClass} ${variantClasses[variant]} ${(disabled || loading) ? 'opacity-50' : ''}`}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#2563EB' : 'white'} />
      ) : (
        <Text className={textVariantClasses[variant]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}