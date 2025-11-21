import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Switch, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';

interface FiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
}

export interface FilterState {
  installments: boolean;
  freeShipping: boolean;
  arrivesToday: boolean;
  arrivesTomorrow: boolean;
  immediatePickup: boolean;
  sortBy: string;
  category: string;
  minPrice?: number;
  maxPrice?: number;
}

const SORT_OPTIONS = [
  'Más relevantes',
  'Menor precio',
  'Mayor precio',
  'Más vendidos',
];

export default function FiltersModal({ visible, onClose, onApplyFilters }: FiltersModalProps) {
  const [filters, setFilters] = useState<FilterState>({
    installments: false,
    freeShipping: false,
    arrivesToday: false,
    arrivesTomorrow: false,
    immediatePickup: false,
    sortBy: 'Más relevantes',
    category: '',
  });

  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [minPriceText, setMinPriceText] = useState('');
  const [maxPriceText, setMaxPriceText] = useState('');

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleApplyFilters = () => {
    const filtersToApply = {
      ...filters,
      minPrice: minPriceText ? parseInt(minPriceText) : undefined,
      maxPrice: maxPriceText ? parseInt(maxPriceText) : undefined,
    };
    onApplyFilters(filtersToApply);
    onClose();
  };

  const handleClearFilters = () => {
    setFilters({
      installments: false,
      freeShipping: false,
      arrivesToday: false,
      arrivesTomorrow: false,
      immediatePickup: false,
      sortBy: 'Más relevantes',
      category: '',
    });
    setMinPriceText('');
    setMaxPriceText('');
  };

  const activeFiltersCount = [
    filters.installments,
    filters.freeShipping,
    filters.arrivesToday,
    filters.arrivesTomorrow,
    filters.immediatePickup,
    filters.sortBy !== 'Más relevantes',
    minPriceText !== '',
    maxPriceText !== '',
  ].filter(Boolean).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View className="bg-white rounded-t-3xl shadow-lg" style={{ height: '85%' }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pt-6 pb-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Text className="text-xl font-bold text-gray-900">Filtros</Text>
              {activeFiltersCount > 0 && (
                <View className="bg-blue-500 rounded-full w-5 h-5 items-center justify-center ml-2">
                  <Text className="text-white text-xs font-bold">{activeFiltersCount}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Contenido scrollable */}
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {/* Switches */}
            <View className="py-4">
              {/* Envío gratis */}
              <View className="flex-row items-center justify-between py-3">
                <View className="flex-row items-center">
                  <Ionicons name="car-outline" size={20} color="#10B981" />
                  <Text className="text-base text-gray-900 ml-3">Envío gratis</Text>
                </View>
                <Switch
                  value={filters.freeShipping}
                  onValueChange={(value) => setFilters({ ...filters, freeShipping: value })}
                  trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                  thumbColor="#fff"
                />
              </View>

              {/* Cuotas sin interés */}
              <View className="flex-row items-center justify-between py-3">
                <View className="flex-row items-center">
                  <Ionicons name="card-outline" size={20} color="#3B82F6" />
                  <Text className="text-base text-gray-900 ml-3">Cuotas sin interés</Text>
                </View>
                <Switch
                  value={filters.installments}
                  onValueChange={(value) => setFilters({ ...filters, installments: value })}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                  thumbColor="#fff"
                />
              </View>

              {/* Retiro inmediato */}
              <View className="flex-row items-center justify-between py-3">
                <View className="flex-row items-center">
                  <Ionicons name="storefront-outline" size={20} color="#8B5CF6" />
                  <Text className="text-base text-gray-900 ml-3">Retiro inmediato</Text>
                </View>
                <Switch
                  value={filters.immediatePickup}
                  onValueChange={(value) => setFilters({ ...filters, immediatePickup: value })}
                  trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {/* Secciones expandibles */}
            <View className="border-t border-gray-100">
              {/* Ordenar por */}
              <TouchableOpacity
                className="py-4 border-b border-gray-100"
                onPress={() => toggleSection('sortBy')}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-base font-semibold text-gray-900">Ordenar por</Text>
                    <Text className="text-sm text-gray-500 mt-1">{filters.sortBy}</Text>
                  </View>
                  <Ionicons
                    name={expandedSections['sortBy'] ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#9CA3AF"
                  />
                </View>
              </TouchableOpacity>

              {expandedSections['sortBy'] && (
                <View className="bg-gray-50 px-4 py-2 mb-2 rounded-lg">
                  {SORT_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setFilters({ ...filters, sortBy: option })}
                      className="flex-row items-center justify-between py-3"
                    >
                      <Text className={`text-base ${filters.sortBy === option ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                        {option}
                      </Text>
                      {filters.sortBy === option && (
                        <Ionicons name="checkmark" size={20} color="#3B82F6" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Precio */}
              <TouchableOpacity
                className="py-4 border-b border-gray-100"
                onPress={() => toggleSection('price')}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-base font-semibold text-gray-900">Rango de precio</Text>
                    {(minPriceText || maxPriceText) && (
                      <Text className="text-sm text-gray-500 mt-1">
                        {minPriceText ? `$${minPriceText}` : '$0'} - {maxPriceText ? `$${maxPriceText}` : 'Sin límite'}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name={expandedSections['price'] ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#9CA3AF"
                  />
                </View>
              </TouchableOpacity>

              {expandedSections['price'] && (
                <View className="bg-gray-50 px-4 py-4 mb-2 rounded-lg">
                  <View className="flex-row items-center">
                    <View className="flex-1 mr-2">
                      <Text className="text-xs text-gray-500 mb-1">Mínimo</Text>
                      <TextInput
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-base"
                        placeholder="$0"
                        value={minPriceText}
                        onChangeText={setMinPriceText}
                        keyboardType="number-pad"
                      />
                    </View>
                    <Text className="text-gray-400 mx-2">-</Text>
                    <View className="flex-1 ml-2">
                      <Text className="text-xs text-gray-500 mb-1">Máximo</Text>
                      <TextInput
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-base"
                        placeholder="Sin límite"
                        value={maxPriceText}
                        onChangeText={setMaxPriceText}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                  {/* Quick price ranges */}
                  <View className="flex-row flex-wrap mt-3">
                    {[
                      { label: 'Hasta $10.000', min: '', max: '10000' },
                      { label: '$10.000 - $50.000', min: '10000', max: '50000' },
                      { label: '$50.000 - $100.000', min: '50000', max: '100000' },
                      { label: 'Más de $100.000', min: '100000', max: '' },
                    ].map((range, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setMinPriceText(range.min);
                          setMaxPriceText(range.max);
                        }}
                        className="bg-white border border-gray-200 rounded-full px-3 py-1.5 mr-2 mb-2"
                      >
                        <Text className="text-xs text-gray-700">{range.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Condición */}
              <TouchableOpacity
                className="py-4 border-b border-gray-100"
                onPress={() => toggleSection('condition')}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-semibold text-gray-900">Condición</Text>
                  <Ionicons
                    name={expandedSections['condition'] ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#9CA3AF"
                  />
                </View>
              </TouchableOpacity>

              {expandedSections['condition'] && (
                <View className="bg-gray-50 px-4 py-2 mb-2 rounded-lg">
                  {['Todos', 'Nuevo', 'Usado'].map((condition) => (
                    <TouchableOpacity
                      key={condition}
                      onPress={() => setFilters({ ...filters, category: condition === 'Todos' ? '' : condition })}
                      className="flex-row items-center justify-between py-3"
                    >
                      <Text className={`text-base ${
                        (filters.category === condition || (condition === 'Todos' && !filters.category))
                          ? 'text-blue-600 font-medium'
                          : 'text-gray-700'
                      }`}>
                        {condition}
                      </Text>
                      {(filters.category === condition || (condition === 'Todos' && !filters.category)) && (
                        <Ionicons name="checkmark" size={20} color="#3B82F6" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Espacio para botones */}
            <View style={{ height: 120 }} />
          </ScrollView>

          {/* Botones fijos */}
          <View className="border-t border-gray-100 px-5 py-4 bg-white">
            {/* Botón Mostrar resultados */}
            <TouchableOpacity onPress={handleApplyFilters} className="mb-3">
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-xl items-center justify-center"
                style={{ height: 48 }}
              >
                <Text className="text-white text-base font-semibold">Aplicar filtros</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Botón Borrar filtros */}
            {activeFiltersCount > 0 && (
              <TouchableOpacity
                onPress={handleClearFilters}
                className="items-center justify-center"
                style={{ height: 40 }}
              >
                <Text className="text-gray-500 text-base">Borrar filtros</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
