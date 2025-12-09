import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { createReview } from '../../services/reviews';
import { supabase } from '../../services/supabase';
import { COLORS } from '../../constants/theme';
import Button from '../../components/common/Button';

interface WriteReviewScreenProps {
  route: {
    params: {
      productId: string;
      productName: string;
      productImage?: string;
      orderId?: string;
      userId: string;
    };
  };
  navigation: any;
}

export default function WriteReviewScreen({ route, navigation }: WriteReviewScreenProps) {
  const insets = useSafeAreaInsets();
  const { productId, productName, productImage, orderId, userId } = route.params;

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const ratingLabels = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];

  async function handlePickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  }

  async function uploadImage(uri: string) {
    try {
      setUploadingImage(true);

      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `review_${userId}_${Date.now()}.jpg`;
      const filePath = `reviews/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setImages((prev) => [...prev, publicUrl]);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'No se pudo subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (rating === 0) {
      Alert.alert('Calificación requerida', 'Por favor selecciona una calificación');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Comentario muy corto', 'Por favor escribe al menos 10 caracteres');
      return;
    }

    try {
      setLoading(true);

      const review = await createReview({
        product_id: productId,
        user_id: userId,
        order_id: orderId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        images: images.length > 0 ? images : undefined,
      });

      if (review) {
        Alert.alert(
          '¡Gracias por tu opinión!',
          'Tu reseña ha sido publicada exitosamente.',
          [
            {
              text: 'Aceptar',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo publicar la reseña');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <LinearGradient
        colors={['#2563EB', '#DC2626']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingTop: insets.top,
          paddingBottom: 12,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <View className="px-5 py-2 flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-1 mr-4">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-white flex-1">Escribir reseña</Text>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Producto */}
        <View className="flex-row items-center p-5 border-b border-gray-100">
          {productImage ? (
            <Image
              source={{ uri: productImage }}
              className="w-16 h-16 rounded-lg bg-gray-100"
              resizeMode="cover"
            />
          ) : (
            <View className="w-16 h-16 rounded-lg bg-gray-100 items-center justify-center">
              <Ionicons name="cube-outline" size={24} color="#9CA3AF" />
            </View>
          )}
          <View className="flex-1 ml-4">
            <Text className="text-base font-medium text-gray-900" numberOfLines={2}>
              {productName}
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              ¿Qué te pareció este producto?
            </Text>
          </View>
        </View>

        {/* Calificación */}
        <View className="px-5 py-6 border-b border-gray-100">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Tu calificación
          </Text>
          <View className="flex-row justify-center mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                className="px-2"
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={40}
                  color={star <= rating ? '#FBBF24' : '#D1D5DB'}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text className="text-center text-base text-gray-600">
              {ratingLabels[rating]}
            </Text>
          )}
        </View>

        {/* Título (opcional) */}
        <View className="px-5 py-4">
          <Text className="text-base font-medium text-gray-700 mb-2">
            Título (opcional)
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base"
            placeholder="Resume tu experiencia"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Comentario */}
        <View className="px-5 py-4">
          <Text className="text-base font-medium text-gray-700 mb-2">
            Tu opinión
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base"
            placeholder="Cuéntanos qué te pareció el producto, calidad, envío..."
            placeholderTextColor="#9CA3AF"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={5}
            maxLength={1000}
            textAlignVertical="top"
            style={{ minHeight: 120 }}
          />
          <Text className="text-right text-xs text-gray-400 mt-1">
            {comment.length}/1000
          </Text>
        </View>

        {/* Fotos */}
        <View className="px-5 py-4">
          <Text className="text-base font-medium text-gray-700 mb-2">
            Agregar fotos (opcional)
          </Text>
          <Text className="text-sm text-gray-500 mb-4">
            Las fotos ayudan a otros compradores
          </Text>

          <View className="flex-row flex-wrap">
            {images.map((uri, index) => (
              <View key={index} className="mr-3 mb-3 relative">
                <Image
                  source={{ uri }}
                  className="w-20 h-20 rounded-lg"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ))}

            {images.length < 5 && (
              <TouchableOpacity
                className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 items-center justify-center"
                onPress={handlePickImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={24} color="#9CA3AF" />
                    <Text className="text-xs text-gray-400 mt-1">Agregar</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Botón de enviar */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white px-5 pt-4 border-t border-gray-100"
        style={{
          paddingBottom: insets.bottom + 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 20,
        }}
      >
        <Button
          title="Publicar reseña"
          onPress={handleSubmit}
          loading={loading}
          disabled={rating === 0 || comment.trim().length < 10}
        />
      </View>
    </View>
  );
}
