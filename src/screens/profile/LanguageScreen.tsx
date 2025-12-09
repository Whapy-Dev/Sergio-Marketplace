import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { scale, moderateScale, verticalScale } from '../../utils/responsive';

const LANGUAGES = [
  { id: 'es', name: 'Español', flag: '🇦🇷' },
  { id: 'en', name: 'English', flag: '🇺🇸' },
  { id: 'pt', name: 'Português', flag: '🇧🇷' },
];

export default function LanguageScreen({ navigation }: any) {
  const [selectedLanguage, setSelectedLanguage] = useState('es');

  function handleSelectLanguage(languageId: string) {
    setSelectedLanguage(languageId);
    // Aquí implementarías la lógica para cambiar el idioma de la app
    setTimeout(() => {
      navigation.goBack();
    }, 300);
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Idioma</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="px-4 py-4">
          <Text className="text-sm text-gray-600 mb-4">
            Selecciona el idioma de la aplicación
          </Text>

          {LANGUAGES.map((language) => (
            <TouchableOpacity
              key={language.id}
              onPress={() => handleSelectLanguage(language.id)}
              className={`flex-row items-center justify-between py-4 px-4 mb-2 rounded-lg ${
                selectedLanguage === language.id ? 'bg-blue-50 border border-primary' : 'bg-gray-50'
              }`}
            >
              <View className="flex-row items-center flex-1">
                <Text className="text-3xl mr-3">{language.flag}</Text>
                <Text
                  className={`text-base font-medium ${
                    selectedLanguage === language.id ? 'text-primary' : 'text-gray-900'
                  }`}
                >
                  {language.name}
                </Text>
              </View>
              {selectedLanguage === language.id && (
                <Ionicons name="checkmark" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View className="px-4 py-4">
          <View className="bg-gray-50 rounded-lg p-4">
            <Text className="text-sm text-gray-600 text-center">
              Próximamente: Más idiomas disponibles
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}