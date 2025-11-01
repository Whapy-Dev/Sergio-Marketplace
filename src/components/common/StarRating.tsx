import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  showNumber?: boolean;
}

export default function StarRating({
  rating,
  maxStars = 5,
  size = 20,
  onRatingChange,
  readonly = false,
  showNumber = false,
}: StarRatingProps) {
  const renderStars = () => {
    const stars = [];
    
    for (let i = 1; i <= maxStars; i++) {
      const isFullStar = i <= Math.floor(rating);
      const isHalfStar = i === Math.ceil(rating) && rating % 1 !== 0;
      
      let starIcon = '☆'; // Estrella vacía
      if (isFullStar) {
        starIcon = '⭐'; // Estrella llena
      } else if (isHalfStar) {
        starIcon = '⭐'; // Media estrella (simplificado)
      }

      if (readonly) {
        // Modo solo lectura
        stars.push(
          <Text
            key={i}
            style={{
              fontSize: size,
              color: isFullStar || isHalfStar ? '#FDB022' : '#D1D5DB',
            }}
          >
            {starIcon}
          </Text>
        );
      } else {
        // Modo interactivo
        stars.push(
          <TouchableOpacity
            key={i}
            onPress={() => onRatingChange?.(i)}
            style={{ marginHorizontal: 2 }}
          >
            <Text
              style={{
                fontSize: size,
                color: i <= rating ? '#FDB022' : '#D1D5DB',
              }}
            >
              {i <= rating ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        );
      }
    }
    
    return stars;
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {renderStars()}
      {showNumber && rating > 0 && (
        <Text
          style={{
            marginLeft: 6,
            fontSize: size * 0.8,
            color: '#6B7280',
            fontWeight: '600',
          }}
        >
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
}