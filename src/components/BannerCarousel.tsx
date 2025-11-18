import React, { useRef, useState } from 'react';
import { View, ScrollView, Image, Dimensions, TouchableOpacity, Text } from 'react-native';
import type { Banner } from '../services/banners';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 32; // 16px padding on each side
const BANNER_HEIGHT = 160;

interface BannerCarouselProps {
  banners: Banner[];
  onBannerPress?: (banner: Banner) => void;
}

export default function BannerCarousel({ banners, onBannerPress }: BannerCarouselProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!banners || banners.length === 0) {
    return null;
  }

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / BANNER_WIDTH);
    setActiveIndex(index);
  };

  const handleBannerPress = (banner: Banner) => {
    if (onBannerPress) {
      onBannerPress(banner);
    }
  };

  return (
    <View className="mb-6">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={BANNER_WIDTH}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {banners.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            onPress={() => handleBannerPress(banner)}
            activeOpacity={banner.link_type === 'none' ? 1 : 0.8}
            style={{ width: BANNER_WIDTH, marginRight: 0 }}
          >
            <Image
              source={{ uri: banner.image_url }}
              style={{
                width: BANNER_WIDTH,
                height: BANNER_HEIGHT,
                borderRadius: 12,
              }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      {banners.length > 1 && (
        <View className="flex-row justify-center items-center mt-3">
          {banners.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full mx-1 ${
                index === activeIndex
                  ? 'bg-primary w-6'
                  : 'bg-gray-300 w-2'
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
}
