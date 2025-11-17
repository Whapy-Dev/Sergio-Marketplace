import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

interface SimpleFooterProps {
  backgroundColor?: string;
}

export default function SimpleFooter({
  backgroundColor = '#F3F4F6',
}: SimpleFooterProps) {
  const [email, setEmail] = useState('');

  function handleSubscribe() {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Ingresa un email válido');
      return;
    }

    Alert.alert('¡Suscrito!', 'Recibirás ofertas y promociones en tu email');
    setEmail('');
  }

  function handleCallSupport() {
    Linking.openURL('tel:08001234567');
  }

  function handleWhatsApp() {
    const message = '¡Hola! Necesito ayuda';
    Linking.openURL(`https://wa.me/5493704123456?text=${encodeURIComponent(message)}`);
  }

  return (
    <View style={{ backgroundColor }} className="px-4 py-6 rounded-3xl mx-4 my-4">
      {/* Atención al cliente */}
      <View className="mb-6">
        <Text className="text-xl font-bold text-gray-900 mb-4">
          Atención al cliente
        </Text>

        <TouchableOpacity
          onPress={handleCallSupport}
          className="mb-3"
        >
          <Text className="text-lg font-semibold text-gray-900">
            0800 123 456
          </Text>
        </TouchableOpacity>

        <Text className="text-base text-gray-700 mb-1">
          Lunes a Viernes de 09:00 a 18:00
        </Text>
        <Text className="text-base text-gray-700 mb-4">
          Sábados de 9:00 a 13:00
        </Text>

        {/* Newsletter */}
        <Text className="text-base font-semibold text-gray-900 mb-3">
          Recibí ofertas y promociones
        </Text>

        <View className="flex-row items-center">
          <TextInput
            className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mr-2"
            placeholder="Ingresá tu email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity
            onPress={handleSubscribe}
            className="rounded-lg px-6 py-3"
            style={{ backgroundColor: COLORS.primary }}
          >
            <Text className="text-white font-semibold">Suscribirme</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Copyright */}
      <View className="border-t border-gray-300 pt-4">
        <Text className="text-center text-sm text-gray-500 mb-1">
          © 2025 Yo Compro Formosa
        </Text>
        <Text className="text-center text-xs text-gray-400">
          Versión 1.0.0
        </Text>
      </View>
    </View>
  );
}