import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getBankingDetails, updateBankingDetails, type BankingDetails } from '../../services/wallet';
import { COLORS } from '../../constants/theme';
import { scale, moderateScale, verticalScale } from '../../utils/responsive';

export default function BankingDetailsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<BankingDetails>({
    cbu_cvu: '',
    mp_alias: '',
    cuil_cuit: '',
    account_holder_name: '',
  });

  useEffect(() => {
    loadBankingDetails();
  }, []);

  async function loadBankingDetails() {
    if (!user) return;

    setLoading(true);
    try {
      const details = await getBankingDetails(user.id);
      if (details) {
        setFormData({
          cbu_cvu: details.cbu_cvu || '',
          mp_alias: details.mp_alias || '',
          cuil_cuit: details.cuil_cuit || '',
          account_holder_name: details.account_holder_name || '',
        });
      }
    } catch (error) {
      console.error('Error loading banking details:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user) return;

    // Validation
    if (!formData.account_holder_name?.trim()) {
      Alert.alert('Error', 'El nombre del titular es obligatorio');
      return;
    }

    if (!formData.cbu_cvu?.trim() && !formData.mp_alias?.trim()) {
      Alert.alert('Error', 'Debes configurar al menos un método de pago (CBU/CVU o Alias de Mercado Pago)');
      return;
    }

    // Validate CBU/CVU length (22 characters)
    if (formData.cbu_cvu && formData.cbu_cvu.replace(/\s/g, '').length !== 22) {
      Alert.alert('Error', 'El CBU/CVU debe tener 22 dígitos');
      return;
    }

    // Validate CUIL/CUIT length (11 characters)
    if (formData.cuil_cuit && formData.cuil_cuit.replace(/[-\s]/g, '').length !== 11) {
      Alert.alert('Error', 'El CUIL/CUIT debe tener 11 dígitos');
      return;
    }

    setSaving(true);
    try {
      // Clean data before saving
      const cleanedData = {
        cbu_cvu: formData.cbu_cvu?.replace(/\s/g, '') || null,
        mp_alias: formData.mp_alias?.trim() || null,
        cuil_cuit: formData.cuil_cuit?.replace(/[-\s]/g, '') || null,
        account_holder_name: formData.account_holder_name?.trim(),
      };

      const success = await updateBankingDetails(user.id, cleanedData);

      if (success) {
        Alert.alert(
          'Guardado',
          'Tus datos bancarios se han actualizado correctamente',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', 'No se pudieron guardar los datos. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error saving banking details:', error);
      Alert.alert('Error', 'Ocurrió un error al guardar los datos');
    } finally {
      setSaving(false);
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
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-4 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={scale(24)} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Datos Bancarios</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* Info Banner */}
        <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex-row">
          <Ionicons name="information-circle" size={scale(24)} color={COLORS.primary} />
          <View className="ml-3 flex-1">
            <Text className="text-blue-900 font-semibold mb-1">Información importante</Text>
            <Text className="text-blue-700 text-sm">
              Estos datos se utilizarán para procesar tus retiros. Asegúrate de que sean correctos.
            </Text>
          </View>
        </View>

        {/* Account Holder Name */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Nombre del Titular *
          </Text>
          <TextInput
            value={formData.account_holder_name}
            onChangeText={(text) => setFormData({ ...formData, account_holder_name: text })}
            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900"
            placeholder="Juan Pérez"
            autoCapitalize="words"
          />
          <Text className="text-xs text-gray-500 mt-1">
            Debe coincidir con el nombre de la cuenta bancaria
          </Text>
        </View>

        {/* CUIL/CUIT */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            CUIL/CUIT *
          </Text>
          <TextInput
            value={formData.cuil_cuit}
            onChangeText={(text) => setFormData({ ...formData, cuil_cuit: text })}
            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900"
            placeholder="20-12345678-9"
            keyboardType="numeric"
            maxLength={13}
          />
          <Text className="text-xs text-gray-500 mt-1">
            11 dígitos (puede incluir guiones)
          </Text>
        </View>

        {/* Divider */}
        <View className="border-t border-gray-200 my-6" />
        <Text className="text-gray-700 font-bold mb-4">Métodos de Retiro</Text>

        {/* CBU/CVU */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">CBU/CVU</Text>
          <TextInput
            value={formData.cbu_cvu}
            onChangeText={(text) => setFormData({ ...formData, cbu_cvu: text })}
            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900"
            placeholder="0000003100012345678901"
            keyboardType="numeric"
            maxLength={22}
          />
          <Text className="text-xs text-gray-500 mt-1">
            22 dígitos para transferencia bancaria
          </Text>
        </View>

        {/* Mercado Pago Alias */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Alias de Mercado Pago</Text>
          <TextInput
            value={formData.mp_alias}
            onChangeText={(text) => setFormData({ ...formData, mp_alias: text })}
            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900"
            placeholder="usuario.alias.mp"
            autoCapitalize="none"
          />
          <Text className="text-xs text-gray-500 mt-1">
            Tu alias de Mercado Pago (ej: nombre.apellido.mp)
          </Text>
        </View>

        {/* Info Box */}
        <View className="bg-gray-50 rounded-lg p-4 mb-6">
          <View className="flex-row items-start">
            <Ionicons name="shield-checkmark" size={scale(20)} color="#10B981" />
            <View className="ml-3 flex-1">
              <Text className="text-gray-900 font-semibold mb-1">Seguridad</Text>
              <Text className="text-gray-600 text-sm">
                Tus datos bancarios están protegidos y solo se utilizan para procesar tus retiros.
              </Text>
            </View>
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>

      {/* Save Button */}
      <View className="border-t border-gray-200 p-4 bg-white">
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="rounded-lg py-4"
          style={{ backgroundColor: saving ? '#9CA3AF' : COLORS.primary }}
        >
          <Text className="text-white text-center font-bold text-lg">
            {saving ? 'Guardando...' : 'Guardar Datos'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
