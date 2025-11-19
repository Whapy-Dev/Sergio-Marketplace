import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getSellerWithdrawalRequests, type WithdrawalRequest } from '../../services/wallet';
import { COLORS } from '../../constants/theme';

export default function WithdrawalHistoryScreen({ navigation }: any) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    if (!user) return;

    setLoading(true);
    try {
      const data = await getSellerWithdrawalRequests(user.id);
      setRequests(data);
    } catch (error) {
      console.error('Error loading withdrawal requests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'pending':
      case 'approved':
      case 'processing':
        return '#F59E0B';
      case 'rejected':
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'approved':
        return 'Aprobado';
      case 'processing':
        return 'Procesando';
      case 'completed':
        return 'Completado';
      case 'rejected':
        return 'Rechazado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'approved':
      case 'processing':
        return 'hourglass';
      case 'rejected':
        return 'close-circle';
      case 'cancelled':
        return 'ban';
      default:
        return 'help-circle';
    }
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
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Historial de Retiros</Text>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {requests.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6 py-12">
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-900 font-bold text-xl mt-4 text-center">
              No hay retiros aún
            </Text>
            <Text className="text-gray-600 text-center mt-2">
              Cuando solicites un retiro, aparecerá aquí
            </Text>
          </View>
        ) : (
          <View className="p-4 space-y-3">
            {requests.map((request) => (
              <View key={request.id} className="bg-white rounded-xl p-4 shadow-sm">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: getStatusColor(request.status) + '20' }}
                    >
                      <Ionicons
                        name={getStatusIcon(request.status) as any}
                        size={20}
                        color={getStatusColor(request.status)}
                      />
                    </View>
                    <View className="ml-3">
                      <Text className="text-gray-900 font-bold text-lg">
                        ${request.amount.toLocaleString('es-AR')}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        {new Date(request.requested_at).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: getStatusColor(request.status) + '20' }}
                  >
                    <Text
                      className="font-semibold text-xs"
                      style={{ color: getStatusColor(request.status) }}
                    >
                      {getStatusLabel(request.status)}
                    </Text>
                  </View>
                </View>

                {/* Details */}
                <View className="border-t border-gray-100 pt-3 space-y-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-600 text-sm">Método de pago:</Text>
                    <Text className="text-gray-900 font-medium text-sm">
                      {request.payment_method === 'cbu_cvu'
                        ? 'Transferencia Bancaria'
                        : 'Mercado Pago'}
                    </Text>
                  </View>

                  {request.payment_method === 'cbu_cvu' && request.payment_details?.cbu_cvu && (
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-600 text-sm">CBU/CVU:</Text>
                      <Text className="text-gray-900 font-mono text-xs">
                        {request.payment_details.cbu_cvu}
                      </Text>
                    </View>
                  )}

                  {request.payment_method === 'mp_alias' && request.payment_details?.mp_alias && (
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-600 text-sm">Alias MP:</Text>
                      <Text className="text-gray-900 font-medium text-sm">
                        {request.payment_details.mp_alias}
                      </Text>
                    </View>
                  )}

                  {request.processed_at && (
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-600 text-sm">Procesado:</Text>
                      <Text className="text-gray-900 text-sm">
                        {new Date(request.processed_at).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  )}

                  {request.transaction_reference && (
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-600 text-sm">Referencia:</Text>
                      <Text className="text-gray-900 font-mono text-xs">
                        {request.transaction_reference}
                      </Text>
                    </View>
                  )}

                  {request.rejection_reason && (
                    <View className="bg-red-50 rounded-lg p-3 mt-2">
                      <Text className="text-red-900 font-semibold text-xs mb-1">
                        Motivo de Rechazo:
                      </Text>
                      <Text className="text-red-700 text-sm">{request.rejection_reason}</Text>
                    </View>
                  )}

                  {request.admin_notes && (
                    <View className="bg-blue-50 rounded-lg p-3 mt-2">
                      <Text className="text-blue-900 font-semibold text-xs mb-1">Nota:</Text>
                      <Text className="text-blue-700 text-sm">{request.admin_notes}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
