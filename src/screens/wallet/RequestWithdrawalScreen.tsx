import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import {
  getSellerBalance,
  getBankingDetails,
  createWithdrawalRequest,
  getMinimumWithdrawalAmount,
} from '../../services/wallet';
import { COLORS } from '../../constants/theme';
import { scale, moderateScale, verticalScale } from '../../utils/responsive';

export default function RequestWithdrawalScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [minimumAmount, setMinimumAmount] = useState(5000);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cbu_cvu' | 'mp_alias' | null>(null);
  const [hasCbuCvu, setHasCbuCvu] = useState(false);
  const [hasMpAlias, setHasMpAlias] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!user) return;

    setLoading(true);
    try {
      const [balance, bankingDetails, minAmount] = await Promise.all([
        getSellerBalance(user.id),
        getBankingDetails(user.id),
        getMinimumWithdrawalAmount(),
      ]);

      setAvailableBalance(balance?.available_balance || 0);
      setMinimumAmount(minAmount);
      setHasCbuCvu(!!bankingDetails?.cbu_cvu);
      setHasMpAlias(!!bankingDetails?.mp_alias);

      // Auto-select payment method if only one is available
      if (bankingDetails?.cbu_cvu && !bankingDetails?.mp_alias) {
        setPaymentMethod('cbu_cvu');
      } else if (bankingDetails?.mp_alias && !bankingDetails?.cbu_cvu) {
        setPaymentMethod('mp_alias');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!user) return;

    // Validations
    const requestedAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));

    if (!requestedAmount || isNaN(requestedAmount)) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }

    if (requestedAmount < minimumAmount) {
      Alert.alert('Error', `El monto mínimo para retirar es $${minimumAmount.toLocaleString('es-AR')}`);
      return;
    }

    if (requestedAmount > availableBalance) {
      Alert.alert('Error', 'No tienes saldo suficiente para este retiro');
      return;
    }

    if (!paymentMethod) {
      Alert.alert('Error', 'Selecciona un método de pago');
      return;
    }

    // Confirm
    Alert.alert(
      'Confirmar Retiro',
      `¿Confirmas que deseas retirar $${requestedAmount.toLocaleString('es-AR')} a tu ${
        paymentMethod === 'cbu_cvu' ? 'cuenta bancaria (CBU/CVU)' : 'Mercado Pago'
      }?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: submitRequest },
      ]
    );
  }

  async function submitRequest() {
    if (!user || !paymentMethod) return;

    setSubmitting(true);
    try {
      const requestedAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
      const request = await createWithdrawalRequest(user.id, requestedAmount, paymentMethod);

      if (request) {
        Alert.alert(
          'Solicitud Enviada',
          'Tu solicitud de retiro ha sido enviada. Será procesada en las próximas 24-48 horas.',
          [
            {
              text: 'Ver Retiros',
              onPress: () => navigation.replace('WithdrawalHistory'),
            },
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo crear la solicitud de retiro. Intenta nuevamente.');
      }
    } catch (error: any) {
      console.error('Error creating withdrawal request:', error);
      Alert.alert('Error', error.message || 'Ocurrió un error al crear la solicitud');
    } finally {
      setSubmitting(false);
    }
  }

  function handleQuickAmount(percentage: number) {
    const calculatedAmount = Math.floor(availableBalance * percentage);
    setAmount(calculatedAmount.toString());
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

  if (!hasCbuCvu && !hasMpAlias) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-4 py-4 border-b border-gray-200 flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={scale(24)} color="#000" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Solicitar Retiro</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="card-outline" size={scale(64)} color="#D1D5DB" />
          <Text className="text-gray-900 font-bold text-xl mt-4 text-center">
            Configura tus Datos Bancarios
          </Text>
          <Text className="text-gray-600 text-center mt-2 mb-6">
            Antes de solicitar un retiro, debes configurar tus datos bancarios
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('BankingDetails')}
            className="rounded-lg py-4 px-8"
            style={{ backgroundColor: COLORS.primary }}
          >
            <Text className="text-white font-bold">Configurar Ahora</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const requestedAmount = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
  const isValidAmount = requestedAmount >= minimumAmount && requestedAmount <= availableBalance;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-4 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={scale(24)} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Solicitar Retiro</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* Available Balance */}
        <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <Text className="text-blue-700 text-sm font-medium mb-1">Saldo Disponible</Text>
          <Text className="text-blue-900 text-3xl font-bold">
            ${availableBalance.toLocaleString('es-AR')}
          </Text>
          <Text className="text-blue-600 text-xs mt-1">
            Mínimo para retirar: ${minimumAmount.toLocaleString('es-AR')}
          </Text>
        </View>

        {/* Amount Input */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Monto a Retirar</Text>
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            <Text className="text-gray-500 text-xl font-bold mr-2">$</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              className="flex-1 text-gray-900 text-xl font-bold"
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
          {requestedAmount > 0 && !isValidAmount && (
            <Text className="text-red-600 text-xs mt-1">
              {requestedAmount < minimumAmount
                ? `El monto mínimo es $${minimumAmount.toLocaleString('es-AR')}`
                : 'Saldo insuficiente'}
            </Text>
          )}
        </View>

        {/* Quick Amount Buttons */}
        <View className="flex-row gap-2 mb-6">
          <TouchableOpacity
            onPress={() => handleQuickAmount(0.25)}
            className="flex-1 bg-gray-100 rounded-lg py-3"
          >
            <Text className="text-center text-gray-700 font-semibold">25%</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleQuickAmount(0.5)}
            className="flex-1 bg-gray-100 rounded-lg py-3"
          >
            <Text className="text-center text-gray-700 font-semibold">50%</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleQuickAmount(0.75)}
            className="flex-1 bg-gray-100 rounded-lg py-3"
          >
            <Text className="text-center text-gray-700 font-semibold">75%</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleQuickAmount(1)}
            className="flex-1 bg-gray-100 rounded-lg py-3"
          >
            <Text className="text-center text-gray-700 font-semibold">Todo</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Method */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-3">Método de Pago</Text>

          {hasCbuCvu && (
            <TouchableOpacity
              onPress={() => setPaymentMethod('cbu_cvu')}
              className={`flex-row items-center justify-between p-4 rounded-lg border-2 mb-3 ${
                paymentMethod === 'cbu_cvu'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <View className="flex-row items-center flex-1">
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: paymentMethod === 'cbu_cvu' ? COLORS.primary : '#F3F4F6' }}
                >
                  <Ionicons
                    name="business"
                    size={scale(24)}
                    color={paymentMethod === 'cbu_cvu' ? 'white' : '#6B7280'}
                  />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-900 font-semibold">Transferencia Bancaria</Text>
                  <Text className="text-gray-600 text-xs">CBU/CVU configurado</Text>
                </View>
              </View>
              {paymentMethod === 'cbu_cvu' && (
                <Ionicons name="checkmark-circle" size={scale(24)} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          )}

          {hasMpAlias && (
            <TouchableOpacity
              onPress={() => setPaymentMethod('mp_alias')}
              className={`flex-row items-center justify-between p-4 rounded-lg border-2 ${
                paymentMethod === 'mp_alias'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <View className="flex-row items-center flex-1">
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: paymentMethod === 'mp_alias' ? COLORS.primary : '#F3F4F6' }}
                >
                  <Ionicons
                    name="wallet"
                    size={scale(24)}
                    color={paymentMethod === 'mp_alias' ? 'white' : '#6B7280'}
                  />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-900 font-semibold">Mercado Pago</Text>
                  <Text className="text-gray-600 text-xs">Alias configurado</Text>
                </View>
              </View>
              {paymentMethod === 'mp_alias' && (
                <Ionicons name="checkmark-circle" size={scale(24)} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Info */}
        <View className="bg-gray-50 rounded-lg p-4">
          <View className="flex-row items-start">
            <Ionicons name="time-outline" size={scale(20)} color="#6B7280" />
            <View className="ml-3 flex-1">
              <Text className="text-gray-900 font-semibold mb-1">Tiempo de Procesamiento</Text>
              <Text className="text-gray-600 text-sm">
                Las solicitudes de retiro se procesan en 24-48 horas hábiles. Recibirás una notificación cuando tu retiro sea procesado.
              </Text>
            </View>
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>

      {/* Submit Button */}
      <View className="border-t border-gray-200 p-4 bg-white">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!isValidAmount || !paymentMethod || submitting}
          className="rounded-lg py-4"
          style={{
            backgroundColor:
              !isValidAmount || !paymentMethod || submitting ? '#9CA3AF' : COLORS.primary,
          }}
        >
          <Text className="text-white text-center font-bold text-lg">
            {submitting ? 'Enviando...' : 'Solicitar Retiro'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
