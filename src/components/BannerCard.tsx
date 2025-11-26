import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { Banner } from '../services/banners';
import { COLORS } from '../constants/theme';
import { scale, moderateScale, verticalScale } from '../utils/responsive';
import { wp, hp } from '../utils/responsive';

interface BannerCardProps {
  banner: Banner;
  onPress: (banner: Banner) => void;
}

/**
 * BannerCard adaptativo según link_type
 * - product: Estilo enfocado en producto con imagen grande
 * - category: Estilo de categoría con icono
 * - store: Estilo de tienda oficial
 * - external/none: Estilo publicitario genérico con gradiente
 */
export default function BannerCard({ banner, onPress }: BannerCardProps) {
  const handlePress = () => {
    if (banner.link_type !== 'none') {
      onPress(banner);
    }
  };

  // Estilo según link_type
  switch (banner.link_type) {
    case 'product':
      return <ProductBanner banner={banner} onPress={handlePress} />;
    case 'category':
      return <CategoryBanner banner={banner} onPress={handlePress} />;
    case 'store':
      return <StoreBanner banner={banner} onPress={handlePress} />;
    default:
      return <GenericBanner banner={banner} onPress={handlePress} />;
  }
}

// Banner tipo Producto - Imagen destacada
function ProductBanner({ banner, onPress }: { banner: Banner; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.container}
    >
      <View style={styles.productBanner}>
        {/* Imagen del banner */}
        <Image
          source={{ uri: banner.image_url }}
          style={styles.productImage}
          resizeMode="cover"
        />

        {/* Overlay con gradiente */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.productOverlay}
        >
          <View style={styles.productContent}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {banner.title}
            </Text>
            {banner.description && (
              <Text style={styles.productDescription} numberOfLines={1}>
                {banner.description}
              </Text>
            )}
            <View style={styles.productCTA}>
              <Text style={styles.productCTAText}>Ver producto</Text>
              <Ionicons name="arrow-forward" size={scale(16)} color="#FFF" />
            </View>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}

// Banner tipo Categoría - Estilo colorido con icono
function CategoryBanner({ banner, onPress }: { banner: Banner; onPress: () => void }) {
  // Colores según la categoría (puedes personalizar)
  const categoryColors = {
    default: ['#2563EB', '#DC2626'],
    Electrónica: ['#3B82F6', '#8B5CF6'],
    Hogar: ['#10B981', '#34D399'],
    Moda: ['#EC4899', '#F472B6'],
    Deportes: ['#F59E0B', '#FBBF24'],
  };

  const colors = categoryColors[banner.link_value as keyof typeof categoryColors] || categoryColors.default;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.container}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.categoryBanner}
      >
        <View style={styles.categoryContent}>
          <View style={styles.categoryIcon}>
            <Ionicons name="pricetags" size={scale(32)} color="#FFF" />
          </View>
          <View style={styles.categoryText}>
            <Text style={styles.categoryTitle} numberOfLines={2}>
              {banner.title}
            </Text>
            {banner.description && (
              <Text style={styles.categoryDescription} numberOfLines={2}>
                {banner.description}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={scale(24)} color="rgba(255,255,255,0.8)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// Banner tipo Tienda - Estilo profesional
function StoreBanner({ banner, onPress }: { banner: Banner; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.container}
    >
      <LinearGradient
        colors={['#1E40AF', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.storeBanner}
      >
        <View style={styles.storeContent}>
          <View style={styles.storeIcon}>
            <Ionicons name="storefront" size={scale(40)} color="#FFF" />
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={scale(20)} color="#10B981" />
            </View>
          </View>
          <View style={styles.storeText}>
            <Text style={styles.storeTitle} numberOfLines={1}>
              {banner.title}
            </Text>
            {banner.description && (
              <Text style={styles.storeDescription} numberOfLines={2}>
                {banner.description}
              </Text>
            )}
            <Text style={styles.storeVisit}>Visitar tienda oficial →</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// Banner genérico - Con imagen de fondo
function GenericBanner({ banner, onPress }: { banner: Banner; onPress: () => void }) {
  // Si tiene imagen, mostrarla como fondo
  if (banner.image_url) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={styles.container}
        disabled={banner.link_type === 'none'}
      >
        <View style={styles.imageBanner}>
          <Image
            source={{ uri: banner.image_url }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
            style={styles.imageOverlay}
          >
            <View style={styles.imageContent}>
              <Text style={styles.imageTitle} numberOfLines={2}>
                {banner.title}
              </Text>
              {banner.description && (
                <Text style={styles.imageDescription} numberOfLines={2}>
                  {banner.description}
                </Text>
              )}
            </View>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    );
  }

  // Fallback con gradiente si no hay imagen
  const gradients = [
    ['#FF6B6B', '#FF8E8E'],
    ['#1E5EBE', '#2563EB'],
    ['#10B981', '#34D399'],
    ['#F59E0B', '#FBBF24'],
    ['#8B5CF6', '#A78BFA'],
  ];

  const gradientIndex = banner.id.charCodeAt(0) % gradients.length;
  const colors = gradients[gradientIndex];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.container}
      disabled={banner.link_type === 'none'}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.genericBanner}
      >
        <View style={styles.genericContent}>
          <View style={{ maxWidth: '65%' }}>
            <Text style={styles.genericTitle} numberOfLines={2}>
              {banner.title}
            </Text>
            {banner.description && (
              <Text style={styles.genericDescription} numberOfLines={2}>
                {banner.description}
              </Text>
            )}
          </View>

          <View style={styles.genericIcon}>
            <Ionicons
              name={banner.link_type === 'external' ? 'link' : 'gift'}
              size={scale(60)}
              color="rgba(255,255,255,0.3)"
            />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: scale(16),
  },

  // Image Banner (generic with image)
  imageBanner: {
    height: scale(180),
    borderRadius: scale(24),
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'flex-end',
  },
  imageContent: {
    padding: scale(20),
  },
  imageTitle: {
    fontSize: moderateScale(22),
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: scale(4),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  imageDescription: {
    fontSize: moderateScale(14),
    color: 'rgba(255,255,255,0.95)',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // Product Banner
  productBanner: {
    height: scale(200),
    borderRadius: scale(24),
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    justifyContent: 'flex-end',
  },
  productContent: {
    padding: scale(20),
  },
  productTitle: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: scale(4),
  },
  productDescription: {
    fontSize: moderateScale(14),
    color: 'rgba(255,255,255,0.9)',
    marginBottom: scale(8),
  },
  productCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(8),
  },
  productCTAText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#FFF',
    marginRight: scale(4),
  },

  // Category Banner
  categoryBanner: {
    height: scale(100),
    borderRadius: scale(20),
    padding: scale(20),
  },
  categoryContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(16),
  },
  categoryText: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: scale(4),
  },
  categoryDescription: {
    fontSize: moderateScale(13),
    color: 'rgba(255,255,255,0.9)',
  },

  // Store Banner
  storeBanner: {
    height: scale(120),
    borderRadius: scale(20),
    padding: scale(20),
  },
  storeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIcon: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(16),
    position: 'relative',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: scale(-4),
    right: scale(-4),
    backgroundColor: '#FFF',
    borderRadius: scale(12),
    padding: scale(2),
  },
  storeText: {
    flex: 1,
  },
  storeTitle: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: scale(6),
  },
  storeDescription: {
    fontSize: moderateScale(13),
    color: 'rgba(255,255,255,0.9)',
    marginBottom: scale(8),
  },
  storeVisit: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#FFF',
  },

  // Generic Banner
  genericBanner: {
    height: scale(150),
    borderRadius: scale(24),
    padding: scale(20),
    position: 'relative',
    overflow: 'hidden',
  },
  genericContent: {
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  genericTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: scale(6),
    lineHeight: scale(24),
  },
  genericDescription: {
    fontSize: moderateScale(13),
    color: 'rgba(255,255,255,0.95)',
    lineHeight: scale(18),
  },
  genericIcon: {
    position: 'absolute',
    bottom: scale(-10),
    right: scale(-10),
  },
});
