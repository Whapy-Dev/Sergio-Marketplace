import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

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

      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

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

  const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name || 'Todos';

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header con gradiente */}
      <LinearGradient
        colors={['#11CCEE', '#0EA5C7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
      >
        <View className="px-4 pt-3 pb-5">
          {/* Top bar */}
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Búsqueda</Text>
            <View className="flex-row items-center">
              <TouchableOpacity className="mr-3">
                <Ionicons name="notifications-outline" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
                <Ionicons name="cart-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Barra de búsqueda */}
          <View className="flex-row items-center">
            <View className="flex-1 flex-row items-center bg-white rounded-full px-4 py-3 mr-2">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 text-base text-gray-900 ml-2"
                placeholder="Buscar"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Botón Filtrar */}
            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              className="bg-white rounded-full px-4 py-3 flex-row items-center"
            >
              <Ionicons name="options-outline" size={18} color={COLORS.primary} />
              <Text className="text-primary font-semibold text-sm ml-1">Filtrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Panel de filtros desplegable */}
      {showFilters && (
        <View className="bg-white px-4 py-4 border-b border-gray-200">
          <Text className="text-xs font-bold text-gray-500 mb-2">CATEGORÍAS</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            <TouchableOpacity
              onPress={() => handleCategoryChange(null)}
              className={`mr-2 px-4 py-2 rounded-full ${
                selectedCategory === null ? 'bg-primary' : 'bg-gray-100'
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
                className={`mr-2 px-4 py-2 rounded-full ${
                  selectedCategory === category.id ? 'bg-primary' : 'bg-gray-100'
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

          <Text className="text-xs font-bold text-gray-500 mb-2">ORDENAR POR</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
          >
            <TouchableOpacity
              onPress={() => handleSortChange('recent')}
              className={`mr-2 px-4 py-2 rounded-full ${
                sortBy === 'recent' ? 'bg-primary' : 'bg-gray-100'
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
              className={`mr-2 px-4 py-2 rounded-full ${
                sortBy === 'price_low' ? 'bg-primary' : 'bg-gray-100'
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
              className={`mr-2 px-4 py-2 rounded-full ${
                sortBy === 'price_high' ? 'bg-primary' : 'bg-gray-100'
              }`}
            >
              <Text className={`text-sm font-semibold ${
                sortBy === 'price_high' ? 'text-white' : 'text-gray-700'
              }`}>
                Mayor precio
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity
            onPress={() => {
              handleSearch();
              setShowFilters(false);
            }}
            className="bg-primary rounded-full py-3 mt-4"
          >
            <Text className="text-white font-bold text-center">Aplicar filtros</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Indicador de categoría */}
      {searched && !loading && (
        <View className="bg-gray-200 px-4 py-3">
          <Text className="text-gray-700 text-sm text-center font-medium">
            {selectedCategoryName} ({results.length} resultados)
          </Text>
        </View>
      )}

      {/* Contenido */}
      <ScrollView className="flex-1">
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="text-gray-600 mt-4 text-base">Buscando productos...</Text>
          </View>
        ) : !searched ? (
          <View className="flex-1 items-center justify-center py-20 px-6">
            <Ionicons name="search" size={80} color="#D1D5DB" />
            <Text className="text-xl font-bold text-gray-900 mb-2 text-center mt-4">
              ¿Qué estás buscando?
            </Text>
            <Text className="text-base text-gray-600 text-center">
              Usa los filtros o escribe para buscar
            </Text>
          </View>
        ) : results.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20 px-6">
            <Ionicons name="sad-outline" size={80} color="#D1D5DB" />
            <Text className="text-xl font-bold text-gray-900 mb-2 text-center mt-4">
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
            {results.map((product, index) => (
              <TouchableOpacity
                key={product.id}
                onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                className="flex-row bg-white rounded-2xl border border-gray-200 mb-3 overflow-hidden"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <View className="w-32 h-40 bg-gray-100 relative">
                  {product.image_url ? (
                    <Image
                      source={{ uri: product.image_url }}
                      style={{ width: 128, height: 160 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
                    </View>
                  )}
                  
                  {index % 3 === 0 && (
                    <View 
                      className="absolute top-2 left-2 rounded px-2 py-1"
                      style={{ backgroundColor: '#11CCEE' }}
                    >
                      <Text className="text-white text-[9px] font-bold">Cupón +5% OFF</Text>
                      <Text className="text-white text-[9px] font-bold">YOCOMPRO</Text>
                    </View>
                  )}

                  {index % 4 === 0 && (
                    <View 
                      className="absolute bottom-2 left-2 rounded px-2 py-0.5"
                      style={{ backgroundColor: '#0EA5C7' }}
                    >
                      <Text className="text-white text-[9px] font-bold">3 sin interés</Text>
                    </View>
                  )}
                </View>

                <View className="flex-1 p-3">
                  <Text className="text-sm font-medium text-gray-900 mb-1" numberOfLines={2}>
                    {product.name}
                  </Text>

                  {index % 4 === 0 && (
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="card-outline" size={12} color={COLORS.primary} />
                      <Text className="text-[10px] text-primary font-semibold ml-1">
                        6 Cuotas Yo Compro Crédito
                      </Text>
                    </View>
                  )}

                  {index % 3 === 0 && (
                    <Text className="text-xs text-gray-400 line-through">
                      ${Math.round(product.price * 1.4).toLocaleString('es-AR')}
                    </Text>
                  )}

                  {index % 3 === 0 && (
                    <View className="bg-cyan-100 rounded px-1.5 py-0.5 self-start mb-1">
                      <Text className="text-cyan-600 text-[10px] font-bold">42% OFF</Text>
                    </View>
                  )}

                  <Text className="text-2xl font-bold text-gray-900 mb-1">
                    ${product.price.toLocaleString('es-AR')}
                  </Text>

                  <Text className="text-[10px] text-gray-500 mb-2">
                    Precio sin imp. nac. ${Math.round(product.price * 0.83).toLocaleString('es-AR')}
                  </Text>

                  {product.free_shipping && (
                    <View className="bg-green-100 rounded px-2 py-1 self-start mb-2">
                      <Text className="text-green-700 text-[10px] font-bold">
                        Envío GRATIS
                      </Text>
                    </View>
                  )}

                  {index % 5 === 0 && (
                    <View className="bg-green-50 rounded px-2 py-1 self-start border border-green-200">
                      <Text className="text-green-700 text-[10px] font-bold">
                        ¡Retíralo ya!
                      </Text>
                    </View>
                  )}

                  {product.stock <= 5 && product.stock > 0 && (
                    <Text className="text-[10px] text-orange-600 font-semibold mt-1">
                      ¡Solo quedan {product.stock}!
                    </Text>
                  )}

                  {product.stock === 0 && (
                    <Text className="text-[10px] text-red-600 font-semibold mt-1">
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