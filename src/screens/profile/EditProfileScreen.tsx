import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile, updateUserProfile, UserProfile } from '../../services/profile';
import { getBankingDetails, updateBankingDetails } from '../../services/wallet';
import { supabase } from '../../services/supabase';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/theme';

const FORMOSA_POSTAL_CODES = ['3600', '3601', '3602', '3603', '3604', '3605'];

export default function EditProfileScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Basic info
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Address
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [province, setProvince] = useState('Formosa');

  // Banking (for sellers)
  const [cbuCvu, setCbuCvu] = useState('');
  const [mpAlias, setMpAlias] = useState('');
  const [cuilCuit, setCuilCuit] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  const isSeller = profile?.role === 'seller_individual' || profile?.role === 'seller_official';

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    if (!user) return;

    setLoading(true);
    const profileData = await getUserProfile(user.id);

    if (profileData) {
      setProfile(profileData);
      setFullName(profileData.full_name || '');
      setPhone(profileData.phone || '');
      setAvatarUrl(profileData.avatar_url || '');
      setStreet(profileData.street || '');
      setCity(profileData.city || '');
      setPostalCode(profileData.postal_code || '');
      setProvince(profileData.province || 'Formosa');

      // Load banking details for sellers
      if (profileData.role === 'seller_individual' || profileData.role === 'seller_official') {
        const bankingDetails = await getBankingDetails(user.id);
        if (bankingDetails) {
          setCbuCvu(bankingDetails.cbu_cvu || '');
          setMpAlias(bankingDetails.mp_alias || '');
          setCuilCuit(bankingDetails.cuil_cuit || '');
          setAccountHolderName(bankingDetails.account_holder_name || '');
        }
      }
    }

    setLoading(false);
  }

  async function handlePickImage() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Necesitamos acceso a tu galería para cambiar la foto');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  }

  async function uploadAvatar(uri: string) {
    if (!user) return;

    try {
      setUploadingAvatar(true);

      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, uint8Array, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      Alert.alert('Éxito', 'Foto de perfil actualizada');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'No se pudo subir la imagen');
    } finally {
      setUploadingAvatar(false);
    }
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

    // Validate banking for sellers
    if (isSeller) {
      if (!cbuCvu.trim() && !mpAlias.trim()) {
        Alert.alert('Error', 'Debes configurar al menos un CBU/CVU o Alias de Mercado Pago para recibir pagos');
        return;
      }
      if (cbuCvu && cbuCvu.length !== 22) {
        Alert.alert('Error', 'El CBU/CVU debe tener 22 dígitos');
        return;
      }
    }

    try {
      setSaving(true);

      // Update profile
      const result = await updateUserProfile(user.id, {
        full_name: fullName.trim(),
        phone: phone.trim(),
        street: street.trim(),
        postal_code: postalCode.trim(),
        city: city.trim(),
        province: province.trim(),
        is_formosa: isFormosa,
      });

      if (!result.success) {
        throw new Error(result.error || 'No se pudo actualizar el perfil');
      }

      // Update banking details for sellers
      if (isSeller) {
        const bankingResult = await updateBankingDetails(user.id, {
          cbu_cvu: cbuCvu.trim() || undefined,
          mp_alias: mpAlias.trim() || undefined,
          cuil_cuit: cuilCuit.trim() || undefined,
          account_holder_name: accountHolderName.trim() || undefined,
        });

        if (!bankingResult) {
          console.warn('Could not update banking details');
        }
      }

      Alert.alert(
        'Perfil Actualizado',
        'Tus datos se guardaron correctamente',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
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
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Editar Perfil</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View className="bg-white px-4 py-6 items-center border-b border-gray-100">
          <TouchableOpacity onPress={handlePickImage} disabled={uploadingAvatar}>
            <View className="relative">
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center">
                  <Ionicons name="person" size={40} color="#9CA3AF" />
                </View>
              )}
              {uploadingAvatar ? (
                <View className="absolute inset-0 bg-black/50 rounded-full items-center justify-center">
                  <ActivityIndicator color="white" />
                </View>
              ) : (
                <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2">
                  <Ionicons name="camera" size={16} color="white" />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text className="text-sm text-gray-500 mt-2">Toca para cambiar foto</Text>
        </View>

        {/* Basic Info Section */}
        <View className="bg-white px-4 py-4 mt-3">
          <Text className="text-xs font-bold text-gray-500 mb-4">INFORMACIÓN BÁSICA</Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Nombre completo *
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
              placeholder="Juan Pérez"
              value={fullName}
              onChangeText={setFullName}
              editable={!saving}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Email
            </Text>
            <TextInput
              className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-500"
              value={user?.email || ''}
              editable={false}
            />
            <Text className="text-xs text-gray-400 mt-1">El email no se puede cambiar</Text>
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Teléfono *
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
              placeholder="3704123456"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!saving}
            />
          </View>
        </View>

        {/* Address Section */}
        <View className="bg-white px-4 py-4 mt-3">
          <Text className="text-xs font-bold text-gray-500 mb-4">DIRECCIÓN</Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Calle y número
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
              placeholder="Av. San Martín 1234"
              value={street}
              onChangeText={setStreet}
              editable={!saving}
            />
          </View>

          <View className="flex-row mb-4">
            <View className="flex-1 mr-2">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Ciudad *
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
                placeholder="Formosa"
                value={city}
                onChangeText={setCity}
                editable={!saving}
              />
            </View>
            <View className="w-28">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                CP *
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
                placeholder="3600"
                value={postalCode}
                onChangeText={setPostalCode}
                keyboardType="number-pad"
                maxLength={4}
                editable={!saving}
              />
            </View>
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Provincia
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
              placeholder="Formosa"
              value={province}
              onChangeText={setProvince}
              editable={!saving}
            />
          </View>

          <Text className="text-xs text-gray-400 mt-2">
            Solo disponible en Formosa capital por ahora
          </Text>
        </View>

        {/* Banking Section - Only for sellers */}
        {isSeller && (
          <View className="bg-white px-4 py-4 mt-3">
            <Text className="text-xs font-bold text-gray-500 mb-4">DATOS BANCARIOS</Text>
            <Text className="text-xs text-gray-500 mb-4">
              Configura tus datos para recibir pagos de tus ventas
            </Text>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                CBU / CVU
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
                placeholder="0000000000000000000000"
                value={cbuCvu}
                onChangeText={setCbuCvu}
                keyboardType="number-pad"
                maxLength={22}
                editable={!saving}
              />
              <Text className="text-xs text-gray-400 mt-1">22 dígitos</Text>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Alias de Mercado Pago
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
                placeholder="mi.alias.mp"
                value={mpAlias}
                onChangeText={setMpAlias}
                autoCapitalize="none"
                editable={!saving}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                CUIL / CUIT
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
                placeholder="20-12345678-9"
                value={cuilCuit}
                onChangeText={setCuilCuit}
                keyboardType="number-pad"
                maxLength={13}
                editable={!saving}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Titular de la cuenta
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
                placeholder="Juan Pérez"
                value={accountHolderName}
                onChangeText={setAccountHolderName}
                editable={!saving}
              />
            </View>
          </View>
        )}

        {/* Role Badge */}
        <View className="bg-white px-4 py-4 mt-3 mb-3">
          <Text className="text-xs font-bold text-gray-500 mb-3">TIPO DE CUENTA</Text>
          <View className="flex-row items-center">
            <View className={`px-3 py-1.5 rounded-full ${
              profile?.role === 'seller_official' ? 'bg-purple-100' :
              profile?.role === 'seller_individual' ? 'bg-blue-100' :
              'bg-gray-100'
            }`}>
              <Text className={`text-sm font-medium ${
                profile?.role === 'seller_official' ? 'text-purple-700' :
                profile?.role === 'seller_individual' ? 'text-blue-700' :
                'text-gray-700'
              }`}>
                {profile?.role === 'seller_official' ? 'Tienda Oficial' :
                 profile?.role === 'seller_individual' ? 'Vendedor' :
                 profile?.role === 'admin' ? 'Administrador' :
                 'Comprador'}
              </Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <View className="px-4 pb-8">
          <Button
            title="Guardar Cambios"
            onPress={handleSave}
            loading={saving}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
