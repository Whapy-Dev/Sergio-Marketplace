import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../services/supabase';
import { COLORS } from '../../constants/theme';
import FiltersModal, { FilterState } from '../../components/search/FiltersModal';

interface Product {
  id: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  category_id: string;
  condition: string;
  image_url: string | null;
  seller_id: string;
  free_shipping?: boolean;
}

interface Brand {
  id: string;
  name: string;
  logo: string;
}

export default function SearchScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState | null>(null);

  // Mock brands - en producción vendrían de la base de datos
  const brands: Brand[] = [
    { id: 'samsung', name: 'Samsung', logo: 'SAMSUNG' },
    { id: 'apple', name: 'Apple', logo: '' },
    { id: 'motorola', name: 'Motorola', logo: 'M' },
    { id: 'xiaomi', name: 'Xiaomi', logo: 'mi' },
    { id: 'tcl', name: 'TCL', logo: 'TCL' },
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      const delaySearch = setTimeout(() => {
        handleSearch();
      }, 500);
      return () => clearTimeout(delaySearch);
    } else {
      loadProducts();
    }
  }, [searchQuery, selectedBrand, activeFilters]);

  async function loadProducts() {
    try {
      setLoading(true);
      let query = supabase
        .from('products')
        .select('*')
        .eq('status', 'active');

      // Aplicar filtros si existen
      if (activeFilters) {
        if (activeFilters.freeShipping) {
          query = query.eq('free_shipping', true);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(50);

      if (!error && data) {
        // Filtrar por marca si hay una seleccionada
        let filteredData = data;
        if (selectedBrand) {
          const brand = brands.find(b => b.id === selectedBrand);
          if (brand) {
            filteredData = data.filter(product =>
              product.name.toLowerCase().includes(brand.name.toLowerCase())
            );
          }
        }
        setProducts(filteredData.slice(0, 20));
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      loadProducts();
      return;
    }

    try {
      setLoading(true);

      let query = supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .ilike('name', `%${searchQuery}%`);

      // Aplicar filtros si existen
      if (activeFilters) {
        if (activeFilters.freeShipping) {
          query = query.eq('free_shipping', true);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(50);

      if (!error && data) {
        // Filtrar por marca si hay una seleccionada
        let filteredData = data;
        if (selectedBrand) {
          const brand = brands.find(b => b.id === selectedBrand);
          if (brand) {
            filteredData = data.filter(product =>
              product.name.toLowerCase().includes(brand.name.toLowerCase())
            );
          }
        }
        setProducts(filteredData.slice(0, 20));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterPress() {
    setFiltersVisible(true);
  }

  function handleApplyFilters(filters: FilterState) {
    setActiveFilters(filters);
    setFiltersVisible(false);
    // Recargar productos con nuevos filtros
    if (searchQuery.length > 0) {
      handleSearch();
    } else {
      loadProducts();
    }
  }

  const renderProductItem = ({ item }: { item: Product }) => {
    const discount = item.compare_at_price
      ? Math.round(((item.compare_at_price - item.price) / item.compare_at_price) * 100)
      : 0;
    const priceWithoutTax = Math.round(item.price / 1.21 * 100) / 100;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        className="border-b border-gray-300 pb-2"
        style={{ height: 151 }}
      >
        <View className="flex-row">
          {/* Imagen del producto */}
          <View className="w-[133px] h-[133px] relative">
            <Image
              source={{ uri: item.image_url || 'https://via.placeholder.com/133' }}
              className="w-full h-[128px] mt-1"
              resizeMode="cover"
            />

            {/* Badge de cupón/descuento en la esquina superior */}
            {discount > 5 && (
              <View className="absolute top-0 left-0 rounded overflow-hidden" style={{ width: 80, height: 30 }}>
                <LinearGradient
                  colors={['#2563EB', '#DC2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                >
                  <Text className="text-white text-[9px] font-semibold">+{Math.min(discount, 15)}% OFF</Text>
                  <Text className="text-white text-[9px] font-light">Cupón</Text>
                  <View className="bg-white rounded px-2 py-0.5 absolute bottom-0.5">
                    <Text className="text-black text-[8px] font-semibold">YOCOMPRO</Text>
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* Badge "sin interés" en la parte inferior */}
            <View className="absolute bottom-0 left-0 rounded overflow-hidden" style={{ width: 67, height: 18 }}>
              <LinearGradient
                colors={['#2563EB', '#DC2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-row items-center px-1"
                style={{ height: 18 }}
              >
                <View className="bg-black/30 rounded size-[14px] items-center justify-center mr-1">
                  <Text className="text-white text-[10px] font-semibold">3</Text>
                </View>
                <Text className="text-white text-[9px] font-light">sin interés</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Información del producto */}
          <View className="flex-1 ml-3 pt-1">
            {/* Nombre del producto */}
            <Text className="text-xs font-medium text-gray-900 mb-1" numberOfLines={2}>
              {item.name}
            </Text>

            {/* Cuotas Yo Compro */}
            <View className="flex-row items-center mb-1">
              <View className="w-5 h-3 bg-gray-200 rounded mr-1 items-center justify-center">
                <Text className="text-[6px]">💳</Text>
              </View>
              <Text className="text-xs font-medium" style={{ color: COLORS.primary }}>
                6 Cuotas Yo Compro Crédito
              </Text>
            </View>

            {/* Precio anterior tachado */}
            {item.compare_at_price && (
              <View className="flex-row items-center mb-0.5 mt-2">
                <Text className="text-xs text-gray-500 line-through mr-2">
                  ${item.compare_at_price.toLocaleString()}
                </Text>
                <View className="rounded overflow-hidden">
                  <LinearGradient
                    colors={['#2563EB', '#DC2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="px-2 py-0.5"
                  >
                    <Text className="text-white text-[10px] font-medium">{discount}% OFF</Text>
                  </LinearGradient>
                </View>
              </View>
            )}

            {/* Precio actual */}
            <Text className="text-lg font-semibold text-gray-900 mb-0.5">
              ${item.price.toLocaleString()}
            </Text>

            {/* Precio sin impuestos */}
            <Text className="text-[10px] text-gray-500 mb-2">
              Precio sin imp. nac. ${priceWithoutTax.toLocaleString()}
            </Text>

            {/* Badges de envío */}
            <View className="flex-row">
              {item.free_shipping && (
                <View className="rounded overflow-hidden mr-2">
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="px-2 py-0.5"
                  >
                    <Text className="text-white text-[10px] font-light">
                      Envío <Text className="font-bold">GRATIS</Text>
                    </Text>
                  </LinearGradient>
                </View>
              )}
              <View className="rounded overflow-hidden">
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="px-2 py-0.5"
                >
                  <Text className="text-white text-[10px]">¡Retiralo ya!</Text>
                </LinearGradient>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header con gradiente */}
      <LinearGradient
        colors={['#2563EB', '#DC2626']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="rounded-b-[40px]"
        style={{ height: 70 }}
      >
        <View className="px-5 py-3 flex-row items-center justify-between">
          <Text className="text-base font-bold text-white">Búsqueda</Text>
          <View className="flex-row items-center">
            <TouchableOpacity className="mr-4">
              <Ionicons name="notifications-outline" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
              <Ionicons name="cart-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Barra de búsqueda */}
      <View className="px-4 py-2 bg-white">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-3 py-1.5 mr-3 border border-gray-200">
            <Ionicons name="search" size={18} color="#999" />
            <TextInput
              className="flex-1 text-sm ml-2"
              placeholder="Buscar"
              placeholderTextColor="rgba(0,0,0,0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            onPress={handleFilterPress}
            className="flex-row items-center"
          >
            <Ionicons name="options-outline" size={18} color="#000" />
            <Text className="text-xs text-gray-900 ml-1">Filtrar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Carrusel de marcas */}
      <View className="py-2">
        <FlatList
          data={brands}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedBrand(item.id === selectedBrand ? null : item.id)}
              className="items-center mr-2"
              style={{ width: 65, height: 58 }}
            >
              <View
                className="rounded-lg items-center justify-center mb-1"
                style={{
                  width: 45,
                  height: 45,
                  backgroundColor: selectedBrand === item.id ? '#EEF2FF' : 'white',
                  borderColor: 'rgba(0,0,0,0.1)',
                  borderWidth: 0.5,
                  borderRadius: 10
                }}
              >
                {item.id === 'apple' ? (
                  <Ionicons name="logo-apple" size={24} color="#000" />
                ) : (
                  <Text style={{
                    fontSize: item.id === 'samsung' ? 8 : item.id === 'xiaomi' ? 12 : 10,
                    fontWeight: item.id === 'xiaomi' ? '300' : 'bold',
                    color: item.id === 'xiaomi' ? '#FF6900' : '#000',
                    letterSpacing: item.id === 'samsung' ? 1 : 0
                  }}>
                    {item.logo}
                  </Text>
                )}
              </View>
              <Text style={{ fontSize: 10, color: 'rgba(0,0,0,0.5)', textAlign: 'center' }}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
        />
      </View>

      {/* Lista de productos */}
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        style={{ marginBottom: 90 }}
        contentContainerStyle={{ paddingTop: 8 }}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="text-gray-600 mt-4">Buscando...</Text>
          </View>
        ) : products.length > 0 ? (
          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        ) : (
          <View className="flex-1 items-center justify-center py-12">
            <Ionicons name="search-outline" size={64} color="#9CA3AF" />
            <Text className="text-xl font-bold text-gray-900 mb-2 mt-4">No encontramos resultados</Text>
            <Text className="text-base text-gray-600 text-center">
              Intenta con otras palabras
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal de filtros */}
      <FiltersModal
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        onApplyFilters={handleApplyFilters}
      />
    </SafeAreaView>
  );
}
