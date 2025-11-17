import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { createReview } from '../../services/reviews';
import StarRating from '../../components/common/StarRating';
import { COLORS } from '../../constants/theme';

export default function CreateReviewScreen({ route, navigation }: any) {
  const { product, orderItemId, sellerId } = route.params;
  const { user } = useAuth();
  const [productRating, setProductRating] = useState(0);
  const [sellerRating, setSellerRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (productRating === 0) {
      Alert.alert('Error', 'Por favor, califica el producto');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión');
      return;
    }

    setSubmitting(true);

    try {
      const result = await createReview({
        productId: product.id,
        sellerId: sellerId,
        buyerId: user.id,
        orderItemId: orderItemId,
        productRating: productRating,
        sellerRating: sellerRating > 0 ? sellerRating : undefined,
        comment: comment.trim() || undefined,
      });

      if (result.success) {
        Alert.alert(
          '¡Gracias! ⭐',
          'Tu reseña ha sido publicada',
          [
            {
              text: 'Ver producto',
              onPress: () => {
                navigation.navigate('ProductDetail', { productId: product.id });
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo publicar la reseña');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Ocurrió un error al publicar la reseña');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Dejar reseña</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4 py-6">
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-2">Producto</Text>
            <View className="bg-gray-50 rounded-xl p-4">
              <Text className="text-base font-semibold text-gray-900">
                {product.name}
              </Text>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-2">
              Califica el producto *
            </Text>
            <Text className="text-sm text-gray-600 mb-3">
              ¿Qué te pareció el producto?
            </Text>
            <View className="items-center py-4">
              <StarRating
                rating={productRating}
                size={40}
                onRatingChange={setProductRating}
                readonly={false}
              />
              {productRating > 0 && (
                <Text className="text-gray-600 mt-2 text-base">
                  {productRating === 1 && 'Muy malo'}
                  {productRating === 2 && 'Malo'}
                  {productRating === 3 && 'Regular'}
                  {productRating === 4 && 'Bueno'}
                  {productRating === 5 && 'Excelente'}
                </Text>
              )}
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-2">
              Califica al vendedor (opcional)
            </Text>
            <Text className="text-sm text-gray-600 mb-3">
              ¿Cómo fue tu experiencia con el vendedor?
            </Text>
            <View className="items-center py-4">
              <StarRating
                rating={sellerRating}
                size={36}
                onRatingChange={setSellerRating}
                readonly={false}
              />
              {sellerRating > 0 && (
                <Text className="text-gray-600 mt-2 text-sm">
                  {sellerRating === 1 && 'Muy malo'}
                  {sellerRating === 2 && 'Malo'}
                  {sellerRating === 3 && 'Regular'}
                  {sellerRating === 4 && 'Bueno'}
                  {sellerRating === 5 && 'Excelente'}
                </Text>
              )}
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-2">
              Cuéntanos más (opcional)
            </Text>
            <Text className="text-sm text-gray-600 mb-3">
              ¿Qué te gustó o no te gustó?
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Escribe tu opinión aquí..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              maxLength={500}
              className="bg-gray-50 rounded-xl px-4 py-3 text-base text-gray-900 border border-gray-200"
              style={{ textAlignVertical: 'top', minHeight: 120 }}
            />
            <Text className="text-xs text-gray-500 mt-2 text-right">
              {comment.length}/500
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || productRating === 0}
            className="rounded-xl py-4 mb-6"
            style={{
              backgroundColor:
                submitting || productRating === 0 ? '#D1D5DB' : COLORS.primary,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-bold text-center text-base">
                Publicar reseña
              </Text>
            )}
          </TouchableOpacity>

          <View className="bg-blue-50 rounded-xl p-4 mb-6">
            <Text className="text-sm text-blue-900">
              💡 <Text className="font-semibold">Nota:</Text> Tu reseña será visible para
              todos los usuarios. Sé respetuoso y constructivo.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}