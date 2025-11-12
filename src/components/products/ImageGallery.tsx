import React, { useState } from 'react';
import { View, Image, ScrollView, Dimensions, Text } from 'react-native';

interface ImageGalleryProps {
  images: string[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH;

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Si no hay imágenes, mostrar placeholder
  const displayImages = images.length > 0 ? images : ['placeholder'];

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  return (
    <View>
      {/* Carrusel de imágenes */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {displayImages.map((imageUrl, index) => (
          <View
            key={index}
            className="bg-gray-100 items-center justify-center"
            style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}
          >
            {imageUrl === 'placeholder' ? (
              <Text className="text-8xl">📦</Text>
            ) : (
              <Image
                source={{ uri: imageUrl }}
                className="w-full h-full"
                resizeMode="contain"
              />
            )}
          </View>
        ))}
      </ScrollView>

      {/* Indicadores (dots) */}
      {displayImages.length > 1 && (
        <View className="flex-row justify-center items-center py-3">
          {displayImages.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full mx-1 ${
                index === activeIndex ? 'bg-primary w-6' : 'bg-gray-300 w-2'
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
}