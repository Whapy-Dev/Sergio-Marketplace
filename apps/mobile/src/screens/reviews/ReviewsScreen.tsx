import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getProductReviews,
  getProductRating,
  getRatingDistribution,
  type Review,
  type ProductRating,
  type RatingDistribution,
} from '../../services/reviews';
import StarRating from '../../components/common/StarRating';
import { COLORS } from '../../constants/theme';

export default function ReviewsScreen({ route, navigation }: any) {
  const { productId, productName } = route.params;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<ProductRating>({ average_rating: 0, total_reviews: 0 });
  const [distribution, setDistribution] = useState<RatingDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [productId]);

  async function loadData() {
    setLoading(true);
    const [reviewsData, ratingData, distributionData] = await Promise.all([
      getProductReviews(productId),
      getProductRating(productId),
      getRatingDistribution(productId),
    ]);

    setReviews(reviewsData);
    setRating(ratingData);
    setDistribution(distributionData);
    setLoading(false);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function getPercentage(count: number) {
    if (rating.total_reviews === 0) return 0;
    return Math.round((count / rating.total_reviews) * 100);
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">Opiniones</Text>
          <Text className="text-sm text-gray-600" numberOfLines={1}>
            {productName}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Resumen de calificación */}
        <View className="px-4 py-6 border-b border-gray-200">
          <View className="flex-row items-center mb-4">
            <Text className="text-5xl font-bold text-gray-900 mr-3">
              {rating.average_rating.toFixed(1)}
            </Text>
            <View>
              <StarRating rating={rating.average_rating} size={24} readonly showNumber={false} />
              <Text className="text-sm text-gray-600 mt-1">
                {rating.total_reviews} {rating.total_reviews === 1 ? 'opinión' : 'opiniones'}
              </Text>
            </View>
          </View>

          {/* Distribución de estrellas */}
          <View className="space-y-2">
            {distribution.map((item) => (
              <View key={item.rating} className="flex-row items-center">
                <Text className="text-sm text-gray-600 w-8">{item.rating}★</Text>
                <View className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                  <View
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ width: `${getPercentage(item.count)}%` }}
                  />
                </View>
                <Text className="text-sm text-gray-600 w-12 text-right">
                  {item.count}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Lista de reseñas */}
        {reviews.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12 px-6">
            <Text className="text-5xl mb-4">⭐</Text>
            <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
              Sin opiniones aún
            </Text>
            <Text className="text-base text-gray-600 text-center">
              Sé el primero en dejar una opinión sobre este producto
            </Text>
          </View>
        ) : (
          <View className="px-4 py-4">
            {reviews.map((review) => (
              <View
                key={review.id}
                className="mb-6 pb-6 border-b border-gray-200"
              >
                {/* Usuario y fecha */}
                <View className="flex-row items-start mb-3">
                  <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3">
                    {review.buyer?.avatar_url ? (
                      <Image
                        source={{ uri: review.buyer.avatar_url }}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <Text className="text-lg">👤</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">
                      {review.buyer?.full_name || 'Usuario'}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {formatDate(review.created_at)}
                    </Text>
                  </View>
                  {review.is_verified_purchase && (
                    <View className="bg-green-50 rounded-full px-2 py-1">
                      <Text className="text-xs text-green-700 font-semibold">✓ Compra verificada</Text>
                    </View>
                  )}
                </View>

                {/* Calificación */}
                <View className="mb-2">
                  <StarRating
                    rating={review.product_rating || 0}
                    size={18}
                    readonly
                  />
                </View>

                {/* Comentario */}
                {review.comment && (
                  <Text className="text-base text-gray-700 leading-6 mb-3">
                    {review.comment}
                  </Text>
                )}

                {/* Respuesta del vendedor */}
                {review.seller_response && (
                  <View className="bg-gray-50 rounded-lg p-3 ml-6 mt-3">
                    <Text className="text-sm font-semibold text-gray-900 mb-1">
                      Respuesta del vendedor:
                    </Text>
                    <Text className="text-sm text-gray-700">
                      {review.seller_response}
                    </Text>
                    {review.seller_responded_at && (
                      <Text className="text-xs text-gray-500 mt-2">
                        {formatDate(review.seller_responded_at)}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}