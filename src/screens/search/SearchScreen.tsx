import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import ProductCard from '../../components/home/ProductCard';
import { COLORS } from '../../constants/theme';

export default function SearchScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .eq('status', 'active')
        .limit(20);

      if (error) {
        console.error('Error searching:', error);
      } else {
        setResults(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-primary text-2xl">←</Text>
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1">
        <View className="p-4">
          <TextInput
            className="bg-gray-100 rounded-full px-4 py-3"
            placeholder="Buscar..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
        {loading && <ActivityIndicator size="large" color={COLORS.primary} />}
        {!loading && results.length > 0 && (
          <View className="px-4">
            {results.map((product) => (
              <Text key={product.id}>{product.name}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}