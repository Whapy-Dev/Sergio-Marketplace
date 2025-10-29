import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { COLORS } from '../../constants/theme';

interface Category {
  id: string;
  name: string;
}

function SearchScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'price_low' | 'price_high'>('recent');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  // Auto-buscar cuando cambian los filtros (solo si ya se buscó antes)
  useEffect(() => {
    if (searched) {
      handleSearch();
    }
  }, [selectedCategory, sortBy]);

  async function loadCategories() {
    try {
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async function handleSearch() {
    setLoading(true);
    setSearched(true);

    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('status', 'active');

      // Filtro de búsqueda por texto
      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Filtro por categoría
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      // Ordenamiento
      if (sortBy === 'price_low') {
        query = query.order('price', { ascending: true });
      } else if (sortBy === 'price_high') {
        query = query.order('price', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      query = query.limit(50);

      const { data, error } = await query;

      if (error) {
        console.error('Error searching:', error);
        setResults([]);
      } else {
        setResults(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleClearSearch() {
    setSearchQuery('');
    setSelectedCategory(null);
    setSortBy('recent');
    setResults([]);
    setSearched(false);
  }

  function handleCategoryChange(categoryId: string | null) {
    setSelectedCategory(categoryId);
  }

  function handleSortChange(newSort: 'recent' | 'price_low' | 'price_high') {
    setSortBy(newSort);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header con búsqueda */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center mb-3">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <Text className="text-primary text-2xl font-bold">←</Text>
          </TouchableOpacity>
          
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2">
            <Text className="text-gray-400 text-base mr-2">🔍</Text>
            <TextInput
              className="flex-1 text-base"
              placeholder="Buscar productos..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text className="text-gray-400 text-lg font-bold">✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            onPress={handleSearch}
            className="ml-3 bg-primary rounded-full px-4 py-2"
            disabled={loading}
          >
            <Text className="text-white font-semibold text-sm">Buscar</Text>
          </TouchableOpacity>
        </View>

        {/* Filtros */}
        <View>
          {/* Categorías */}
          <Text className="text-xs font-semibold text-gray-500 mb-2">CATEGORÍAS</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="mb-3"
          >
            <TouchableOpacity
              onPress={() => handleCategoryChange(null)}
              className={`mr-2 px-4 py-2 rounded-full border ${
                selectedCategory === null
                  ? 'bg-primary border-primary'
                  : 'bg-white border-gray-300'
              }`}
            >
              <Text className={`text-sm font-semibold ${
                selectedCategory === null ? 'text-white' : 'text-gray-700'
              }`}>
                Todas
              </Text>
            </TouchableOpacity>

            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => handleCategoryChange(category.id)}
                className={`mr-2 px-4 py-2 rounded-full border ${
                  selectedCategory === category.id
                    ? 'bg-primary border-primary'
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text className={`text-sm font-semibold ${
                  selectedCategory === category.id ? 'text-white' : 'text-gray-700'
                }`}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Ordenamiento */}
          <Text className="text-xs font-semibold text-gray-500 mb-2">ORDENAR POR</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
          >
            <TouchableOpacity
              onPress={() => handleSortChange('recent')}
              className={`mr-2 px-4 py-2 rounded-full border ${
                sortBy === 'recent'
                  ? 'bg-primary border-primary'
                  : 'bg-white border-gray-300'
              }`}
            >
              <Text className={`text-sm font-semibold ${
                sortBy === 'recent' ? 'text-white' : 'text-gray-700'
              }`}>
                Más recientes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSortChange('price_low')}
              className={`mr-2 px-4 py-2 rounded-full border ${
                sortBy === 'price_low'
                  ? 'bg-primary border-primary'
                  : 'bg-white border-gray-300'
              }`}
            >
              <Text className={`text-sm font-semibold ${
                sortBy === 'price_low' ? 'text-white' : 'text-gray-700'
              }`}>
                Menor precio
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSortChange('price_high')}
              className={`mr-2 px-4 py-2 rounded-full border ${
                sortBy === 'price_high'
                  ? 'bg-primary border-primary'
                  : 'bg-white border-gray-300'
              }`}
            >
              <Text className={`text-sm font-semibold ${
                sortBy === 'price_high' ? 'text-white' : 'text-gray-700'
              }`}>
                Mayor precio
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Contenido */}
      <ScrollView className="flex-1">
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="text-gray-600 mt-4 text-base">Buscando productos...</Text>
          </View>
        ) : !searched ? (
          <View className="flex-1 items-center justify-center py-20 px-6">
            <Text className="text-6xl mb-4">🔍</Text>
            <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
              ¿Qué estás buscando?
            </Text>
            <Text className="text-base text-gray-600 text-center">
              Usa los filtros o escribe para buscar
            </Text>
          </View>
        ) : results.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20 px-6">
            <Text className="text-6xl mb-4">😔</Text>
            <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
              No encontramos resultados
            </Text>
            <Text className="text-base text-gray-600 text-center mb-6">
              Intenta con otros filtros o palabras clave
            </Text>
            <TouchableOpacity
              onPress={handleClearSearch}
              className="bg-primary rounded-xl px-6 py-3"
            >
              <Text className="text-white font-semibold">Limpiar filtros</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="px-4 py-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-semibold text-gray-900">
                {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
              </Text>
              {(selectedCategory || searchQuery) && (
                <TouchableOpacity onPress={handleClearSearch}>
                  <Text className="text-primary text-sm font-semibold">
                    Limpiar filtros
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Lista de productos */}
            {results.map((product) => (
              <TouchableOpacity
                key={product.id}
                onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                className="flex-row bg-white rounded-xl border border-gray-200 p-3 mb-3"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <View className="w-24 h-24 bg-gray-100 rounded-lg mr-3 overflow-hidden">
                  {product.image_url ? (
                    <Image
                      source={{ uri: product.image_url }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Text className="text-4xl">📦</Text>
                    </View>
                  )}
                </View>

                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 mb-1" numberOfLines={2}>
                    {product.name}
                  </Text>
                  
                  {product.description && (
                    <Text className="text-sm text-gray-600 mb-2" numberOfLines={1}>
                      {product.description}
                    </Text>
                  )}

                  <View className="flex-row items-center justify-between">
                    <Text className="text-lg font-bold text-primary">
                      ${product.price.toLocaleString()}
                    </Text>
                    
                    {product.free_shipping && (
                      <View className="bg-green-100 rounded px-2 py-1">
                        <Text className="text-green-700 text-xs font-semibold">
                          Envío gratis
                        </Text>
                      </View>
                    )}
                  </View>

                  {product.stock <= 5 && product.stock > 0 && (
                    <Text className="text-xs text-orange-600 font-semibold mt-1">
                      ¡Solo quedan {product.stock}!
                    </Text>
                  )}

                  {product.stock === 0 && (
                    <Text className="text-xs text-red-600 font-semibold mt-1">
                      Sin stock
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default SearchScreen;