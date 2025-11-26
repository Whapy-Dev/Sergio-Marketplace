import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { deleteAccount } from '../../services/profile';
import Button from '../../components/common/Button';
import { scale, moderateScale, verticalScale } from '../../utils/responsive';

export default function DeleteAccountScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  function handleDeleteAccount() {
    Alert.alert(
      '¿Eliminar cuenta?',
      'Esta acción es permanente. Se eliminarán todos tus datos, compras, favoritos y publicaciones. ¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  }

  async function confirmDelete() {
    if (!user) return;

    try {
      setLoading(true);

      const result = await deleteAccount(user.id);

      if (result.success) {
        Alert.alert('Cuenta Eliminada', 'Tu cuenta ha sido eliminada correctamente');
      } else {
        Alert.alert('Error', result.error || 'No se pudo eliminar la cuenta');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Text className="text-primary text-2xl font-bold">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Eliminar Cuenta</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        <View className="items-center mb-6">
          <Text className="text-6xl mb-4">⚠️</Text>
          <Text className="text-2xl font-bold text-gray-900 mb-2">¿Estás seguro?</Text>
        </View>

        <View className="bg-red-50 rounded-lg p-4 mb-6">
          <Text className="text-base text-red-900 font-semibold mb-2">
            Esta acción es irreversible
          </Text>
          <Text className="text-sm text-red-800">
            Al eliminar tu cuenta se perderán permanentemente:
          </Text>
        </View>

        <View className="mb-6">
          <View className="flex-row items-start mb-3">
            <Text className="text-lg mr-2">❌</Text>
            <Text className="flex-1 text-base text-gray-700">
              Todos tus datos personales
            </Text>
          </View>

          <View className="flex-row items-start mb-3">
            <Text className="text-lg mr-2">❌</Text>
            <Text className="flex-1 text-base text-gray-700">
              Historial de compras y pedidos
            </Text>
          </View>

          <View className="flex-row items-start mb-3">
            <Text className="text-lg mr-2">❌</Text>
            <Text className="flex-1 text-base text-gray-700">
              Lista de favoritos
            </Text>
          </View>

          <View className="flex-row items-start mb-3">
            <Text className="text-lg mr-2">❌</Text>
            <Text className="flex-1 text-base text-gray-700">
              Productos publicados (si eres vendedor)
            </Text>
          </View>

          <View className="flex-row items-start mb-3">
            <Text className="text-lg mr-2">❌</Text>
            <Text className="flex-1 text-base text-gray-700">
              Valoraciones y comentarios
            </Text>
          </View>
        </View>

        <View className="bg-gray-50 rounded-lg p-4 mb-6">
          <Text className="text-sm text-gray-600 text-center">
            Si tienes pedidos pendientes, te recomendamos esperar a que se completen antes de eliminar tu cuenta
          </Text>
        </View>

        <Button
          title="Eliminar mi cuenta permanentemente"
          onPress={handleDeleteAccount}
          loading={loading}
          variant="primary"
        />

        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="mt-4 py-3"
        >
          <Text className="text-primary text-center font-semibold text-base">
            Cancelar
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}