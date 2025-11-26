import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Switch, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';
import { scale, moderateScale, hp } from '../../utils/responsive';

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
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{
          backgroundColor: '#FFF',
          borderTopLeftRadius: scale(24),
          borderTopRightRadius: scale(24),
          height: hp(85),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 5,
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: scale(20),
            paddingTop: scale(24),
            paddingBottom: scale(16),
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: moderateScale(20), fontWeight: 'bold', color: '#111827' }}>Filtros</Text>
              {activeFiltersCount > 0 && (
                <View style={{
                  backgroundColor: '#3B82F6',
                  borderRadius: scale(10),
                  width: scale(20),
                  height: scale(20),
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: scale(8),
                }}>
                  <Text style={{ color: '#FFF', fontSize: moderateScale(11), fontWeight: 'bold' }}>{activeFiltersCount}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: scale(4) }}>
              <Ionicons name="close" size={scale(24)} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Contenido scrollable */}
          <ScrollView style={{ flex: 1, paddingHorizontal: scale(20) }} showsVerticalScrollIndicator={false}>
            {/* Switches */}
            <View style={{ paddingVertical: scale(16) }}>
              {/* Envío gratis */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: scale(12) }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="car-outline" size={scale(20)} color="#10B981" />
                  <Text style={{ fontSize: moderateScale(16), color: '#111827', marginLeft: scale(12) }}>Envío gratis</Text>
                </View>
                <Switch
                  value={filters.freeShipping}
                  onValueChange={(value) => setFilters({ ...filters, freeShipping: value })}
                  trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                  thumbColor="#fff"
                />
              </View>

              {/* Cuotas sin interés */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: scale(12) }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="card-outline" size={scale(20)} color="#3B82F6" />
                  <Text style={{ fontSize: moderateScale(16), color: '#111827', marginLeft: scale(12) }}>Cuotas sin interés</Text>
                </View>
                <Switch
                  value={filters.installments}
                  onValueChange={(value) => setFilters({ ...filters, installments: value })}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                  thumbColor="#fff"
                />
              </View>

              {/* Retiro inmediato */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: scale(12) }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="storefront-outline" size={scale(20)} color="#8B5CF6" />
                  <Text style={{ fontSize: moderateScale(16), color: '#111827', marginLeft: scale(12) }}>Retiro inmediato</Text>
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
            <View style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
              {/* Ordenar por */}
              <TouchableOpacity
                style={{ paddingVertical: scale(16), borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                onPress={() => toggleSection('sortBy')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontSize: moderateScale(16), fontWeight: '600', color: '#111827' }}>Ordenar por</Text>
                    <Text style={{ fontSize: moderateScale(14), color: '#6B7280', marginTop: scale(4) }}>{filters.sortBy}</Text>
                  </View>
                  <Ionicons
                    name={expandedSections['sortBy'] ? 'chevron-up' : 'chevron-down'}
                    size={scale(20)}
                    color="#9CA3AF"
                  />
                </View>
              </TouchableOpacity>

              {expandedSections['sortBy'] && (
                <View style={{ backgroundColor: '#F9FAFB', paddingHorizontal: scale(16), paddingVertical: scale(8), marginBottom: scale(8), borderRadius: scale(8) }}>
                  {SORT_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setFilters({ ...filters, sortBy: option })}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: scale(12) }}
                    >
                      <Text style={{ fontSize: moderateScale(16), color: filters.sortBy === option ? '#2563EB' : '#374151', fontWeight: filters.sortBy === option ? '500' : '400' }}>
                        {option}
                      </Text>
                      {filters.sortBy === option && (
                        <Ionicons name="checkmark" size={scale(20)} color="#3B82F6" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Precio */}
              <TouchableOpacity
                style={{ paddingVertical: scale(16), borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                onPress={() => toggleSection('price')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontSize: moderateScale(16), fontWeight: '600', color: '#111827' }}>Rango de precio</Text>
                    {(minPriceText || maxPriceText) && (
                      <Text style={{ fontSize: moderateScale(14), color: '#6B7280', marginTop: scale(4) }}>
                        {minPriceText ? `$${minPriceText}` : '$0'} - {maxPriceText ? `$${maxPriceText}` : 'Sin límite'}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name={expandedSections['price'] ? 'chevron-up' : 'chevron-down'}
                    size={scale(20)}
                    color="#9CA3AF"
                  />
                </View>
              </TouchableOpacity>

              {expandedSections['price'] && (
                <View style={{ backgroundColor: '#F9FAFB', paddingHorizontal: scale(16), paddingVertical: scale(16), marginBottom: scale(8), borderRadius: scale(8) }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1, marginRight: scale(8) }}>
                      <Text style={{ fontSize: moderateScale(12), color: '#6B7280', marginBottom: scale(4) }}>Mínimo</Text>
                      <TextInput
                        style={{
                          backgroundColor: '#FFF',
                          borderWidth: 1,
                          borderColor: '#E5E7EB',
                          borderRadius: scale(8),
                          paddingHorizontal: scale(12),
                          paddingVertical: scale(8),
                          fontSize: moderateScale(16),
                        }}
                        placeholder="$0"
                        value={minPriceText}
                        onChangeText={setMinPriceText}
                        keyboardType="number-pad"
                      />
                    </View>
                    <Text style={{ color: '#9CA3AF', marginHorizontal: scale(8) }}>-</Text>
                    <View style={{ flex: 1, marginLeft: scale(8) }}>
                      <Text style={{ fontSize: moderateScale(12), color: '#6B7280', marginBottom: scale(4) }}>Máximo</Text>
                      <TextInput
                        style={{
                          backgroundColor: '#FFF',
                          borderWidth: 1,
                          borderColor: '#E5E7EB',
                          borderRadius: scale(8),
                          paddingHorizontal: scale(12),
                          paddingVertical: scale(8),
                          fontSize: moderateScale(16),
                        }}
                        placeholder="Sin límite"
                        value={maxPriceText}
                        onChangeText={setMaxPriceText}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                  {/* Quick price ranges */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: scale(12) }}>
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
                        style={{
                          backgroundColor: '#FFF',
                          borderWidth: 1,
                          borderColor: '#E5E7EB',
                          borderRadius: scale(20),
                          paddingHorizontal: scale(12),
                          paddingVertical: scale(6),
                          marginRight: scale(8),
                          marginBottom: scale(8),
                        }}
                      >
                        <Text style={{ fontSize: moderateScale(12), color: '#374151' }}>{range.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Condición */}
              <TouchableOpacity
                style={{ paddingVertical: scale(16), borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                onPress={() => toggleSection('condition')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: moderateScale(16), fontWeight: '600', color: '#111827' }}>Condición</Text>
                  <Ionicons
                    name={expandedSections['condition'] ? 'chevron-up' : 'chevron-down'}
                    size={scale(20)}
                    color="#9CA3AF"
                  />
                </View>
              </TouchableOpacity>

              {expandedSections['condition'] && (
                <View style={{ backgroundColor: '#F9FAFB', paddingHorizontal: scale(16), paddingVertical: scale(8), marginBottom: scale(8), borderRadius: scale(8) }}>
                  {['Todos', 'Nuevo', 'Usado'].map((condition) => (
                    <TouchableOpacity
                      key={condition}
                      onPress={() => setFilters({ ...filters, category: condition === 'Todos' ? '' : condition })}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: scale(12) }}
                    >
                      <Text style={{
                        fontSize: moderateScale(16),
                        color: (filters.category === condition || (condition === 'Todos' && !filters.category)) ? '#2563EB' : '#374151',
                        fontWeight: (filters.category === condition || (condition === 'Todos' && !filters.category)) ? '500' : '400'
                      }}>
                        {condition}
                      </Text>
                      {(filters.category === condition || (condition === 'Todos' && !filters.category)) && (
                        <Ionicons name="checkmark" size={scale(20)} color="#3B82F6" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Espacio para botones */}
            <View style={{ height: scale(120) }} />
          </ScrollView>

          {/* Botones fijos */}
          <View style={{
            borderTopWidth: 1,
            borderTopColor: '#F3F4F6',
            paddingHorizontal: scale(20),
            paddingVertical: scale(16),
            backgroundColor: '#FFF',
          }}>
            {/* Botón Mostrar resultados */}
            <TouchableOpacity onPress={handleApplyFilters} style={{ marginBottom: scale(12) }}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: scale(12),
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: scale(48),
                }}
              >
                <Text style={{ color: '#FFF', fontSize: moderateScale(16), fontWeight: '600' }}>Aplicar filtros</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Botón Borrar filtros */}
            {activeFiltersCount > 0 && (
              <TouchableOpacity
                onPress={handleClearFilters}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: scale(40),
                }}
              >
                <Text style={{ color: '#9CA3AF', fontSize: moderateScale(16) }}>Borrar filtros</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
