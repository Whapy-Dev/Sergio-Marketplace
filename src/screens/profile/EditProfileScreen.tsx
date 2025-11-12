import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile, updateUserProfile, UserProfile } from '../../services/profile';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/theme';

const FORMOSA_POSTAL_CODES = ['3600', '3601', '3602', '3603', '3604', '3605'];

export default function EditProfileScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    if (!user) return;
    
    setLoading(true);
    const profile = await getUserProfile(user.id);
    
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setPostalCode(profile.postal_code || '');
      setCity(profile.city || '');
    }
    
    setLoading(false);
  }

  async function handleSave() {
    if (!user) return;

    if (!fullName.trim()) {
      Alert.alert('Error', 'El nombre completo es obligatorio');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Error', 'El teléfono es obligatorio');
      return;
    }

    if (!postalCode.trim()) {
      Alert.alert('Error', 'El código postal es obligatorio');
      return;
    }

    if (!city.trim()) {
      Alert.alert('Error', 'La ciudad es obligatoria');
      return;
    }

    const isFormosa = FORMOSA_POSTAL_CODES.includes(postalCode);

    if (!isFormosa) {
      Alert.alert(
        '¡Próximamente!',
        'Por el momento solo estamos disponibles en Formosa capital. ¡Pronto llegaremos a tu ciudad!',
        [{ text: 'Entendido' }]
      );
      return;
    }

    try {
      setSaving(true);

      const result = await updateUserProfile(user.id, {
        full_name: fullName.trim(),
        phone: phone.trim(),
        postal_code: postalCode.trim(),
        city: city.trim(),
        is_formosa: isFormosa,
      });

      if (result.success) {
        Alert.alert(
          'Perfil Actualizado',
          'Tus datos se guardaron correctamente',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo actualizar el perfil');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
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
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Text className="text-primary text-2xl font-bold">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Editar Perfil</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Nombre completo *
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="Juan Pérez"
            value={fullName}
            onChangeText={setFullName}
            editable={!saving}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Teléfono *
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="3704123456"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!saving}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Código Postal *
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="3600"
            value={postalCode}
            onChangeText={setPostalCode}
            keyboardType="number-pad"
            maxLength={4}
            editable={!saving}
          />
          <Text className="text-xs text-gray-500 mt-1">
            Solo disponible en Formosa capital por ahora
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Ciudad *
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="Formosa"
            value={city}
            onChangeText={setCity}
            editable={!saving}
          />
        </View>

        <Button
          title="Guardar Cambios"
          onPress={handleSave}
          loading={saving}
        />
      </ScrollView>
    </SafeAreaView>
  );
}