import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, moderateScale, verticalScale } from '../../utils/responsive';

export default function TermsScreen({ navigation }: any) {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Text className="text-primary text-2xl font-bold">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Términos y Condiciones</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        <Text className="text-sm text-gray-500 mb-4">
          Última actualización: 21 de Octubre, 2025
        </Text>

        {/* 1. Aceptación */}
        <Text className="text-lg font-bold text-gray-900 mb-2">
          1. Aceptación de los Términos
        </Text>
        <Text className="text-base text-gray-700 mb-4 leading-6">
          Al acceder y usar Marketplace Formosa, aceptas estar sujeto a estos términos y condiciones. Si no estás de acuerdo con alguna parte de estos términos, no debes usar nuestros servicios.
        </Text>

        {/* 2. Uso del servicio */}
        <Text className="text-lg font-bold text-gray-900 mb-2">
          2. Uso del Servicio
        </Text>
        <Text className="text-base text-gray-700 mb-4 leading-6">
          Marketplace Formosa es una plataforma que conecta compradores y vendedores en Formosa, Argentina. Nos reservamos el derecho de modificar o discontinuar el servicio en cualquier momento sin previo aviso.
        </Text>

        {/* 3. Registro de cuenta */}
        <Text className="text-lg font-bold text-gray-900 mb-2">
          3. Registro de Cuenta
        </Text>
        <Text className="text-base text-gray-700 mb-4 leading-6">
          Para usar ciertas funciones, debes registrarte y mantener una cuenta activa. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta.
        </Text>

        {/* 4. Compras y pagos */}
        <Text className="text-lg font-bold text-gray-900 mb-2">
          4. Compras y Pagos
        </Text>
        <Text className="text-base text-gray-700 mb-4 leading-6">
          Al realizar una compra, garantizas que la información proporcionada es precisa y completa. Los precios están sujetos a cambios sin previo aviso. Nos reservamos el derecho de rechazar cualquier pedido.
        </Text>

        {/* 5. Política de devoluciones */}
        <Text className="text-lg font-bold text-gray-900 mb-2">
          5. Política de Devoluciones
        </Text>
        <Text className="text-base text-gray-700 mb-4 leading-6">
          Tienes 7 días corridos desde la recepción del producto para solicitar una devolución. El producto debe estar sin uso, en su empaque original y con todos sus accesorios.
        </Text>

        {/* 6. Vendedores */}
        <Text className="text-lg font-bold text-gray-900 mb-2">
          6. Vendedores
        </Text>
        <Text className="text-base text-gray-700 mb-4 leading-6">
          Los vendedores son responsables de la exactitud de las descripciones de sus productos, precios y disponibilidad. Marketplace Formosa actúa como intermediario y no es responsable de las transacciones entre compradores y vendedores.
        </Text>

        {/* 7. Propiedad intelectual */}
        <Text className="text-lg font-bold text-gray-900 mb-2">
          7. Propiedad Intelectual
        </Text>
        <Text className="text-base text-gray-700 mb-4 leading-6">
          Todo el contenido de la plataforma, incluyendo textos, gráficos, logos y software, es propiedad de Marketplace Formosa y está protegido por las leyes de propiedad intelectual.
        </Text>

        {/* 8. Privacidad */}
        <Text className="text-lg font-bold text-gray-900 mb-2">
          8. Privacidad
        </Text>
        <Text className="text-base text-gray-700 mb-4 leading-6">
          Tu privacidad es importante para nosotros. Consulta nuestra Política de Privacidad para conocer cómo recopilamos, usamos y protegemos tu información personal.
        </Text>

        {/* 9. Limitación de responsabilidad */}
        <Text className="text-lg font-bold text-gray-900 mb-2">
          9. Limitación de Responsabilidad
        </Text>
        <Text className="text-base text-gray-700 mb-4 leading-6">
          Marketplace Formosa no será responsable por daños indirectos, incidentales, especiales o consecuentes que resulten del uso o la imposibilidad de usar nuestros servicios.
        </Text>

        {/* 10. Modificaciones */}
        <Text className="text-lg font-bold text-gray-900 mb-2">
          10. Modificaciones
        </Text>
        <Text className="text-base text-gray-700 mb-4 leading-6">
          Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación en la plataforma.
        </Text>

        {/* 11. Contacto */}
        <Text className="text-lg font-bold text-gray-900 mb-2">
          11. Contacto
        </Text>
        <Text className="text-base text-gray-700 mb-6 leading-6">
          Si tienes preguntas sobre estos términos, contáctanos en soporte@marketplace.com
        </Text>

        <View className="bg-gray-50 rounded-lg p-4 mb-6">
          <Text className="text-sm text-gray-600 text-center">
            Al continuar usando Marketplace Formosa, aceptas estos términos y condiciones
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}