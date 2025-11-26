import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { createProduct } from '../../services/seller';
import { createVariantTypes } from '../../services/variants';
import { supabase } from '../../services/supabase';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/theme';
import { scale } from '../../utils/responsive';

interface VariantTypeInput {
  name: string;
  options: string[];
}

interface Category {
  id: string;
  name: string;
}

export default function CreateProductScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [stock, setStock] = useState('');
  const [condition, setCondition] = useState<'new' | 'used'>('new');
  const [categoryId, setCategoryId] = useState('');
  const [freeShipping, setFreeShipping] = useState(true);
  const [hasVariants, setHasVariants] = useState(false);
  const [variantTypes, setVariantTypes] = useState<VariantTypeInput[]>([]);
  const [newVariantTypeName, setNewVariantTypeName] = useState('');
  const [newOptionValue, setNewOptionValue] = useState<Record<number, string>>({});

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoadingCategories(true);
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .is('parent_id', null)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (data) {
        setCategories(data);
        if (data.length > 0) {
          setCategoryId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  }

  async function handleCreate() {
    if (!user) return;

    // Validaciones
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre del producto es obligatorio');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'La descripción es obligatoria');
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Error', 'Ingresa un precio válido');
      return;
    }

    if (!stock || parseInt(stock) < 0) {
      Alert.alert('Error', 'Ingresa un stock válido');
      return;
    }

    if (!categoryId) {
      Alert.alert('Error', 'Selecciona una categoría');
      return;
    }

    try {
      setLoading(true);

      const productData = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
        stock: parseInt(stock),
        condition,
        category_id: categoryId,
        seller_id: user.id,
        free_shipping: freeShipping,
      };

      const result = await createProduct(productData);

      if (result.success && result.productId) {
        // Create variant types if enabled
        if (hasVariants && variantTypes.length > 0) {
          const variantTypesData = variantTypes.map(vt => ({
            name: vt.name,
            options: vt.options.map(opt => ({ value: opt }))
          }));
          await createVariantTypes(result.productId, variantTypesData);
        }

        Alert.alert(
          '¡Producto Publicado!',
          'Tu producto se publicó correctamente',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else if (result.success) {
        Alert.alert(
          '¡Producto Publicado!',
          'Tu producto se publicó correctamente',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo crear el producto');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
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
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Text className="text-primary text-2xl font-bold">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Publicar Producto</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* Nombre */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Nombre del producto *
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="Ej: Samsung Galaxy A54"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
        </View>

        {/* Descripción */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Descripción *
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="Describe tu producto..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>

        {/* Precio */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Precio *
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="0.00"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            editable={!loading}
          />
        </View>

        {/* Precio comparado (opcional) */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Precio anterior (opcional)
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="0.00"
            value={compareAtPrice}
            onChangeText={setCompareAtPrice}
            keyboardType="decimal-pad"
            editable={!loading}
          />
          <Text className="text-xs text-gray-500 mt-1">
            Muestra el descuento al comprador
          </Text>
        </View>

        {/* Stock */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Stock disponible *
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="0"
            value={stock}
            onChangeText={setStock}
            keyboardType="number-pad"
            editable={!loading}
          />
        </View>

        {/* Condición */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Condición *
          </Text>
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setCondition('new')}
              className={`flex-1 mr-2 py-3 rounded-lg border ${
                condition === 'new' ? 'bg-primary border-primary' : 'bg-gray-50 border-gray-300'
              }`}
              disabled={loading}
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
              className={`flex-1 ml-2 py-3 rounded-lg border ${
                condition === 'used' ? 'bg-primary border-primary' : 'bg-gray-50 border-gray-300'
              }`}
              disabled={loading}
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

        {/* Categoría */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Categoría *
          </Text>
          <View className="bg-gray-50 border border-gray-300 rounded-lg">
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategoryId(cat.id)}
                className={`flex-row items-center justify-between px-4 py-3 ${
                  categoryId === cat.id ? 'bg-blue-50' : ''
                }`}
                disabled={loading}
              >
                <Text
                  className={`text-base ${
                    categoryId === cat.id ? 'text-primary font-semibold' : 'text-gray-700'
                  }`}
                >
                  {cat.name}
                </Text>
                {categoryId === cat.id && (
                  <Text className="text-primary text-xl">✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Envío gratis */}
        <View className="mb-4">
          <TouchableOpacity
            onPress={() => setFreeShipping(!freeShipping)}
            className="flex-row items-center py-3"
            disabled={loading}
          >
            <View
              className={`w-6 h-6 rounded border-2 items-center justify-center mr-3 ${
                freeShipping ? 'bg-primary border-primary' : 'border-gray-300'
              }`}
            >
              {freeShipping && <Text className="text-white text-sm">✓</Text>}
            </View>
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-900">Envío gratis</Text>
              <Text className="text-sm text-gray-500">Aumenta las posibilidades de venta</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Variantes */}
        <View className="mb-6">
          <TouchableOpacity
            onPress={() => setHasVariants(!hasVariants)}
            className="flex-row items-center py-3"
            disabled={loading}
          >
            <View
              className={`w-6 h-6 rounded border-2 items-center justify-center mr-3 ${
                hasVariants ? 'bg-primary border-primary' : 'border-gray-300'
              }`}
            >
              {hasVariants && <Text className="text-white text-sm">✓</Text>}
            </View>
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-900">Tiene variantes</Text>
              <Text className="text-sm text-gray-500">Color, talle, material, etc.</Text>
            </View>
          </TouchableOpacity>

          {hasVariants && (
            <View className="mt-4 bg-gray-50 rounded-lg p-4">
              {/* Existing variant types */}
              {variantTypes.map((vt, typeIndex) => (
                <View key={typeIndex} className="mb-4 bg-white rounded-lg p-3 border border-gray-200">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="font-semibold text-gray-900">{vt.name}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setVariantTypes(variantTypes.filter((_, i) => i !== typeIndex));
                      }}
                    >
                      <Ionicons name="trash-outline" size={scale(18)} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  {/* Options */}
                  <View className="flex-row flex-wrap mb-2">
                    {vt.options.map((opt, optIndex) => (
                      <View key={optIndex} className="flex-row items-center bg-blue-100 rounded-full px-3 py-1 mr-2 mb-2">
                        <Text className="text-blue-800 text-sm">{opt}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            const updated = [...variantTypes];
                            updated[typeIndex].options = updated[typeIndex].options.filter((_, i) => i !== optIndex);
                            setVariantTypes(updated);
                          }}
                          className="ml-2"
                        >
                          <Ionicons name="close-circle" size={scale(16)} color="#3B82F6" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>

                  {/* Add option */}
                  <View className="flex-row items-center">
                    <TextInput
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm mr-2"
                      placeholder="Nueva opción..."
                      value={newOptionValue[typeIndex] || ''}
                      onChangeText={(text) => setNewOptionValue({ ...newOptionValue, [typeIndex]: text })}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        const value = newOptionValue[typeIndex]?.trim();
                        if (value) {
                          const updated = [...variantTypes];
                          updated[typeIndex].options.push(value);
                          setVariantTypes(updated);
                          setNewOptionValue({ ...newOptionValue, [typeIndex]: '' });
                        }
                      }}
                      className="bg-primary rounded-lg px-3 py-2"
                    >
                      <Ionicons name="add" size={scale(20)} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Add new variant type */}
              <View className="flex-row items-center">
                <TextInput
                  className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 mr-2"
                  placeholder="Nombre del tipo (ej: Color, Talle)"
                  value={newVariantTypeName}
                  onChangeText={setNewVariantTypeName}
                />
                <TouchableOpacity
                  onPress={() => {
                    const name = newVariantTypeName.trim();
                    if (name) {
                      setVariantTypes([...variantTypes, { name, options: [] }]);
                      setNewVariantTypeName('');
                    }
                  }}
                  className="bg-primary rounded-lg px-3 py-2"
                >
                  <Text className="text-white font-semibold">Agregar</Text>
                </TouchableOpacity>
              </View>

              {variantTypes.length === 0 && (
                <Text className="text-gray-500 text-sm text-center mt-2">
                  Agrega tipos de variantes como Color, Talle, Material, etc.
                </Text>
              )}
            </View>
          )}
        </View>

        <Button
          title="Publicar Producto"
          onPress={handleCreate}
          loading={loading}
        />

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}