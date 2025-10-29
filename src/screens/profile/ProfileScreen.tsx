import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

export default function ProfileScreen({ navigation }: any) {
  const { user, profile, signOut, isSeller, refreshProfile } = useAuth();

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
          }
        },
      ]
    );
  }

  async function handleBecomeSeller() {
    if (!user) return;

    Alert.alert(
      '¿Quieres ser vendedor?',
      'Podrás publicar productos y gestionar ventas en el marketplace.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, quiero vender',
          onPress: async () => {
            try {
              // 1. Actualizar rol en profiles
              const { error: profileError } = await supabase
                .from('profiles')
                .update({ role: 'seller_individual' })
                .eq('id', user.id);

              if (profileError) throw profileError;

              // 2. Crear registro en sellers
              const storeName = profile?.full_name || user.email?.split('@')[0] || 'Mi Tienda';

              const { error: sellerError } = await supabase
                .from('sellers')
                .insert({
                  id: user.id,
                  store_name: storeName,
                  description: 'Tienda verificada',
                  is_verified: false,
                  rating: 4.5,
                  total_sales: 0,
                });

              if (sellerError && sellerError.code !== '23505') {
                throw sellerError;
              }

              // 3. Refrescar perfil
              await refreshProfile();

              Alert.alert(
                '¡Bienvenido! 🎉',
                'Ya eres vendedor. Ahora puedes publicar productos desde tu perfil.',
                [{ text: 'Entendido' }]
              );
            } catch (error: any) {
              console.error('Error becoming seller:', error);
              Alert.alert('Error', 'No se pudo completar el proceso. Intenta de nuevo.');
            }
          }
        }
      ]
    );
  }

  function getRoleBadge() {
    if (!profile) return null;

    const badges: Record<string, { label: string; color: string }> = {
      seller_individual: { label: 'Vendedor', color: 'bg-blue-100 text-blue-700' },
      seller_store: { label: 'Tienda', color: 'bg-purple-100 text-purple-700' },
      admin: { label: 'Admin', color: 'bg-red-100 text-red-700' },
      customer: { label: 'Comprador', color: 'bg-gray-100 text-gray-700' },
    };

    const badge = badges[profile.role];
    if (!badge) return null;

    return (
      <View className={`mt-2 px-3 py-1 ${badge.color} rounded-full`}>
        <Text className={`text-xs ${badge.color} font-semibold`}>{badge.label}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Mi Perfil</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Avatar y datos básicos */}
        <View className="items-center py-6 border-b border-gray-100">
          <View className="w-24 h-24 rounded-full bg-primary items-center justify-center mb-3">
            {profile?.avatar_url ? (
              <Image 
                source={{ uri: profile.avatar_url }} 
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <Text className="text-4xl">👤</Text>
            )}
          </View>
          <Text className="text-xl font-bold text-gray-900">
            {profile?.full_name || 'Usuario'}
          </Text>
          <Text className="text-base text-gray-600 mt-1">{profile?.email}</Text>
          {getRoleBadge()}
        </View>

        {/* Botón para hacerse vendedor - Solo para customers */}
        {profile?.role === 'customer' && (
          <View className="px-4 py-4 border-b border-gray-100">
            <TouchableOpacity
              onPress={handleBecomeSeller}
              className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl py-4 flex-row items-center justify-center"
              style={{ backgroundColor: '#3B82F6' }}
            >
              <Text className="text-2xl mr-2">🏪</Text>
              <Text className="text-white font-bold text-base">Quiero vender productos</Text>
            </TouchableOpacity>
            <Text className="text-xs text-gray-500 text-center mt-2">
              Publica tus productos y llega a miles de compradores
            </Text>
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
            <Text className="text-gray-400 text-xl">›</Text>
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
            <Text className="text-gray-400 text-xl">›</Text>
          </TouchableOpacity>
        </View>

        {/* Mis actividades */}
        <View className="px-4 py-4 border-b border-gray-100">
          <Text className="text-sm font-semibold text-gray-500 mb-3">MIS ACTIVIDADES</Text>
          
          {/* Dashboard Vendedor - SOLO SI ES VENDEDOR */}
          {isSeller && (
            <>
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
                <Text className="text-gray-400 text-xl">›</Text>
              </TouchableOpacity>

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
                <Text className="text-gray-400 text-xl">›</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => navigation.navigate('SellerOrders')}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-2xl mr-3">📦</Text>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900">Mis Ventas</Text>
                    <Text className="text-sm text-gray-500">Pedidos recibidos</Text>
                  </View>
                </View>
                <Text className="text-gray-400 text-xl">›</Text>
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('MyOrders')}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-2xl mr-3">🛍️</Text>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">Mis Compras</Text>
                <Text className="text-sm text-gray-500">Historial de pedidos</Text>
              </View>
            </View>
            <Text className="text-gray-400 text-xl">›</Text>
          </TouchableOpacity>
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
            <Text className="text-gray-400 text-xl">›</Text>
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
            <Text className="text-gray-400 text-xl">›</Text>
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
            <Text className="text-gray-400 text-xl">›</Text>
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
            <Text className="text-gray-400 text-xl">›</Text>
          </TouchableOpacity>
        </View>

        {/* Acciones */}
        <View className="px-4 py-4">
          <TouchableOpacity 
            onPress={handleSignOut}
            className="bg-red-50 rounded-xl py-4 mb-3"
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

          {/* Versión de la app */}
          <Text className="text-center text-xs text-gray-400 mt-4">
            Versión 1.0.0
          </Text>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}