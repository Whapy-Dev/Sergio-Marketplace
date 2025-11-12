import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Switch } from 'react-native';
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

export default function FiltersModal({ visible, onClose, onApplyFilters }: FiltersModalProps) {
  const [filters, setFilters] = useState<FilterState>({
    installments: false,
    freeShipping: false,
    arrivesToday: false,
    arrivesTomorrow: false,
    immediatePickup: false,
    sortBy: 'Más relevantes',
    category: 'Celulares',
  });

  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
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
      category: 'Celulares',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View className="bg-white rounded-t-[70px] shadow-lg" style={{ height: '90%' }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pt-8 pb-4">
            <Text className="text-xl text-gray-900">Filtros</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Contenido scrollable */}
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {/* Switches */}
            <View className="mb-6">
              {/* Cuotas sin interés */}
              <View className="flex-row items-center justify-between py-3">
                <Text className="text-base text-gray-900 font-light">Cuotas sin interés</Text>
                <Switch
                  value={filters.installments}
                  onValueChange={(value) => setFilters({ ...filters, installments: value })}
                  trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
                  thumbColor="#fff"
                />
              </View>

              {/* Envío gratis */}
              <View className="flex-row items-center justify-between py-3">
                <Text className="text-base text-gray-900 font-light">Envío gratis</Text>
                <Switch
                  value={filters.freeShipping}
                  onValueChange={(value) => setFilters({ ...filters, freeShipping: value })}
                  trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
                  thumbColor="#fff"
                />
              </View>

              {/* Llega hoy */}
              <View className="flex-row items-center justify-between py-3">
                <Text className="text-base text-gray-900 font-light">Llega hoy</Text>
                <Switch
                  value={filters.arrivesToday}
                  onValueChange={(value) => setFilters({ ...filters, arrivesToday: value })}
                  trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
                  thumbColor="#fff"
                />
              </View>

              {/* Llega mañana */}
              <View className="flex-row items-center justify-between py-3">
                <Text className="text-base text-gray-900 font-light">Llega mañana</Text>
                <Switch
                  value={filters.arrivesTomorrow}
                  onValueChange={(value) => setFilters({ ...filters, arrivesTomorrow: value })}
                  trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
                  thumbColor="#fff"
                />
              </View>

              {/* Retiro inmediato */}
              <View className="flex-row items-center justify-between py-3">
                <Text className="text-base text-gray-900 font-light">Retiro inmediato</Text>
                <Switch
                  value={filters.immediatePickup}
                  onValueChange={(value) => setFilters({ ...filters, immediatePickup: value })}
                  trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {/* Secciones expandibles */}
            <View className="border-t border-gray-200">
              {/* Ordenar por */}
              <TouchableOpacity
                className="border-b border-gray-200 py-4"
                onPress={() => toggleSection('sortBy')}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-base font-medium text-gray-900 mb-1">Ordenar por</Text>
                    <Text className="text-sm font-light text-gray-900">{filters.sortBy}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#000"
                  />
                </View>
              </TouchableOpacity>

              {/* Formas de pago */}
              <TouchableOpacity
                className="border-b border-gray-200 py-4"
                onPress={() => toggleSection('payment')}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-medium text-gray-900">Formas de pago</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#000"
                  />
                </View>
              </TouchableOpacity>

              {/* Precio */}
              <TouchableOpacity
                className="border-b border-gray-200 py-4"
                onPress={() => toggleSection('price')}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-medium text-gray-900">Precio</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#000"
                  />
                </View>
              </TouchableOpacity>

              {/* Categorías */}
              <TouchableOpacity
                className="border-b border-gray-200 py-4"
                onPress={() => toggleSection('categories')}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-base font-medium text-gray-900 mb-1">Categorías</Text>
                    <Text className="text-sm font-light text-gray-900">{filters.category}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#000"
                  />
                </View>
              </TouchableOpacity>

              {/* Marcas */}
              <TouchableOpacity
                className="border-b border-gray-200 py-4"
                onPress={() => toggleSection('brands')}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-medium text-gray-900">Marcas</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#000"
                  />
                </View>
              </TouchableOpacity>

              {/* Memoria */}
              <TouchableOpacity
                className="border-b border-gray-200 py-4"
                onPress={() => toggleSection('memory')}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-medium text-gray-900">Memoria</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#000"
                  />
                </View>
              </TouchableOpacity>

              {/* Promociones */}
              <TouchableOpacity
                className="border-b border-gray-200 py-4"
                onPress={() => toggleSection('promotions')}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-medium text-gray-900">Promociones</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#000"
                  />
                </View>
              </TouchableOpacity>

              {/* Descuentos */}
              <TouchableOpacity
                className="border-b border-gray-200 py-4"
                onPress={() => toggleSection('discounts')}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-medium text-gray-900">Descuentos</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#000"
                  />
                </View>
              </TouchableOpacity>

              {/* Tipo de entrega */}
              <TouchableOpacity
                className="border-b border-gray-200 py-4"
                onPress={() => toggleSection('deliveryType')}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-medium text-gray-900">Tipo de entrega</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#000"
                  />
                </View>
              </TouchableOpacity>
            </View>

            {/* Espacio para botones */}
            <View style={{ height: 150 }} />
          </ScrollView>

          {/* Botones fijos */}
          <View className="border-t border-gray-200 px-8 py-5 bg-white">
            {/* Botón Mostrar resultados */}
            <TouchableOpacity onPress={handleApplyFilters} className="mb-3">
              <LinearGradient
                colors={['#2563EB', '#DC2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded items-center justify-center"
                style={{ height: 35 }}
              >
                <Text className="text-white text-lg font-medium">Mostrar resultados</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Botón Borrar filtros */}
            <TouchableOpacity
              onPress={handleClearFilters}
              className="border border-gray-400 rounded items-center justify-center"
              style={{ height: 35 }}
            >
              <Text className="text-gray-500 text-lg">Borrar filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
