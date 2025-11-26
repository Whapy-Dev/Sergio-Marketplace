import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale } from '../../utils/responsive';
import type { Review } from '../../services/reviews';

interface ReviewItemProps {
  review: Review;
  onHelpful?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
  currentUserId?: string;
}

export default function ReviewItem({
  review,
  onHelpful,
  onReport,
  currentUserId,
}: ReviewItemProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    return (
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={scale(16)}
            color={star <= rating ? '#FBBF24' : '#D1D5DB'}
          />
        ))}
      </View>
    );
  };

  return (
    <View className="bg-white p-4 border-b border-gray-100">
      {/* Header */}
      <View className="flex-row items-center mb-3">
        {review.user?.avatar_url ? (
          <Image
            source={{ uri: review.user.avatar_url }}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
            <Ionicons name="person" size={scale(20)} color="#9CA3AF" />
          </View>
        )}
        <View className="ml-3 flex-1">
          <Text className="font-medium text-gray-900">
            {review.user?.full_name || 'Usuario'}
          </Text>
          <Text className="text-xs text-gray-500">
            {formatDate(review.created_at)}
          </Text>
        </View>
        {renderStars(review.rating)}
      </View>

      {/* Title */}
      {review.title && (
        <Text className="font-semibold text-gray-900 mb-1">{review.title}</Text>
      )}

      {/* Comment */}
      {review.comment && (
        <Text className="text-gray-700 mb-3">{review.comment}</Text>
      )}

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <View className="flex-row mb-3">
          {review.images.slice(0, 4).map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              className="w-16 h-16 rounded-md mr-2"
            />
          ))}
        </View>
      )}

      {/* Seller response */}
      {review.seller_response && (
        <View className="bg-gray-50 p-3 rounded-lg mb-3">
          <Text className="text-xs font-medium text-gray-500 mb-1">
            Respuesta del vendedor
          </Text>
          <Text className="text-gray-700 text-sm">{review.seller_response}</Text>
        </View>
      )}

      {/* Actions */}
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => onHelpful?.(review.id)}
          className="flex-row items-center"
        >
          <Ionicons name="thumbs-up-outline" size={scale(16)} color="#6B7280" />
          <Text className="text-gray-500 text-sm ml-1">
            Útil ({review.helpful_count})
          </Text>
        </TouchableOpacity>

        {currentUserId !== review.user_id && (
          <TouchableOpacity
            onPress={() => onReport?.(review.id)}
            className="flex-row items-center"
          >
            <Ionicons name="flag-outline" size={scale(16)} color="#6B7280" />
            <Text className="text-gray-500 text-sm ml-1">Reportar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
