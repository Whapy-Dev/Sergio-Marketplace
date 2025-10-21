import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import ProductCard from '../../components/home/ProductCard';
import { COLORS } from '../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = '@search_history';

interface Product {
  id: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  category_id: string;
  condition: string;
}

interface Category {
  id: string;
  name: string;
}

export default function SearchScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<'all' | 'under50k' | '50k-100k' | 'over100k'>('all');

  useEffect(() => {
    loadCategories();
    loadSearchHistory();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      const delaySearch = setTimeout(() => {
        handleSearch();
      }, 500);
      return () => clearTimeout(delaySearch);
    } else {
      setProducts([]);
      setShowHistory(true);
      setHasSearched(false);
    }
  }, [searchQuery, selectedCategory, selectedCondition, priceRange]);

  async function loadCategories() {
    try {
      setLoadingCategories(true);
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .is('parent_id', null)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  }

  async function loadSearchHistory() {
    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }

  async function saveSearchToHistory(query: string) {
    if (!query.trim()) return;
    try {
      const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
      setSearchHistory(newHistory);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  async function clearSearchHistory() {
    try {
      setSearchHistory([]);
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      setProducts([]);
      return;
    }

    try {
      setLoading(true);
      setShowHistory(false);
      setHasSearched(true);

      let query = supabase
        .from('products')
        .select('id, name, price, compare_at_price, category_id, condition')
        .eq('status', 'active')
        .ilike('name', `%${searchQuery}%`);

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }
      if (selectedCondition) {
        query = query.eq('condition', selectedCondition);
      }
      if (priceRange === 'under50k') {
        query = query.lt('price', 50000);
      } else if (priceRange === '50k-100k') {
        query = query.gte('price', 50000).lte('price', 100000);
      } else if (priceRange === 'over100k') {
        query = query.gt('price', 100000);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(20);

      if (error) {
        console.error('Error searching:', error);
        return;
      }

      setProducts(data || []);
      await saveSearchToHistory(searchQuery);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleHistoryItemPress(query: string) {
    setSearchQuery(query);
    setShowHistory(false);
  }

  function clearFilters() {
    setSelectedCategory(null);
    setSelectedCondition(null);
    setPriceRange('all');
  }

  const hasActiveFilters = selectedCategory || selectedCondition || priceRange !== 'all';

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.pop()} className="mr-3">
            <Text className="text-primary text-2xl font-bold">←</Text>
          </TouchableOpacity>
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-4 py-3">
            <Text className="text-lg mr-2">🔍</Text>
            <TextInput
              className="flex-1 text-base"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text className="text-gray-500 text-xl ml-2">✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Filtros - Categorías */}
      {!loadingCategories && categories.length > 0 && (
        <View className="border-b border-gray-100">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
          >
            <TouchableOpacity
              onPress={() => setSelectedCategory(null)}
              className={`mr-2 px-3 py-1 rounded-full ${!selectedCategory ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <Text className={`text-xs ${!selectedCategory ? 'text-white font-semibold' : 'text-gray-700'}`}>
                Todas
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                className={`mr-2 px-3 py-1 rounded-full ${selectedCategory === cat.id ? 'bg-primary' : 'bg-gray-200'}`}
              >
                <Text className={`text-xs ${selectedCategory === cat.id ? 'text-white font-semibold' : 'text-gray-700'}`}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Filtros - Condición y Precio */}
      <View className="border-b border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
        >
          <TouchableOpacity
            onPress={() => setSelectedCondition(null)}
            className={`mr-2 px-3 py-1 rounded-full ${!selectedCondition ? 'bg-primary' : 'bg-gray-200'}`}
          >
            <Text className={`text-xs ${!selectedCondition ? 'text-white font-semibold' : 'text-gray-700'}`}>
              Todo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedCondition('new')}
            className={`mr-2 px-3 py-1 rounded-full ${selectedCondition === 'new' ? 'bg-primary' : 'bg-gray-200'}`}
          >
            <Text className={`text-xs ${selectedCondition === 'new' ? 'text-white font-semibold' : 'text-gray-700'}`}>
              Nuevo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedCondition('used')}
            className={`mr-2 px-3 py-1 rounded-full ${selectedCondition === 'used' ? 'bg-primary' : 'bg-gray-200'}`}
          >
            <Text className={`text-xs ${selectedCondition === 'used' ? 'text-white font-semibold' : 'text-gray-700'}`}>
              Usado
            </Text>
          </TouchableOpacity>

          <View className="w-px h-4 bg-gray-300 mx-1 self-center" />

          <TouchableOpacity
            onPress={() => setPriceRange('under50k')}
            className={`mr-2 px-3 py-1 rounded-full ${priceRange === 'under50k' ? 'bg-primary' : 'bg-gray-200'}`}
          >
            <Text className={`text-xs ${priceRange === 'under50k' ? 'text-white font-semibold' : 'text-gray-700'}`}>
              -$50K
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPriceRange('50k-100k')}
            className={`mr-2 px-3 py-1 rounded-full ${priceRange === '50k-100k' ? 'bg-primary' : 'bg-gray-200'}`}
          >
            <Text className={`text-xs ${priceRange === '50k-100k' ? 'text-white font-semibold' : 'text-gray-700'}`}>
              $50-100K
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPriceRange('over100k')}
            className={`mr-2 px-3 py-1 rounded-full ${priceRange === 'over100k' ? 'bg-primary' : 'bg-gray-200'}`}
          >
            <Text className={`text-xs ${priceRange === 'over100k' ? 'text-white font-semibold' : 'text-gray-700'}`}>
              +$100K
            </Text>
          </TouchableOpacity>

          {hasActiveFilters && (
            <TouchableOpacity onPress={clearFilters} className="ml-1 px-3 py-1 rounded-full bg-red-100">
              <Text className="text-xs text-red-600 font-semibold">Limpiar</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Contenido */}
      <ScrollView className="flex-1">
        {loading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="text-gray-600 mt-4">Buscando...</Text>
          </View>
        ) : showHistory && searchHistory.length > 0 ? (
          <View className="px-4 py-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-gray-900">Búsquedas recientes</Text>
              <TouchableOpacity onPress={clearSearchHistory}>
                <Text className="text-sm text-primary font-semibold">Limpiar</Text>
              </TouchableOpacity>
            </View>
            {searchHistory.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleHistoryItemPress(item)}
                className="flex-row items-center py-3 border-b border-gray-100"
              >
                <Text className="text-lg mr-3">🕐</Text>
                <Text className="flex-1 text-base text-gray-700">{item}</Text>
                <Text className="text-gray-400">→</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : hasSearched && products.length > 0 ? (
          <View className="px-4 py-4">
            <Text className="text-base text-gray-600 mb-4">
              {products.length} resultado{products.length !== 1 ? 's' : ''} para "{searchQuery}"
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {products.map((product) => (
                <View key={product.id} className="w-[48%]">
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    compareAtPrice={product.compare_at_price}
                    onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                  />
                </View>
              ))}
            </View>
          </View>
        ) : hasSearched ? (
          <View className="flex-1 items-center justify-center py-12 px-6">
            <Text className="text-6xl mb-4">🔍</Text>
            <Text className="text-xl font-bold text-gray-900 mb-2">No encontramos resultados</Text>
            <Text className="text-base text-gray-600 text-center mb-4">
              Intenta con otras palabras o ajusta los filtros
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity onPress={clearFilters} className="bg-primary rounded-lg px-6 py-3">
                <Text className="text-white font-semibold">Quitar filtros</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center py-12 px-6">
            <Text className="text-6xl mb-4">🔍</Text>
            <Text className="text-xl font-bold text-gray-900 mb-2">Busca productos</Text>
            <Text className="text-base text-gray-600 text-center">
              Escribe en el buscador para encontrar lo que necesitas
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}