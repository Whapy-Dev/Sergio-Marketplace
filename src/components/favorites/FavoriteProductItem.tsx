import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { scale, moderateScale, wp } from '../../utils/responsive';

interface FavoriteProductItemProps {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string;
  onPress: () => void;
}

export default function FavoriteProductItem({
  id,
  name,
  price,
  compareAtPrice,
  imageUrl,
  onPress
}: FavoriteProductItemProps) {
  const { addItem } = useCart();
  const { toggleFavorite } = useFavorites();

  // Calcular precio sin impuestos (aproximadamente 21% menos)
  const priceWithoutTax = Math.round(price * 0.79);

  const handleAddToCart = (e: any) => {
    e.stopPropagation();
    addItem({ id, name, price, imageUrl, sellerId: '' });
  };

  const handleRemoveFavorite = async (e: any) => {
    e.stopPropagation();
    await toggleFavorite(id);
  };

  const imageSize = scale(133);
  const spacing = scale(12);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        borderBottomWidth: 1,
        borderBottomColor: '#D1D5DB',
        paddingBottom: scale(16),
        marginBottom: scale(16),
      }}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row' }}>
        {/* Imagen del producto */}
        <View style={{
          width: imageSize,
          height: imageSize,
          backgroundColor: '#F3F4F6',
          borderRadius: scale(8),
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing,
        }}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: scale(8),
              }}
              resizeMode="contain"
            />
          ) : (
            <Ionicons name="cube-outline" size={scale(40)} color="#9CA3AF" />
          )}
        </View>

        {/* Información del producto */}
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          {/* Nombre del producto */}
          <Text style={{ fontSize: moderateScale(12), fontWeight: '500', color: '#000' }} numberOfLines={2}>
            {name}
          </Text>

          {/* Precio anterior (si existe) */}
          {compareAtPrice && (
            <Text style={{ fontSize: moderateScale(12), color: '#9CA3AF', textDecorationLine: 'line-through', marginTop: scale(4) }}>
              ${compareAtPrice.toLocaleString('es-AR')}
            </Text>
          )}

          {/* Precio principal */}
          <Text style={{ fontSize: moderateScale(18), fontWeight: '600', color: '#000', marginTop: scale(4) }}>
            ${price.toLocaleString('es-AR')}
          </Text>

          {/* Precio sin impuestos */}
          <Text style={{ fontSize: moderateScale(10), fontWeight: '300', color: '#6B7280', marginTop: scale(2) }}>
            Precio sin imp. nac. ${priceWithoutTax.toLocaleString('es-AR')}
          </Text>

          {/* Botones de acción */}
          <View style={{ flexDirection: 'row', marginTop: scale(8), justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={handleRemoveFavorite}>
              <Text style={{ fontSize: moderateScale(12), fontWeight: '500', color: '#2563EB' }}>
                Quitar de favoritos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleAddToCart}>
              <Text style={{ fontSize: moderateScale(12), fontWeight: '500', color: '#2563EB' }}>
                Añadir al carrito
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
