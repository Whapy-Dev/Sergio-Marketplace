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
import { COLORS } from '../../constants/theme';

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

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 80 }}>
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
              <Ionicons name="camera" size={16} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
          <Text className="text-xs text-gray-500 mb-2">Toca para cambiar foto</Text>
          <Text className="text-xl font-bold text-gray-900">
            {profile?.full_name || 'Usuario'}
          </Text>
          <Text className="text-base text-gray-600 mt-1">{profile?.email}</Text>
          {profile?.role === 'seller_individual' && (
            <View className="mt-2 px-3 py-1 bg-blue-100 rounded-full">
              <Text className="text-xs text-primary font-semibold">Vendedor</Text>
            </View>
          )}
        </View>

        {/* TEMPORAL: Botón para hacerse vendedor */}
        {profile?.role === 'customer' && (
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
              className="bg-green-500 rounded-lg py-3"
            >
              <Text className="text-white font-semibold text-center">Convertirme en Vendedor</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Información personal */}
        <View className="px-4 py-4 border-b border-gray-100">
          <Text className="text-sm font-semibold text-gray-500 mb-3">INFORMACIÓN PERSONAL</Text>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('EditProfile')}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-2xl mr-3">📝</Text>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">Editar Perfil</Text>
                <Text className="text-sm text-gray-500">Nombre, teléfono, dirección</Text>
              </View>
            </View>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('ChangePassword')}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-2xl mr-3">🔒</Text>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">Cambiar Contraseña</Text>
                <Text className="text-sm text-gray-500">Actualizar tu contraseña</Text>
              </View>
            </View>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>
        </View>

        {/* Mis actividades */}
        <View className="px-4 py-4 border-b border-gray-100">
          <Text className="text-sm font-semibold text-gray-500 mb-3">MIS ACTIVIDADES</Text>
          
          {/* Dashboard Vendedor - SOLO SI ES VENDEDOR INDIVIDUAL */}
          {profile?.role === 'seller_individual' && (
            <TouchableOpacity
              onPress={() => navigation.navigate('SellerDashboard')}
              className="flex-row items-center justify-between py-3"
            >
              <View className="flex-row items-center flex-1">
                <Text className="text-2xl mr-3">📊</Text>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">Dashboard Vendedor</Text>
                  <Text className="text-sm text-gray-500">Estadísticas y métricas</Text>
                </View>
              </View>
              <Text className="text-gray-400">→</Text>
            </TouchableOpacity>
          )}

          {/* Dashboard Tienda Oficial - SOLO SI ES TIENDA OFICIAL */}
          {profile?.role === 'seller_official' && (
            <TouchableOpacity
              onPress={() => navigation.navigate('OfficialStoreDashboard')}
              className="flex-row items-center justify-between py-3"
            >
              <View className="flex-row items-center flex-1">
                <Text className="text-2xl mr-3">🏪</Text>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">Dashboard Pro</Text>
                  <Text className="text-sm text-gray-500">Métricas avanzadas de tienda</Text>
                </View>
              </View>
              <Text className="text-gray-400">→</Text>
            </TouchableOpacity>
          )}

          {/* Mi Billetera - SOLO SI ES VENDEDOR */}
          {(profile?.role === 'seller_individual' || profile?.role === 'seller_official') && (
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
              <Text className="text-gray-400">→</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => navigation.navigate('MyOrders')}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-2xl mr-3">📦</Text>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">Mis Compras</Text>
                <Text className="text-sm text-gray-500">Historial de pedidos</Text>
              </View>
            </View>
            <Text className="text-gray-400">→</Text>
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
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>

          {profile?.role === 'seller_individual' && (
            <TouchableOpacity
              onPress={() => navigation.navigate('MyProducts')}
              className="flex-row items-center justify-between py-3"
            >
              <View className="flex-row items-center flex-1">
                <Text className="text-2xl mr-3">🏪</Text>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">Mis Publicaciones</Text>
                  <Text className="text-sm text-gray-500">Productos que vendés</Text>
                </View>
              </View>
              <Text className="text-gray-400">→</Text>
            </TouchableOpacity>
          )}

          {/* Tienda Oficial */}
          {profile?.role === 'seller_individual' && (
            <>
              {officialStore ? (
                // Ya tiene tienda oficial aprobada
                <TouchableOpacity
                  onPress={() => navigation.navigate('StoreDetail', { storeId: officialStore.id })}
                  className="flex-row items-center justify-between py-3 bg-blue-50 rounded-xl px-3 mb-2"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="bg-blue-600 rounded-full p-2 mr-3">
                      <Ionicons name="storefront" size={20} color="white" />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-base font-bold text-gray-900">Mi Tienda Oficial</Text>
                        <View className="bg-blue-600 rounded-full ml-2 px-2 py-0.5">
                          <Text className="text-white text-xs font-bold">OFICIAL</Text>
                        </View>
                      </View>
                      <Text className="text-sm text-gray-600">{officialStore.store_name}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ) : storeApplication ? (
                // Tiene aplicación pendiente
                <TouchableOpacity
                  onPress={() => navigation.navigate('RegisterOfficialStore')}
                  className="flex-row items-center justify-between py-3 bg-yellow-50 rounded-xl px-3 mb-2"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="bg-yellow-500 rounded-full p-2 mr-3">
                      <Ionicons name="time" size={20} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-gray-900">Solicitud Enviada</Text>
                      <Text className="text-sm text-gray-600">
                        {storeApplication.status === 'pending' && 'Pendiente de revisión'}
                        {storeApplication.status === 'under_review' && 'En revisión'}
                        {storeApplication.status === 'approved' && 'Aprobada'}
                        {storeApplication.status === 'rejected' && 'Rechazada'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ) : (
                // Puede aplicar
                <TouchableOpacity
                  onPress={() => navigation.navigate('RegisterOfficialStore')}
                  className="flex-row items-center justify-between py-3 border-2 border-blue-200 border-dashed rounded-xl px-3 mb-2"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="bg-blue-100 rounded-full p-2 mr-3">
                      <Ionicons name="star" size={20} color="#2563EB" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-blue-900">Convertirse en Tienda Oficial</Text>
                      <Text className="text-sm text-blue-700">Badge verificado + más beneficios</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#2563EB" />
                </TouchableOpacity>
              )}
            </>
          )}

          {/* COMENTADO: Pendiente de implementar
          <TouchableOpacity 
            onPress={() => navigation.navigate('MyReviews')}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-2xl mr-3">⭐</Text>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">Mis Valoraciones</Text>
                <Text className="text-sm text-gray-500">Opiniones y calificaciones</Text>
              </View>
            </View>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>
          */}
        </View>

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