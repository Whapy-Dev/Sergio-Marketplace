import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, supabaseUrl } from '../../services/supabase';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/theme';

interface Category {
  id: string;
  name: string;
}

export default function CreateProductScreen({ navigation }: any) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [stock, setStock] = useState('');
  const [condition, setCondition] = useState<'new' | 'used'>('new');
  const [freeShipping, setFreeShipping] = useState(true);
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .is('parent_id', null)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading categories:', error);
      } else if (data && data.length > 0) {
        setCategories(data);
        setCategoryId(data[0].id);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingCategories(false);
    }
  }

  async function pickImage() {
    if (imageUris.length >= 5) {
      Alert.alert('Límite alcanzado', 'Puedes subir máximo 5 imágenes');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos para subir imágenes');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUris([...imageUris, result.assets[0].uri]);
    }
  }

  function removeImage(index: number) {
    setImageUris(imageUris.filter((_, i) => i !== index));
  }

  async function uploadImage(uri: string, index: number): Promise<string | null> {
    try {
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user?.id}-${Date.now()}-${index}.${fileExt}`;

      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        name: fileName,
        type: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
      } as any);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return null;
      }

      const response = await fetch(
        `${supabaseUrl}/storage/v1/object/products/${fileName}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        console.error('Upload error:', await response.json());
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  }

  async function getOrCreateSeller(): Promise<string | null> {
    if (!user?.id) {
      console.error('No user ID');
      return null;
    }

    try {
      // Buscar seller existente por user_id
      const { data: existingSeller, error: searchError } = await supabase
        .from('sellers')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (existingSeller) {
        console.log('Seller found:', existingSeller.id);
        return existingSeller.id;
      }

      // Si no existe, crear seller con el user.id como id (primary key)
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      const storeName = profile?.full_name || profile?.email?.split('@')[0] || 'Mi Tienda';

      const { data: newSeller, error: createError } = await supabase
        .from('sellers')
        .insert({
          id: user.id, // Usar el user.id como primary key
          store_name: storeName,
          description: 'Tienda verificada',
          is_verified: false,
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating seller:', createError);
        return null;
      }

      console.log('New seller created:', newSeller.id);
      return newSeller.id;
    } catch (error) {
      console.error('Error in getOrCreateSeller:', error);
      return null;
    }
  }

  async function handleCreateProduct() {
    if (!name.trim()) {
      Alert.alert('Error', 'Ingresa el nombre del producto');
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Error', 'Ingresa un precio válido');
      return;
    }

    if (compareAtPrice && parseFloat(compareAtPrice) < parseFloat(price)) {
      Alert.alert('Error', 'El precio anterior debe ser mayor o igual al precio actual');
      return;
    }

    if (!stock || parseInt(stock) < 0) {
      Alert.alert('Error', 'Ingresa un stock válido');
      return;
    }

    if (imageUris.length === 0) {
      Alert.alert('Error', 'Agrega al menos una imagen del producto');
      return;
    }

    if (!categoryId) {
      Alert.alert('Error', 'Selecciona una categoría');
      return;
    }

    setLoading(true);
    setUploading(true);

    // Obtener o crear seller_id
    const sellerId = await getOrCreateSeller();
    if (!sellerId) {
      Alert.alert('Error', 'No se pudo crear el perfil de vendedor. Verifica tu conexión.');
      setUploading(false);
      setLoading(false);
      return;
    }

    // Subir imágenes
    const uploadPromises = imageUris.map((uri, index) => uploadImage(uri, index));
    const uploadedUrls = await Promise.all(uploadPromises);
    
    const validUrls = uploadedUrls.filter(url => url !== null) as string[];

    if (validUrls.length === 0) {
      Alert.alert('Error', 'No se pudieron subir las imágenes. Intenta de nuevo.');
      setUploading(false);
      setLoading(false);
      return;
    }

    setUploading(false);

    // Crear producto
    const { error } = await supabase
      .from('products')
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        price: parseFloat(price),
        compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
        stock: parseInt(stock),
        condition,
        category_id: categoryId,
        seller_id: sellerId,
        image_url: validUrls[0],
        status: 'active',
        free_shipping: freeShipping,
      });

    setLoading(false);

    if (error) {
      console.error('Error creating product:', error);
      Alert.alert('Error', 'No se pudo crear el producto: ' + error.message);
      return;
    }

    Alert.alert('Éxito', 'Producto creado correctamente', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  }

  if (loadingCategories) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Text className="text-primary text-2xl font-bold">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Crear Producto</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Imágenes * ({imageUris.length}/5)
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {imageUris.map((uri, index) => (
              <View key={index} className="mr-3 relative">
                <Image 
                  source={{ uri }}
                  className="rounded-xl"
                  style={{ width: 120, height: 120 }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                >
                  <Text className="text-white text-xs font-bold">✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            {imageUris.length < 5 && (
              <TouchableOpacity
                onPress={pickImage}
                className="border-2 border-dashed border-gray-300 rounded-xl items-center justify-center"
                style={{ width: 120, height: 120 }}
              >
                <Text className="text-4xl mb-1">📷</Text>
                <Text className="text-xs text-gray-600">Agregar</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">Nombre *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ej: iPhone 15 Pro Max 256GB"
            className="border border-gray-300 rounded-xl px-4 py-3 text-base"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">Descripción</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe tu producto..."
            multiline
            numberOfLines={4}
            className="border border-gray-300 rounded-xl px-4 py-3 text-base"
            style={{ height: 100, textAlignVertical: 'top' }}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">Categoría *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => setCategoryId(category.id)}
                className={`mr-2 px-4 py-2 rounded-full border ${
                  categoryId === category.id
                    ? 'bg-primary border-primary'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    categoryId === category.id ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">Precio *</Text>
          <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3">
            <Text className="text-lg font-bold text-gray-900 mr-2">$</Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              keyboardType="decimal-pad"
              className="flex-1 text-base"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Precio anterior (opcional)
          </Text>
          <Text className="text-xs text-gray-500 mb-2">
            Debe ser mayor o igual al precio actual
          </Text>
          <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3">
            <Text className="text-lg font-bold text-gray-900 mr-2">$</Text>
            <TextInput
              value={compareAtPrice}
              onChangeText={setCompareAtPrice}
              placeholder="0.00"
              keyboardType="decimal-pad"
              className="flex-1 text-base"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">Stock disponible *</Text>
          <TextInput
            value={stock}
            onChangeText={setStock}
            placeholder="Cantidad disponible"
            keyboardType="number-pad"
            className="border border-gray-300 rounded-xl px-4 py-3 text-base"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">Condición *</Text>
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setCondition('new')}
              className={`flex-1 mr-2 py-3 rounded-xl border ${
                condition === 'new'
                  ? 'bg-primary border-primary'
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  condition === 'new' ? 'text-white' : 'text-gray-700'
                }`}
              >
                Nuevo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCondition('used')}
              className={`flex-1 ml-2 py-3 rounded-xl border ${
                condition === 'used'
                  ? 'bg-primary border-primary'
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  condition === 'used' ? 'text-white' : 'text-gray-700'
                }`}
              >
                Usado
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-6">
          <TouchableOpacity
            onPress={() => setFreeShipping(!freeShipping)}
            className="flex-row items-center py-3"
          >
            <View
              className={`w-6 h-6 rounded border-2 items-center justify-center mr-3 ${
                freeShipping ? 'bg-primary border-primary' : 'border-gray-300'
              }`}
            >
              {freeShipping && <Text className="text-white text-sm">✓</Text>}
            </View>
            <Text className="text-base font-medium text-gray-900">Ofrecer envío gratis</Text>
          </TouchableOpacity>
        </View>

        {uploading && (
          <View className="mb-4">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="text-center text-gray-600 mt-2">
              Subiendo {imageUris.length} {imageUris.length === 1 ? 'imagen' : 'imágenes'}...
            </Text>
          </View>
        )}

        <Button
          title={loading ? "Creando producto..." : "Crear Producto"}
          onPress={handleCreateProduct}
          disabled={loading || uploading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}