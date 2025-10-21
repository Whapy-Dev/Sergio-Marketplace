import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import Button from '../../components/common/Button';

interface RegisterScreenProps {
  navigation: any;
}

const FORMOSA_POSTAL_CODES = ['3600', '3601', '3602', '3603', '3604', '3605'];

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!fullName || !email || !password || !phone || !postalCode || !city) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
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
      setLoading(true);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        Alert.alert('Error', authError.message);
        return;
      }

      if (!authData.user) {
        Alert.alert('Error', 'No se pudo crear el usuario');
        return;
      }

      // 2. Esperar un momento para que se cree el perfil automáticamente
await new Promise(resolve => setTimeout(resolve, 1000));

// 3. Actualizar perfil con datos completos
const { error: profileError } = await supabase
  .from('profiles')
  .update({
    full_name: fullName,
    phone: phone,
    postal_code: postalCode,
    city: city,
    is_formosa: isFormosa,
  })
  .eq('id', authData.user.id);

      if (profileError) {
        console.error('Error creating profile:', profileError);
        Alert.alert('Error', 'Error al crear el perfil');
        return;
      }

      Alert.alert(
        '¡Registro exitoso!',
        'Tu cuenta ha sido creada. Por favor verifica tu email.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 pt-8">
            <View className="mb-8">
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text className="text-primary text-lg mb-4">← Volver</Text>
              </TouchableOpacity>
              
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                Crear cuenta
              </Text>
              <Text className="text-base text-gray-600">
                Completa tus datos para registrarte
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Nombre completo *
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="Juan Pérez"
                value={fullName}
                onChangeText={setFullName}
                editable={!loading}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Email *
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="tu@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Contraseña *
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
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
                editable={!loading}
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
                editable={!loading}
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
                editable={!loading}
              />
            </View>

            <Button
              title="Crear cuenta"
              onPress={handleRegister}
              loading={loading}
            />

            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-gray-600">
                ¿Ya tienes cuenta?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text className="text-primary font-semibold">
                  Inicia sesión
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}