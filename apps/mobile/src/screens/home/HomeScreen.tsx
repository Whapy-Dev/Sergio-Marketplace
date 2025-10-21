import React from 'react';
import { View, ScrollView, Text, FlatList } from 'react-native';
import Header from '../../components/home/Header';
import CategoryItem from '../../components/home/CategoryItem';
import ProductCard from '../../components/home/ProductCard';

// Datos de prueba
const CATEGORIES = [
  { id: '1', name: 'Electrónica', icon: '💻' },
  { id: '2', name: 'Hogar', icon: '🏠' },
  { id: '3', name: 'Moda', icon: '👕' },
  { id: '4', name: 'Deportes', icon: '⚽' },
  { id: '5', name: 'Juguetes', icon: '🧸' },
  { id: '6', name: 'Belleza', icon: '💄' },
];

const PRODUCTS = [
  { 
    id: '1', 
    name: 'iPhone 14 128GB', 
    price: 1749000, 
    compareAtPrice: 2099000,
  },
  { 
    id: '2', 
    name: 'Samsung Galaxy S25', 
    price: 1599999, 
    compareAtPrice: 1799999,
  },
  { 
    id: '3', 
    name: 'Notebook Lenovo i5', 
    price: 899999,
  },
  { 
    id: '4', 
    name: 'Smart TV 50 pulgadas', 
    price: 649999, 
    compareAtPrice: 899999,
  },
];

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-white">
      <Header />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Banner - Por ahora un placeholder */}
        <View className="bg-blue-100 h-48 mx-4 my-4 rounded-lg items-center justify-center">
          <Text className="text-4xl">🎉</Text>
          <Text className="text-lg font-bold text-primary mt-2">Ofertas especiales</Text>
        </View>
        
        {/* Categorías */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 px-4 mb-3">
            Categorías
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="px-4"
          >
            {CATEGORIES.map((category) => (
              <CategoryItem
                key={category.id}
                name={category.name}
                icon={category.icon}
                onPress={() => console.log('Categoría:', category.name)}
              />
            ))}
          </ScrollView>
        </View>
        
        {/* Ofertas únicas */}
        <View className="px-4 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Ofertas únicas 🔥
          </Text>
          
          <View className="flex-row flex-wrap justify-between">
            {PRODUCTS.map((product) => (
              <View key={product.id} className="w-[48%]">
                <ProductCard
                  name={product.name}
                  price={product.price}
                  compareAtPrice={product.compareAtPrice}
                  onPress={() => console.log('Producto:', product.name)}
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}