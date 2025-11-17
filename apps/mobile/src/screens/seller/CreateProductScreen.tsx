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
  const { user, profile, refreshProfile } = useAuth();
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
    checkSellerStatus();
  }, []);

  async function checkSellerStatus() {
    if (!user?.id) return;

    // Verificar si el perfil tiene rol de vendedor
    if (profile?.role !== 'seller_individual' && profile?.role !== 'seller_store') {
      Alert.alert(
        'Permiso requerido',
        'Necesitas ser vendedor para crear productos. ¿Deseas convertirte en vendedor?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => navigation.goBack()
          },
          {
            text: 'Sí, ser vendedor',
            onPress: async () => {
              await becomeSellerAndCreateSeller();
            }
          }
        ]
      );
    }
  }

  async function becomeSellerAndCreateSeller() {
    if (!user?.id) return;

    try {
      // 1. Actualizar rol en profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'seller_individual' })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Crear registro en sellers
      const storeName = profile?.full_name || user.email?.split('@')[0] || 'Mi Tienda';

      const { error: sellerError } = await supabase
        .from('sellers')
        .insert({
          id: user.id,
          store_name: storeName,
          description: 'Tienda verificada',
          is_verified: false,
          rating: 4.5,
          total_sales: 0,
        });

      if (sellerError && sellerError.code !== '23505') {
        throw sellerError;
      }

      // 3. Refrescar perfil
      await refreshProfile();

      Alert.alert('¡Éxito!', 'Ahora eres vendedor. Ya puedes publicar productos.');
    } catch (error: any) {
      console.error('Error becoming seller:', error);
      Alert.alert('Error', 'No se pudo completar el proceso. Intenta de nuevo.');
      navigation.goBack();
    }
  }

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
        const errorData = await response.json();
        console.error('Upload error:', errorData);
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

  async function ensureSellerExists(): Promise<string | null> {
    if (!user?.id) {
      console.error('No user ID');
      return null;
    }

    try {
      // Verificar si existe el seller
      const { data: existingSeller, error: searchError } = await supabase
        .from('sellers')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (existingSeller) {
        return existingSeller.id;
      }

      // Crear seller si no existe
      const storeName = profile?.full_name || user.email?.split('@')[0] || 'Mi Tienda';

      const { data: newSeller, error: createError } = await supabase
        .from('sellers')
        .insert({
          id: user.id,
          store_name: storeName,
          description: 'Tienda verificada',
          is_verified: false,
          rating: 4.5,
          total_sales: 0,
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating seller:', createError);
        return null;
      }

      return newSeller.id;
    } catch (error) {
      console.error('Error in ensureSellerExists:', error);
      return null;
    }
  }

  async function handleCreateProduct() {
    // Validaciones
    if (!name.trim()) {
      Alert.alert('Error', 'Ingresa el nombre del producto');
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Error', 'Ingresa un precio válido');
      return;
    }

    if (compareAtPrice && parseFloat(compareAtPrice) <= parseFloat(price)) {
      Alert.alert('Error', 'El precio anterior debe ser mayor al precio actual para mostrar descuento');
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

    try {
      // 1. Asegurar que el seller existe
      const sellerId = await ensureSellerExists();
      if (!sellerId) {
        Alert.alert('Error', 'No se pudo verificar el perfil de vendedor. Intenta de nuevo.');
        return;
      }

      // 2. Subir imágenes
      const uploadPromises = imageUris.map((uri, index) => uploadImage(uri, index));
      const uploadedUrls = await Promise.all(uploadPromises);
      
      const validUrls = uploadedUrls.filter(url => url !== null) as string[];

      if (validUrls.length === 0) {
        Alert.alert('Error', 'No se pudieron subir las imágenes. Verifica tu conexión e intenta de nuevo.');
        return;
      }

      setUploading(false);

      // 3. Crear producto
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
          views: 0,
          sales: 0,
          favorites: 0,
        });

      if (error) {
        console.error('Error creating product:', error);
        Alert.alert('Error', 'No se pudo crear el producto: ' + error.message);
        return;
      }

      Alert.alert(
        '¡Producto Publicado! 🎉',
        'Tu producto ya está visible para los compradores',
        [
          {
            text: 'Ver mis productos',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MyProducts' }],
              });
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error in handleCreateProduct:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
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
        <Text className="text-xl font-bold text-gray-900">Publicar Producto</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* Imágenes */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Fotos del producto * ({imageUris.length}/5)
          </Text>
          <Text className="text-xs text-gray-500 mb-3">
            La primera imagen será la principal
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
                {index === 0 && (
                  <View className="absolute top-1 left-1 bg-primary rounded px-2 py-1">
                    <Text className="text-white text-xs font-bold">Principal</Text>
                  </View>
                )}
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

        {/* Nombre */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">Nombre del producto *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ej: iPhone 15 Pro Max 256GB"
            className="border border-gray-300 rounded-xl px-4 py-3 text-base"
            placeholderTextColor="#9CA3AF"
            maxLength={100}
          />
        </View>

        {/* Descripción */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">Descripción</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe tu producto: características, estado, etc."
            multiline
            numberOfLines={4}
            className="border border-gray-300 rounded-xl px-4 py-3 text-base"
            style={{ height: 100, textAlignVertical: 'top' }}
            placeholderTextColor="#9CA3AF"
            maxLength={500}
          />
        </View>

        {/* Categoría */}
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

        {/* Precio */}
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

        {/* Precio anterior */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Precio anterior (opcional)
          </Text>
          <Text className="text-xs text-gray-500 mb-2">
            Para mostrar descuento, debe ser mayor al precio actual
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

        {/* Stock */}
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

        {/* Condición */}
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

        {/* Envío gratis */}
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
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-900">Ofrecer envío gratis</Text>
              <Text className="text-xs text-gray-500">Aumenta tus ventas hasta un 50%</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Loading state */}
        {uploading && (
          <View className="mb-4 bg-blue-50 rounded-xl p-4">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="text-center text-primary font-semibold mt-2">
              Subiendo {imageUris.length} {imageUris.length === 1 ? 'imagen' : 'imágenes'}...
            </Text>
          </View>
        )}

        <Button
          title={loading ? "Publicando..." : "Publicar Producto"}
          onPress={handleCreateProduct}
          disabled={loading || uploading}
        />

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}