import React, { useRef, useState } from 'react';
import { View, ScrollView, Image, Dimensions, TouchableOpacity, Text } from 'react-native';
import type { Banner } from '../services/banners';
import { scale, wp, hp } from '../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - scale(32); // 16px padding on each side (scaled)
const BANNER_HEIGHT = scale(160);

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
    <View style={{ marginBottom: scale(24) }}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={BANNER_WIDTH}
        contentContainerStyle={{ paddingHorizontal: scale(16) }}
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
                borderRadius: scale(12),
              }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      {banners.length > 1 && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: scale(12) }}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={{
                height: scale(8),
                borderRadius: scale(4),
                marginHorizontal: scale(4),
                backgroundColor: index === activeIndex ? '#2563EB' : '#D1D5DB',
                width: index === activeIndex ? scale(24) : scale(8),
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
