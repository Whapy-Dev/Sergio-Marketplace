import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import {
  getSellerBalance,
  getBalanceTransactions,
  getMinimumWithdrawalAmount,
  type SellerBalance,
  type BalanceTransaction,
} from '../../services/wallet';
import { COLORS } from '../../constants/theme';

export default function WalletScreen({ navigation }: any) {
  const { user } = useAuth();
  const [balance, setBalance] = useState<SellerBalance | null>(null);
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [minimumAmount, setMinimumAmount] = useState(5000);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!user) return;

    setLoading(true);
    try {
      const [balanceData, transactionsData, minAmount] = await Promise.all([
        getSellerBalance(user.id),
        getBalanceTransactions(user.id, 20),
        getMinimumWithdrawalAmount(),
      ]);

      setBalance(balanceData);
      setTransactions(transactionsData);
      setMinimumAmount(minAmount);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function getTransactionIcon(type: string) {
    switch (type) {
      case 'sale':
        return 'arrow-down-circle';
      case 'withdrawal':
        return 'arrow-up-circle';
      case 'refund':
        return 'arrow-back-circle';
      case 'commission':
        return 'remove-circle';
      case 'adjustment':
        return 'swap-horizontal-circle';
      default:
        return 'help-circle';
    }
  }

  function getTransactionColor(type: string) {
    switch (type) {
      case 'sale':
        return '#10B981';
      case 'withdrawal':
        return '#EF4444';
      case 'refund':
        return '#F59E0B';
      case 'commission':
        return '#6B7280';
      case 'adjustment':
        return COLORS.primary;
      default:
        return '#9CA3AF';
    }
  }

  function getTransactionLabel(type: string) {
    switch (type) {
      case 'sale':
        return 'Venta';
      case 'withdrawal':
        return 'Retiro';
      case 'refund':
        return 'Reembolso';
      case 'commission':
        return 'Comisión';
      case 'adjustment':
        return 'Ajuste';
      default:
        return type;
    }
  }

  const canWithdraw = balance && balance.available_balance >= minimumAmount;

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
      <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Mi Billetera</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('BankingDetails')}>
          <Ionicons name="settings-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Balance Cards */}
        <View className="p-4 space-y-3">
          {/* Available Balance */}
          <View className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg">
            <Text className="text-white text-sm font-medium mb-2">Disponible para Retirar</Text>
            <Text className="text-white text-4xl font-bold mb-4">
              ${balance?.available_balance.toLocaleString('es-AR') || '0'}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('RequestWithdrawal')}
              disabled={!canWithdraw}
              className={`rounded-lg py-3 ${canWithdraw ? 'bg-white' : 'bg-white/30'}`}
            >
              <Text
                className={`text-center font-semibold ${
                  canWithdraw ? 'text-blue-600' : 'text-white'
                }`}
              >
                {canWithdraw ? 'Solicitar Retiro' : `Mínimo: $${minimumAmount.toLocaleString('es-AR')}`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats Grid */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white rounded-xl p-4 shadow-sm">
              <View className="flex-row items-center mb-2">
                <Ionicons name="time-outline" size={20} color="#F59E0B" />
                <Text className="text-gray-600 text-xs font-medium ml-2">Pendiente</Text>
              </View>
              <Text className="text-gray-900 text-xl font-bold">
                ${balance?.pending_balance.toLocaleString('es-AR') || '0'}
              </Text>
              <Text className="text-gray-500 text-xs mt-1">En proceso</Text>
            </View>

            <View className="flex-1 bg-white rounded-xl p-4 shadow-sm">
              <View className="flex-row items-center mb-2">
                <Ionicons name="trending-up-outline" size={20} color="#10B981" />
                <Text className="text-gray-600 text-xs font-medium ml-2">Total Ganado</Text>
              </View>
              <Text className="text-gray-900 text-xl font-bold">
                ${balance?.total_earned.toLocaleString('es-AR') || '0'}
              </Text>
              <Text className="text-gray-500 text-xs mt-1">Histórico</Text>
            </View>
          </View>

          {/* Withdrawn */}
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="cash-outline" size={20} color="#6B7280" />
                <Text className="text-gray-600 text-sm font-medium ml-2">Total Retirado</Text>
              </View>
              <Text className="text-gray-900 text-lg font-bold">
                ${balance?.total_withdrawn.toLocaleString('es-AR') || '0'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-4 pb-4">
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-gray-900 font-bold mb-3">Acciones Rápidas</Text>
            <View className="space-y-2">
              <TouchableOpacity
                onPress={() => navigation.navigate('WithdrawalHistory')}
                className="flex-row items-center justify-between py-3 border-b border-gray-100"
              >
                <View className="flex-row items-center">
                  <Ionicons name="list-outline" size={22} color={COLORS.primary} />
                  <Text className="text-gray-700 font-medium ml-3">Ver Retiros</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('BankingDetails')}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center">
                  <Ionicons name="card-outline" size={22} color={COLORS.primary} />
                  <Text className="text-gray-700 font-medium ml-3">Datos Bancarios</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Transaction History */}
        <View className="px-4 pb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-900 font-bold text-lg">Movimientos Recientes</Text>
            {transactions.length > 0 && (
              <TouchableOpacity>
                <Text style={{ color: COLORS.primary }} className="font-semibold">
                  Ver todo
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {transactions.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 text-center mt-3">
                No hay movimientos aún
              </Text>
            </View>
          ) : (
            <View className="bg-white rounded-xl shadow-sm overflow-hidden">
              {transactions.map((transaction, index) => (
                <View
                  key={transaction.id}
                  className={`flex-row items-center justify-between p-4 ${
                    index < transactions.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <View className="flex-row items-center flex-1">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: getTransactionColor(transaction.type) + '20' }}
                    >
                      <Ionicons
                        name={getTransactionIcon(transaction.type) as any}
                        size={20}
                        color={getTransactionColor(transaction.type)}
                      />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-gray-900 font-medium">
                        {getTransactionLabel(transaction.type)}
                      </Text>
                      {transaction.description && (
                        <Text className="text-gray-500 text-xs" numberOfLines={1}>
                          {transaction.description}
                        </Text>
                      )}
                      <Text className="text-gray-400 text-xs">
                        {new Date(transaction.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text
                      className={`font-bold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString('es-AR')}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      Saldo: ${transaction.balance_after.toLocaleString('es-AR')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
