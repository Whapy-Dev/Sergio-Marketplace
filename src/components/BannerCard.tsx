import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { Banner } from '../services/banners';
import { COLORS } from '../constants/theme';

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
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
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
            <Ionicons name="pricetags" size={32} color="#FFF" />
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
          <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
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
            <Ionicons name="storefront" size={40} color="#FFF" />
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
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

// Banner genérico - Estilo publicitario con gradiente
function GenericBanner({ banner, onPress }: { banner: Banner; onPress: () => void }) {
  // Gradientes variados para banners genéricos
  const gradients = [
    ['#FF6B6B', '#FF8E8E'],
    ['#1E5EBE', '#2563EB'],
    ['#10B981', '#34D399'],
    ['#F59E0B', '#FBBF24'],
    ['#8B5CF6', '#A78BFA'],
  ];

  // Seleccionar gradiente basado en el ID del banner (pseudo-aleatorio pero consistente)
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

          {/* Icono decorativo */}
          <View style={styles.genericIcon}>
            <Ionicons
              name={banner.link_type === 'external' ? 'link' : 'gift'}
              size={60}
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
    marginBottom: 16,
  },

  // Product Banner
  productBanner: {
    height: 200,
    borderRadius: 24,
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
    padding: 20,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  productCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  productCTAText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginRight: 4,
  },

  // Category Banner
  categoryBanner: {
    height: 100,
    borderRadius: 20,
    padding: 20,
  },
  categoryContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryText: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },

  // Store Banner
  storeBanner: {
    height: 120,
    borderRadius: 20,
    padding: 20,
  },
  storeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 2,
  },
  storeText: {
    flex: 1,
  },
  storeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 6,
  },
  storeDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  storeVisit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },

  // Generic Banner
  genericBanner: {
    height: 150,
    borderRadius: 24,
    padding: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 6,
    lineHeight: 24,
  },
  genericDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    lineHeight: 18,
  },
  genericIcon: {
    position: 'absolute',
    bottom: -10,
    right: -10,
  },
});
