import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RatingInputProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
  disabled?: boolean;
}

export default function RatingInput({
  rating,
  onRatingChange,
  size = 32,
  disabled = false,
}: RatingInputProps) {
  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => !disabled && onRatingChange(star)}
          disabled={disabled}
          className="p-1"
        >
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? '#FBBF24' : '#D1D5DB'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}
