import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateProduct } from '../../services/seller';
import { supabase } from '../../services/supabase';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/theme';

interface Category {
  id: string;
  name: string;
}

export default function EditProductScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [stock, setStock] = useState('');
  const [condition, setCondition] = useState<'new' | 'used'>('new');
  const [categoryId, setCategoryId] = useState('');
  const [freeShipping, setFreeShipping] = useState(true);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  useEffect(() => {
    loadProduct();
    loadCategories();
  }, []);

  async function loadProduct() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error || !data) {
        Alert.alert('Error', 'No se pudo cargar el producto');
        navigation.goBack();
        return;
      }

      setName(data.name);
      setDescription(data.description || '');
      setPrice(data.price.toString());
      setCompareAtPrice(data.compare_at_price?.toString() || '');
      setStock(data.stock.toString());
      setCondition(data.condition);
      setCategoryId(data.category_id);
      setFreeShipping(data.free_shipping);
      setStatus(data.status);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .is('parent_id', null)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async function handleUpdate() {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre del producto es obligatorio');
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

    try {
      setSaving(true);

      const updates = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
        stock: parseInt(stock),
        condition,
        category_id: categoryId,
        free_shipping: freeShipping,
        status,
      };

      const result = await updateProduct(productId, updates);

      if (result.success) {
        Alert.alert(
          'Producto Actualizado',
          'Los cambios se guardaron correctamente',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo actualizar el producto');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
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
        <Text className="text-xl font-bold text-gray-900">Editar Producto</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* Estado */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Estado del producto
          </Text>
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setStatus('active')}
              className={`flex-1 mr-2 py-3 rounded-lg border ${
                status === 'active' ? 'bg-green-500 border-green-500' : 'bg-gray-50 border-gray-300'
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  status === 'active' ? 'text-white' : 'text-gray-700'
                }`}
              >
                Activo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStatus('inactive')}
              className={`flex-1 ml-2 py-3 rounded-lg border ${
                status === 'inactive' ? 'bg-gray-500 border-gray-500' : 'bg-gray-50 border-gray-300'
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  status === 'inactive' ? 'text-white' : 'text-gray-700'
                }`}
              >
                Inactivo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Resto de campos igual que CreateProduct */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Nombre *</Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
            value={name}
            onChangeText={setName}
            editable={!saving}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Descripción *</Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!saving}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Precio *</Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            editable={!saving}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Precio anterior</Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
            value={compareAtPrice}
            onChangeText={setCompareAtPrice}
            keyboardType="decimal-pad"
            editable={!saving}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Stock *</Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
            value={stock}
            onChangeText={setStock}
            keyboardType="number-pad"
            editable={!saving}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Condición *</Text>
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setCondition('new')}
              className={`flex-1 mr-2 py-3 rounded-lg border ${
                condition === 'new' ? 'bg-primary border-primary' : 'bg-gray-50 border-gray-300'
              }`}
            >
              <Text className={`text-center font-semibold ${condition === 'new' ? 'text-white' : 'text-gray-700'}`}>
                Nuevo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCondition('used')}
              className={`flex-1 ml-2 py-3 rounded-lg border ${
                condition === 'used' ? 'bg-primary border-primary' : 'bg-gray-50 border-gray-300'
              }`}
            >
              <Text className={`text-center font-semibold ${condition === 'used' ? 'text-white' : 'text-gray-700'}`}>
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
            <Text className="text-base font-medium text-gray-900">Envío gratis</Text>
          </TouchableOpacity>
        </View>

        <Button title="Guardar Cambios" onPress={handleUpdate} loading={saving} />
      </ScrollView>
    </SafeAreaView>
  );
}