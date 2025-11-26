import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile, UserProfile } from '../../services/profile';
import { getUserOfficialStore, getUserStoreApplication } from '../../services/officialStores';
import type { OfficialStore, StoreApplication } from '../../types/officialStore';
import { supabase } from '../../services/supabase';
import { TAB_BAR_HEIGHT } from '../../navigation/AppNavigator';
import { COLORS } from '../../constants/theme';
import { scale, moderateScale, verticalScale } from '../../utils/responsive';

export default function ProfileScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [officialStore, setOfficialStore] = useState<OfficialStore | null>(null);
  const [storeApplication, setStoreApplication] = useState<StoreApplication | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadStoreData();
    }
  }, [user]);

  async function handleAvatarPress() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar la foto de perfil');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0] && user) {
      await uploadAvatar(result.assets[0].uri);
    }
  }

  async function uploadAvatar(uri: string) {
    if (!user) return;

    try {
      setUploadingAvatar(true);

      // Get file extension
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/avatar.${ext}`;

      // Read file as base64 for React Native
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, uint8Array, {
          cacheControl: '3600',
          upsert: true,
          contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Error', 'No se pudo subir la imagen. Verifica que el bucket "avatars" exista.');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl + '?t=' + Date.now() })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        Alert.alert('Error', 'No se pudo actualizar el perfil');
        return;
      }

      Alert.alert('¡Listo!', 'Tu foto de perfil ha sido actualizada');
      loadProfile();

    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Ocurrió un error al subir la imagen');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function loadProfile() {
    if (!user) return;

    setLoading(true);
    const data = await getUserProfile(user.id);
    setProfile(data);
    setLoading(false);
  }

  async function loadStoreData() {
    if (!user) return;

    // Check if user already has an official store
    const store = await getUserOfficialStore(user.id);
    setOfficialStore(store);

    // If no store, check if there's a pending application
    if (!store) {
      const application = await getUserStoreApplication(user.id);
      setStoreApplication(application);
    }
  }

  function handleSignOut() {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive', 
          onPress: async () => {
            await signOut();
            // NO navegues manualmente, AuthContext lo maneja automáticamente
          }
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Mi Perfil</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 20 }}>
        {/* Avatar y datos básicos */}
        <View className="items-center py-6 border-b border-gray-100">
          <TouchableOpacity
            onPress={handleAvatarPress}
            disabled={uploadingAvatar}
            className="relative mb-3"
          >
            <View className="w-24 h-24 rounded-full bg-primary items-center justify-center">
              {uploadingAvatar ? (
                <ActivityIndicator size="large" color="white" />
              ) : profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <Text className="text-4xl">👤</Text>
              )}
            </View>
            <View className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-gray-200">
              <Ionicons name="camera" size={scale(16)} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
          <Text className="text-xs text-gray-500 mb-2">Toca para cambiar foto</Text>
          <Text className="text-xl font-bold text-gray-900">
            {profile?.full_name || 'Usuario'}
          </Text>
          <Text className="text-base text-gray-600 mt-1">{profile?.email}</Text>
          {profile?.role === 'customer' && (
            <View className="mt-2 px-3 py-1 bg-gray-100 rounded-full">
              <Text className="text-xs text-gray-600 font-semibold">Comprador</Text>
            </View>
          )}
          {profile?.role === 'seller_individual' && (
            <View className="mt-2 px-3 py-1 bg-blue-100 rounded-full">
              <Text className="text-xs text-primary font-semibold">Vendedor</Text>
            </View>
          )}
          {profile?.role === 'seller_official' && (
            <View className="mt-2 px-3 py-1 bg-purple-100 rounded-full flex-row items-center">
              <Ionicons name="checkmark-circle" size={scale(12)} color="#9333EA" />
              <Text className="text-xs text-purple-700 font-semibold ml-1">Tienda Oficial</Text>
            </View>
          )}
        </View>

        {/* ==================== MENÚ PARA COMPRADORES ==================== */}
        {profile?.role === 'customer' && (
          <>
            {/* Convertirse en vendedor */}
            <View className="px-4 py-4">
              <TouchableOpacity
                onPress={async () => {
                  if (!user) return;
                  const { error } = await supabase
                    .from('profiles')
                    .update({ role: 'seller_individual' })
                    .eq('id', user.id);

                  if (!error) {
                    Alert.alert('¡Listo!', 'Ahora eres vendedor. Recarga la app.');
                    loadProfile();
                  }
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl py-4 px-4 flex-row items-center"
                style={{ backgroundColor: '#3B82F6' }}
              >
                <View className="bg-white/20 rounded-full p-2 mr-3">
                  <Ionicons name="storefront" size={scale(24)} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-base">Empezar a Vender</Text>
                  <Text className="text-white/80 text-sm">Publica tus productos y gana dinero</Text>
                </View>
                <Ionicons name="chevron-forward" size={scale(20)} color="white" />
              </TouchableOpacity>
            </View>

            {/* Mis Compras */}
            <View className="px-4 py-4 border-b border-gray-100">
              <Text className="text-sm font-semibold text-gray-500 mb-3">MIS COMPRAS</Text>

              <TouchableOpacity
                onPress={() => navigation.navigate('MyOrders')}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-2xl mr-3">📦</Text>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900">Mis Pedidos</Text>
                    <Text className="text-sm text-gray-500">Ver historial de compras</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={scale(20)} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('MyInvoices')}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-2xl mr-3">🧾</Text>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900">Mis Facturas</Text>
                    <Text className="text-sm text-gray-500">Comprobantes fiscales</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={scale(20)} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Mi Cuenta */}
            <View className="px-4 py-4 border-b border-gray-100">
              <Text className="text-sm font-semibold text-gray-500 mb-3">MI CUENTA</Text>

              <TouchableOpacity
                onPress={() => navigation.navigate('EditProfile')}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-2xl mr-3">👤</Text>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900">Datos Personales</Text>
                    <Text className="text-sm text-gray-500">Nombre, teléfono, dirección</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={scale(20)} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('ChangePassword')}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-2xl mr-3">🔒</Text>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900">Seguridad</Text>
                    <Text className="text-sm text-gray-500">Cambiar contraseña</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={scale(20)} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ==================== MENÚ PARA VENDEDORES INDIVIDUALES ==================== */}
        {profile?.role === 'seller_individual' && (
          <>
            {/* Acceso rápido a Dashboard */}
            <View className="px-4 py-4">
              <TouchableOpacity
                onPress={() => navigation.navigate('SellerDashboard')}
                className="bg-blue-600 rounded-xl py-4 px-4 flex-row items-center"
              >
                <View className="bg-white/20 rounded-full p-2 mr-3">
                  <Ionicons name="stats-chart" size={scale(24)} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-base">Mi Dashboard</Text>
                  <Text className="text-white/80 text-sm">Ver ventas y estadísticas</Text>
                </View>
                <Ionicons name="chevron-forward" size={scale(20)} color="white" />
              </TouchableOpacity>
            </View>

            {/* Gestión de Ventas */}
            <View className="px-4 py-4 border-b border-gray-100">
              <Text className="text-sm font-semibold text-gray-500 mb-3">GESTIÓN DE VENTAS</Text>

              <TouchableOpacity
                onPress={() => navigation.navigate('MyProducts')}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-2xl mr-3">📦</Text>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900">Mis Productos</Text>
                    <Text className="text-sm text-gray-500">Gestionar publicaciones</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={scale(20)} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('SellerOrders')}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-2xl mr-3">🛒</Text>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900">Pedidos Recibidos</Text>
                    <Text className="text-sm text-gray-500">Gestionar ventas</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={scale(20)} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Wallet')}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-2xl mr-3">💰</Text>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900">Mi Billetera</Text>
                    <Text className="text-sm text-gray-500">Saldo y retiros</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={scale(20)} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Convertirse en Tienda Oficial */}
            <View className="px-4 py-4 border-b border-gray-100">
              <Text className="text-sm font-semibold text-gray-500 mb-3">CRECER</Text>

              {officialStore ? (
                <TouchableOpacity
                  onPress={() => navigation.navigate('StoreDetail', { storeId: officialStore.id })}
                  className="flex-row items-center justify-between py-3 bg-purple-50 rounded-xl px-3"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="bg-purple-600 rounded-full p-2 mr-3">
                      <Ionicons name="checkmark-circle" size={scale(20)} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-gray-900">Mi Tienda Oficial</Text>
                      <Text className="text-sm text-purple-600">{officialStore.store_name}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={scale(20)} color="#9CA3AF" />
                </TouchableOpacity>
              ) : storeApplication ? (
                <TouchableOpacity
                  onPress={() => navigation.navigate('RegisterOfficialStore')}
                  className="flex-row items-center justify-between py-3 bg-yellow-50 rounded-xl px-3"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="bg-yellow-500 rounded-full p-2 mr-3">
                      <Ionicons name="time" size={scale(20)} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-gray-900">Solicitud en Proceso</Text>
                      <Text className="text-sm text-yellow-600">
                        {storeApplication.status === 'pending' && 'Pendiente de revisión'}
                        {storeApplication.status === 'under_review' && 'En revisión'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={scale(20)} color="#9CA3AF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => navigation.navigate('RegisterOfficialStore')}
                  className="flex-row items-center justify-between py-3 border-2 border-purple-200 border-dashed rounded-xl px-3"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="bg-purple-100 rounded-full p-2 mr-3">
                      <Ionicons name="star" size={scale(20)} color="#9333EA" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-purple-900">Ser Tienda Oficial</Text>
                      <Text className="text-sm text-purple-700">Badge + menor comisión + destacado</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={scale(20)} color="#9333EA" />
                </TouchableOpacity>
              )}
            </View>

            {/* Mis Compras (también puede comprar) */}
            <View className="px-4 py-4 border-b border-gray-100">
              <Text className="text-sm font-semibold text-gray-500 mb-3">MIS COMPRAS</Text>

              <TouchableOpacity
                onPress={() => navigation.navigate('MyOrders')}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-2xl mr-3">🛍️</Text>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900">Mis Pedidos</Text>
                    <Text className="text-sm text-gray-500">Compras realizadas</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={scale(20)} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Mi Cuenta */}
            <View className="px-4 py-4 border-b border-gray-100">
              <Text className="text-sm font-semibold text-gray-500 mb-3">MI CUENTA</Text>

              <TouchableOpacity
                onPress={() => navigation.navigate('EditProfile')}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-2xl mr-3">👤</Text>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900">Datos y Banco</Text>
                    <Text className="text-sm text-gray-500">Perfil, CBU/CVU, datos fiscales</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={scale(20)} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('ChangePassword')}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-2xl mr-3">🔒</Text>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900">Seguridad</Text>
                    <Text className="text-sm text-gray-500">Cambiar contraseña</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={scale(20)} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ==================== MENÚ PARA TIENDAS OFICIALES ==================== */}
        {profile?.role === 'seller_official' && (
          <>
            {/* Dashboard Pro */}
            <View className="px-4 py-4">
              <TouchableOpacity
                onPress={() => navigation.navigate('OfficialStoreDashboard')}
                className="rounded-xl py-4 px-4 flex-row items-center"
                style={{ backgroundColor: '#9333EA' }}
              >
                <View className="bg-white/20 rounded-full p-2 mr-3">
                  <Ionicons name="analytics" size={scale(24)} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-base">Dashboard Pro</Text>
                  <Text className="text-white/80 text-sm">Analytics avanzados y métricas</Text>
                </View>
                <View className="bg-white/20 rounded-full px-2 py-1">
                  <Text className="text-white text-xs font-bold">PRO</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Gestión Tienda */}
            <View className="px-4 py-4 border-b border-gray-100">
              <Text className="text-sm font-semibold text-gray-500 mb-3">MI TIENDA OFICIAL</Text>

              <TouchableOpacity
                onPress={() => navigation.navigate('MyProducts')}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-2xl mr-3">📦</Text>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900">Catálogo</Text>
                    <Text className="text-sm text-gray-500">Gestionar productos</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={scale(20)} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('SellerOrders')}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-2xl mr-3">🛒</Text>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900">Pedidos</Text>
                    <Text className="text-sm text-gray-500">Gestionar ventas</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={scale(20)} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Wallet')}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-2xl mr-3">💰</Text>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900">Billetera</Text>
                    <Text className="text-sm text-gray-500">Saldo y retiros</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={scale(20)} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('SellerAnalytics')}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-2xl mr-3">📊</Text>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900">Analytics</Text>
                    <Text className="text-sm text-gray-500">Reportes detallados</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={scale(20)} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Beneficios Tienda Oficial */}
            <View className="px-4 py-4 border-b border-gray-100">
              <Text className="text-sm font-semibold text-gray-500 mb-3">TUS BENEFICIOS</Text>

              <View className="bg-purple-50 rounded-xl p-4">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="checkmark-circle" size={scale(20)} color="#9333EA" />
                  <Text className="text-sm text-purple-900 ml-2">Badge de tienda verificada</Text>
                </View>
                <View className="flex-row items-center mb-3">
                  <Ionicons name="checkmark-circle" size={scale(20)} color="#9333EA" />
                  <Text className="text-sm text-purple-900 ml-2">Comisión reducida en ventas</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={scale(20)} color="#9333EA" />
                  <Text className="text-sm text-purple-900 ml-2">Prioridad en búsquedas</Text>
                </View>
              </View>
            </View>

            {/* Mi Cuenta */}
            <View className="px-4 py-4 border-b border-gray-100">
              <Text className="text-sm font-semibold text-gray-500 mb-3">MI CUENTA</Text>

              <TouchableOpacity
                onPress={() => navigation.navigate('EditProfile')}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-2xl mr-3">👤</Text>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900">Datos Fiscales</Text>
                    <Text className="text-sm text-gray-500">Perfil, CBU/CVU, CUIT</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={scale(20)} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('ChangePassword')}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-2xl mr-3">🔒</Text>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900">Seguridad</Text>
                    <Text className="text-sm text-gray-500">Cambiar contraseña</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={scale(20)} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Configuración */}
        <View className="px-4 py-4 border-b border-gray-100">
          <Text className="text-sm font-semibold text-gray-500 mb-3">CONFIGURACIÓN</Text>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('Notifications')}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-2xl mr-3">🔔</Text>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">Notificaciones</Text>
                <Text className="text-sm text-gray-500">Configurar alertas</Text>
              </View>
            </View>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Language')}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-2xl mr-3">🌎</Text>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">Idioma</Text>
                <Text className="text-sm text-gray-500">Español</Text>
              </View>
            </View>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>
        </View>

        {/* Soporte */}
        <View className="px-4 py-4 border-b border-gray-100">
          <Text className="text-sm font-semibold text-gray-500 mb-3">SOPORTE</Text>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('Help')}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-2xl mr-3">❓</Text>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">Ayuda y Soporte</Text>
                <Text className="text-sm text-gray-500">Preguntas frecuentes</Text>
              </View>
            </View>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Terms')}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-2xl mr-3">📄</Text>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">Términos y Condiciones</Text>
                <Text className="text-sm text-gray-500">Políticas de uso</Text>
              </View>
            </View>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>
        </View>

        {/* Acciones */}
        <View className="px-4 py-4">
          <TouchableOpacity 
            onPress={handleSignOut}
            className="bg-red-50 rounded-lg py-4 mb-3"
          >
            <Text className="text-red-600 font-semibold text-center text-base">
              Cerrar Sesión
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('DeleteAccount')}
            className="py-3"
          >
            <Text className="text-gray-400 text-center text-sm">
              Eliminar cuenta
            </Text>
          </TouchableOpacity>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}