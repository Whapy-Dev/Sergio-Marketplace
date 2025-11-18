import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  submitStoreApplication,
  getUserStoreApplication,
} from '../../services/officialStores';
import type { CreateStoreApplicationData, StoreApplication } from '../../types/officialStore';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants/theme';

export default function RegisterOfficialStoreScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [existingApplication, setExistingApplication] = useState<StoreApplication | null>(null);
  const [checkingApplication, setCheckingApplication] = useState(true);

  // Form state
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessType, setBusinessType] = useState<'individual' | 'company' | 'corporation'>('individual');
  const [taxId, setTaxId] = useState('');
  const [legalName, setLegalName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [website, setWebsite] = useState('');

  useEffect(() => {
    checkExistingApplication();
  }, []);

  async function checkExistingApplication() {
    if (!user) return;

    setCheckingApplication(true);
    const application = await getUserStoreApplication(user.id);
    setExistingApplication(application);
    setCheckingApplication(false);
  }

  function validateForm(): boolean {
    if (!storeName.trim()) {
      Alert.alert('Error', 'El nombre de la tienda es requerido');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'La descripción es requerida');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Email inválido');
      return false;
    }
    if (!phone.trim()) {
      Alert.alert('Error', 'El teléfono es requerido');
      return false;
    }
    if (!taxId.trim()) {
      Alert.alert('Error', 'El CUIT/CUIL es requerido');
      return false;
    }
    if (!legalName.trim()) {
      Alert.alert('Error', 'El nombre legal/razón social es requerido');
      return false;
    }
    if (!address.trim() || !city.trim() || !state.trim() || !postalCode.trim()) {
      Alert.alert('Error', 'La dirección completa es requerida');
      return false;
    }

    return true;
  }

  async function handleSubmit() {
    if (!user) return;

    if (!validateForm()) return;

    setLoading(true);

    const applicationData: CreateStoreApplicationData = {
      store_name: storeName.trim(),
      description: description.trim(),
      email: email.trim(),
      phone: phone.trim(),
      business_type: businessType,
      tax_id: taxId.trim(),
      legal_name: legalName.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      postal_code: postalCode.trim(),
      website: website.trim() || undefined,
    };

    const result = await submitStoreApplication(user.id, applicationData);

    setLoading(false);

    if (result.success) {
      Alert.alert(
        '¡Solicitud Enviada!',
        'Tu solicitud para tienda oficial ha sido enviada. Nuestro equipo la revisará pronto y te notificaremos.',
        [
          {
            text: 'Entendido',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      Alert.alert(
        'Error',
        'No se pudo enviar la solicitud. Por favor intenta nuevamente.'
      );
    }
  }

  if (checkingApplication) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Show application status if exists
  if (existingApplication) {
    const statusConfig = {
      pending: {
        icon: 'time-outline' as const,
        color: '#F59E0B',
        title: 'Solicitud Pendiente',
        message: 'Tu solicitud está siendo revisada por nuestro equipo.',
      },
      under_review: {
        icon: 'search-outline' as const,
        color: '#3B82F6',
        title: 'En Revisión',
        message: 'Estamos revisando tu solicitud. Te contactaremos pronto.',
      },
      approved: {
        icon: 'checkmark-circle' as const,
        color: '#10B981',
        title: '¡Aprobada!',
        message: 'Tu tienda oficial ha sido aprobada y está activa.',
      },
      rejected: {
        icon: 'close-circle' as const,
        color: '#EF4444',
        title: 'Solicitud Rechazada',
        message: existingApplication.review_notes || 'Tu solicitud no fue aprobada.',
      },
    };

    const config = statusConfig[existingApplication.status];

    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        {/* Header */}
        <LinearGradient
          colors={['#2563EB', '#DC2626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="pb-4"
        >
          <View className="flex-row items-center px-4 pt-2">
            <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-white ml-2">Estado de Solicitud</Text>
          </View>
        </LinearGradient>

        <View className="flex-1 items-center justify-center px-8">
          <View className="bg-white rounded-2xl p-8 w-full shadow-lg">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: config.color + '20' }}
            >
              <Ionicons name={config.icon} size={48} color={config.color} />
            </View>

            <Text className="text-2xl font-bold text-center text-gray-900 mb-2">
              {config.title}
            </Text>

            <Text className="text-center text-gray-600 mb-6">
              {config.message}
            </Text>

            <View className="bg-gray-50 rounded-xl p-4 mb-6">
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-500">Fecha de solicitud:</Text>
                <Text className="text-sm font-medium text-gray-900">
                  {new Date(existingApplication.created_at).toLocaleDateString('es-AR')}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Nombre de tienda:</Text>
                <Text className="text-sm font-medium text-gray-900">
                  {existingApplication.application_data.store_name}
                </Text>
              </View>
            </View>

            {existingApplication.status === 'rejected' && (
              <TouchableOpacity
                onPress={() => setExistingApplication(null)}
                className="bg-blue-600 rounded-full py-3 items-center"
              >
                <Text className="text-white font-bold">Crear Nueva Solicitud</Text>
              </TouchableOpacity>
            )}

            {existingApplication.status !== 'rejected' && (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="bg-gray-200 rounded-full py-3 items-center"
              >
                <Text className="text-gray-700 font-bold">Volver</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#2563EB', '#DC2626']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="pb-4"
      >
        <View className="flex-row items-center px-4 pt-2">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white ml-2">Registrar Tienda Oficial</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-4">
            {/* Info Card */}
            <View className="bg-blue-50 rounded-xl p-4 mb-6">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={24} color="#3B82F6" />
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-semibold text-blue-900 mb-1">
                    Beneficios de ser Tienda Oficial
                  </Text>
                  <Text className="text-xs text-blue-700 leading-4">
                    • Badge verificado visible{'\n'}
                    • Mayor visibilidad en búsquedas{'\n'}
                    • Sección destacada en home{'\n'}
                    • Soporte prioritario
                  </Text>
                </View>
              </View>
            </View>

            {/* Form */}
            <View className="bg-white rounded-2xl p-4 mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Información de la Tienda
              </Text>

              {/* Store Name */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Tienda *
                </Text>
                <TextInput
                  value={storeName}
                  onChangeText={setStoreName}
                  placeholder="Ej: Samsung Store Argentina"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Description */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe tu tienda oficial"
                  multiline
                  numberOfLines={4}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                  textAlignVertical="top"
                />
              </View>

              {/* Email */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Email de Contacto *
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tienda@ejemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Phone */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+54 9 11 1234-5678"
                  keyboardType="phone-pad"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Website */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Sitio Web (Opcional)
                </Text>
                <TextInput
                  value={website}
                  onChangeText={setWebsite}
                  placeholder="https://www.ejemplo.com"
                  keyboardType="url"
                  autoCapitalize="none"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Business Info */}
            <View className="bg-white rounded-2xl p-4 mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Información Legal
              </Text>

              {/* Tax ID (CUIT/CUIL) */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  CUIT/CUIL *
                </Text>
                <TextInput
                  value={taxId}
                  onChangeText={setTaxId}
                  placeholder="XX-XXXXXXXX-X"
                  keyboardType="numeric"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Legal Name */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Razón Social / Nombre Legal *
                </Text>
                <TextInput
                  value={legalName}
                  onChangeText={setLegalName}
                  placeholder="Nombre completo o razón social"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Business Type */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Tipo de Negocio *
                </Text>
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() => setBusinessType('individual')}
                    className={`flex-1 py-3 rounded-l-xl border ${
                      businessType === 'individual'
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-center text-sm font-medium ${
                        businessType === 'individual' ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      Individual
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setBusinessType('company')}
                    className={`flex-1 py-3 border-t border-b ${
                      businessType === 'company'
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-center text-sm font-medium ${
                        businessType === 'company' ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      Empresa
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setBusinessType('corporation')}
                    className={`flex-1 py-3 rounded-r-xl border ${
                      businessType === 'corporation'
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-center text-sm font-medium ${
                        businessType === 'corporation' ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      Corporación
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Address Info */}
            <View className="bg-white rounded-2xl p-4 mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Dirección
              </Text>

              {/* Address */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Calle y Número *
                </Text>
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Av. Corrientes 1234"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* City */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Ciudad *
                </Text>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="Buenos Aires"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* State */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Provincia *
                </Text>
                <TextInput
                  value={state}
                  onChangeText={setState}
                  placeholder="Buenos Aires"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Postal Code */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Código Postal *
                </Text>
                <TextInput
                  value={postalCode}
                  onChangeText={setPostalCode}
                  placeholder="1000"
                  keyboardType="numeric"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className="bg-blue-600 rounded-full py-4 items-center mb-6"
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Enviar Solicitud</Text>
              )}
            </TouchableOpacity>

            {/* Terms */}
            <Text className="text-xs text-gray-500 text-center mb-8">
              Al enviar la solicitud, aceptas nuestros términos y condiciones para tiendas oficiales.
              Tu solicitud será revisada en 3-5 días hábiles.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
