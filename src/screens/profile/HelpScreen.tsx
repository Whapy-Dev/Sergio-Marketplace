import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { scale, moderateScale, verticalScale } from '../../utils/responsive';

const FAQ_ITEMS = [
  {
    id: '1',
    question: '¿Cómo realizo una compra?',
    answer: 'Navega por los productos, selecciona el que te interese, agrégalo al carrito y completa el proceso de pago. Recibirás una confirmación por email.',
  },
  {
    id: '2',
    question: '¿Cuáles son los métodos de pago?',
    answer: 'Aceptamos efectivo contra entrega, transferencia bancaria y Mercado Pago.',
  },
  {
    id: '3',
    question: '¿Cuánto tarda la entrega?',
    answer: 'En Formosa capital, las entregas se realizan en 24-48 horas hábiles. Te notificaremos cuando tu pedido esté en camino.',
  },
  {
    id: '4',
    question: '¿Puedo devolver un producto?',
    answer: 'Sí, tienes 7 días corridos desde que recibes el producto para solicitar una devolución. El producto debe estar sin uso y en su empaque original.',
  },
  {
    id: '5',
    question: '¿Cómo me convierto en vendedor?',
    answer: 'Ve a tu perfil y solicita convertirte en vendedor. Revisaremos tu solicitud y te contactaremos en 24-48 horas.',
  },
  {
    id: '6',
    question: '¿El envío es gratis?',
    answer: 'Sí, todos los envíos en Formosa capital son gratuitos sin mínimo de compra.',
  },
  {
    id: '7',
    question: '¿Cómo contacto al vendedor?',
    answer: 'En la página del producto encontrarás un botón "Contactar vendedor" para enviar mensajes directos.',
  },
  {
    id: '8',
    question: '¿Puedo modificar mi pedido?',
    answer: 'Solo puedes modificar pedidos que aún no hayan sido confirmados. Contacta a soporte lo antes posible.',
  },
];

export default function HelpScreen({ navigation }: any) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleItem(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Ayuda y Soporte</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Banner de contacto */}
        <View className="mx-4 my-4 p-4 bg-blue-50 rounded-lg">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            ¿Necesitas ayuda adicional?
          </Text>
          <Text className="text-sm text-gray-600 mb-3">
            Nuestro equipo está disponible de lunes a viernes de 9 a 18hs
          </Text>
          <TouchableOpacity className="bg-primary rounded-lg py-2 px-4">
            <Text className="text-white font-semibold text-center">
              Contactar Soporte
            </Text>
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <View className="px-4 py-2">
          <Text className="text-sm font-semibold text-gray-500 mb-3">
            PREGUNTAS FRECUENTES
          </Text>

          {FAQ_ITEMS.map((item) => {
            const isExpanded = expandedId === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => toggleItem(item.id)}
                className="border-b border-gray-100 py-4"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 text-base font-medium text-gray-900 pr-4">
                    {item.question}
                  </Text>
                  <Text className="text-primary text-xl">
                    {isExpanded ? '−' : '+'}
                  </Text>
                </View>

                {isExpanded && (
                  <Text className="text-sm text-gray-600 mt-2 leading-5">
                    {item.answer}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Información de contacto */}
        <View className="px-4 py-4 mb-6">
          <Text className="text-sm font-semibold text-gray-500 mb-3">
            OTROS CANALES DE CONTACTO
          </Text>

          <View className="flex-row items-center py-3">
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
              <Ionicons name="mail-outline" size={20} color="#2563EB" />
            </View>
            <View>
              <Text className="text-sm text-gray-500">Email</Text>
              <Text className="text-base text-gray-900">soporte@marketplace.com</Text>
            </View>
          </View>

          <View className="flex-row items-center py-3">
            <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
              <Ionicons name="logo-whatsapp" size={20} color="#16A34A" />
            </View>
            <View>
              <Text className="text-sm text-gray-500">WhatsApp</Text>
              <Text className="text-base text-gray-900">+54 370 123-4567</Text>
            </View>
          </View>

          <View className="flex-row items-center py-3">
            <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
              <Ionicons name="location-outline" size={20} color="#DC2626" />
            </View>
            <View>
              <Text className="text-sm text-gray-500">Dirección</Text>
              <Text className="text-base text-gray-900">Formosa, Argentina</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}