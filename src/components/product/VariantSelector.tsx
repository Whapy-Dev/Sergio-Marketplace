import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { scale } from '../../utils/responsive';
import { VariantType, ProductVariant, getAvailableOptions } from '../../services/variants';

interface VariantSelectorProps {
  variantTypes: VariantType[];
  variants: ProductVariant[];
  selectedOptions: Record<string, string>;
  onSelectOption: (typeName: string, value: string) => void;
}

export default function VariantSelector({
  variantTypes,
  variants,
  selectedOptions,
  onSelectOption,
}: VariantSelectorProps) {
  if (variantTypes.length === 0) return null;

  return (
    <View className="mb-4">
      {variantTypes.map((type) => {
        const availableOptions = getAvailableOptions(variants, type.name, selectedOptions);

        return (
          <View key={type.id} className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              {type.name}
              {selectedOptions[type.name] && (
                <Text className="font-normal text-gray-500">
                  : {selectedOptions[type.name]}
                </Text>
              )}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row"
            >
              {type.options?.map((option) => {
                const isSelected = selectedOptions[type.name] === option.value;
                const isAvailable = availableOptions.includes(option.value);
                const isColorOption = !!option.color_hex;

                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => onSelectOption(type.name, option.value)}
                    disabled={!isAvailable}
                    className={`mr-2 ${!isAvailable ? 'opacity-40' : ''}`}
                  >
                    {isColorOption ? (
                      // Color swatch
                      <View
                        className={`w-10 h-10 rounded-full border-2 ${
                          isSelected ? 'border-primary' : 'border-gray-300'
                        }`}
                        style={{ padding: scale(2) }}
                      >
                        <View
                          className="flex-1 rounded-full"
                          style={{ backgroundColor: option.color_hex }}
                        />
                        {!isAvailable && (
                          <View className="absolute inset-0 items-center justify-center">
                            <View className="w-8 h-0.5 bg-gray-400 rotate-45" />
                          </View>
                        )}
                      </View>
                    ) : (
                      // Text option (size, etc.)
                      <View
                        className={`px-4 py-2 rounded-lg border ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            isSelected ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          {option.value}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        );
      })}
    </View>
  );
}
