import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

interface FooterProps {
  showNewsletter?: boolean;
  showSocialMedia?: boolean;
  showLinks?: boolean;
  backgroundColor?: string;
}

export default function Footer({
  showNewsletter = true,
  showSocialMedia = true,
  showLinks = true,
  backgroundColor = '#F9FAFB',
}: FooterProps) {
  const [email, setEmail] = useState('');

  function handleSubscribe() {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Ingresa un email válido');
      return;
    }

    Alert.alert('¡Suscrito!', 'Recibirás ofertas y promociones en tu email');
    setEmail('');
  }

  function handleOpenLink(url: string) {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'No se pudo abrir el enlace');
    });
  }

  function handleCallSupport() {
    Linking.openURL('tel:08001234567');
  }

  function handleWhatsApp() {
    const message = '¡Hola! Necesito ayuda';
    Linking.openURL(`https://wa.me/5493704123456?text=${encodeURIComponent(message)}`);
  }

  return (
    <View style={{ backgroundColor }} className="px-4 py-6 border-t border-gray-200">
      {/* Atención al cliente */}
      <View className="mb-6">
        <View className="flex-row items-center mb-3">
          <Ionicons name="headset" size={20} color={COLORS.primary} />
          <Text className="text-base font-bold text-gray-900 ml-2">
            Atención al cliente
          </Text>
        </View>

        <View className="bg-white rounded-lg p-4 border border-gray-200">
          <TouchableOpacity
            onPress={handleCallSupport}
            className="flex-row items-center mb-3"
          >
            <Ionicons name="call" size={18} color="#6B7280" />
            <Text className="text-base font-semibold text-gray-900 ml-2">
              0800 123 456
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-start mb-2">
            <Ionicons name="time-outline" size={18} color="#6B7280" />
            <View className="ml-2">
              <Text className="text-sm text-gray-700">
                Lunes a Viernes: 09:00 - 18:00
              </Text>
              <Text className="text-sm text-gray-700">
                Sábados: 09:00 - 13:00
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleWhatsApp}
            className="flex-row items-center mt-3 pt-3 border-t border-gray-100"
          >
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
            <Text className="text-base font-semibold ml-2" style={{ color: '#25D366' }}>
              Contactar por WhatsApp
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Newsletter */}
      {showNewsletter && (
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Ionicons name="mail" size={20} color={COLORS.primary} />
            <Text className="text-base font-bold text-gray-900 ml-2">
              Recibí ofertas y promociones
            </Text>
          </View>

          <View className="bg-white rounded-lg p-4 border border-gray-200">
            <Text className="text-sm text-gray-600 mb-3">
              Suscribite a nuestro newsletter y no te pierdas ninguna oferta
            </Text>
            <View className="flex-row items-center">
              <TextInput
                className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base mr-2"
                placeholder="tu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={handleSubscribe}
                className="rounded-lg px-4 py-3"
                style={{ backgroundColor: COLORS.primary }}
              >
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Enlaces útiles */}
      {showLinks && (
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Ionicons name="link" size={20} color={COLORS.primary} />
            <Text className="text-base font-bold text-gray-900 ml-2">
              Enlaces útiles
            </Text>
          </View>

          <View className="bg-white rounded-lg p-4 border border-gray-200">
            <TouchableOpacity className="flex-row items-center justify-between py-3 border-b border-gray-100">
              <View className="flex-row items-center">
                <Ionicons name="help-circle-outline" size={18} color="#6B7280" />
                <Text className="text-sm text-gray-700 ml-2">
                  Centro de ayuda
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between py-3 border-b border-gray-100">
              <View className="flex-row items-center">
                <Ionicons name="document-text-outline" size={18} color="#6B7280" />
                <Text className="text-sm text-gray-700 ml-2">
                  Términos y condiciones
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between py-3 border-b border-gray-100">
              <View className="flex-row items-center">
                <Ionicons name="shield-checkmark-outline" size={18} color="#6B7280" />
                <Text className="text-sm text-gray-700 ml-2">
                  Política de privacidad
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center">
                <Ionicons name="return-down-back-outline" size={18} color="#6B7280" />
                <Text className="text-sm text-gray-700 ml-2">
                  Devoluciones y cambios
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Redes sociales */}
      {showSocialMedia && (
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Ionicons name="share-social" size={20} color={COLORS.primary} />
            <Text className="text-base font-bold text-gray-900 ml-2">
              Seguinos
            </Text>
          </View>

          <View className="flex-row items-center justify-around bg-white rounded-lg p-4 border border-gray-200">
            <TouchableOpacity
              onPress={() => handleOpenLink('https://facebook.com')}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: '#1877F2' }}
            >
              <Ionicons name="logo-facebook" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleOpenLink('https://instagram.com')}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: '#E4405F' }}
            >
              <Ionicons name="logo-instagram" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleOpenLink('https://twitter.com')}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: '#1DA1F2' }}
            >
              <Ionicons name="logo-twitter" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleOpenLink('https://youtube.com')}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: '#FF0000' }}
            >
              <Ionicons name="logo-youtube" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleOpenLink('https://tiktok.com')}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: '#000000' }}
            >
              <Ionicons name="logo-tiktok" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Métodos de pago */}
      <View className="mb-6">
        <View className="flex-row items-center mb-3">
          <Ionicons name="card" size={20} color={COLORS.primary} />
          <Text className="text-base font-bold text-gray-900 ml-2">
            Medios de pago
          </Text>
        </View>

        <View className="bg-white rounded-lg p-4 border border-gray-200">
          <View className="flex-row flex-wrap items-center">
            <View className="bg-gray-100 rounded px-3 py-2 mr-2 mb-2">
              <Text className="text-xs font-semibold text-gray-700">💳 VISA</Text>
            </View>
            <View className="bg-gray-100 rounded px-3 py-2 mr-2 mb-2">
              <Text className="text-xs font-semibold text-gray-700">💳 Mastercard</Text>
            </View>
            <View className="bg-gray-100 rounded px-3 py-2 mr-2 mb-2">
              <Text className="text-xs font-semibold text-gray-700">💰 Efectivo</Text>
            </View>
            <View className="bg-gray-100 rounded px-3 py-2 mr-2 mb-2">
              <Text className="text-xs font-semibold text-gray-700">🏦 Transferencia</Text>
            </View>
            <View className="bg-blue-100 rounded px-3 py-2 mb-2">
              <Text className="text-xs font-semibold text-blue-700">💙 Mercado Pago</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Ubicación */}
      <View className="mb-6">
        <View className="flex-row items-center mb-3">
          <Ionicons name="location" size={20} color={COLORS.primary} />
          <Text className="text-base font-bold text-gray-900 ml-2">
            Ubicación
          </Text>
        </View>

        <View className="bg-white rounded-lg p-4 border border-gray-200">
          <View className="flex-row items-start">
            <Ionicons name="storefront" size={18} color="#6B7280" />
            <View className="ml-2 flex-1">
              <Text className="text-sm font-semibold text-gray-900 mb-1">
                Yo Compro Formosa
              </Text>
              <Text className="text-sm text-gray-700">
                Av. 25 de Mayo 123, Formosa Capital
              </Text>
              <Text className="text-sm text-gray-700">
                Formosa (3600), Argentina
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => handleOpenLink('https://maps.google.com')}
            className="mt-3 pt-3 border-t border-gray-100 flex-row items-center"
          >
            <Ionicons name="navigate" size={16} color={COLORS.primary} />
            <Text className="text-sm font-semibold ml-2" style={{ color: COLORS.primary }}>
              Ver en el mapa
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Copyright y versión */}
      <View className="border-t border-gray-200 pt-4">
        <Text className="text-center text-xs text-gray-500 mb-2">
          © 2025 Yo Compro Formosa. Todos los derechos reservados.
        </Text>
        <Text className="text-center text-xs text-gray-400">
          Versión 1.0.0
        </Text>
      </View>
    </View>
  );
}