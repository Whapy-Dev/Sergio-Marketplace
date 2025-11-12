import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';

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

  return (
    <TouchableOpacity
      onPress={onPress}
      className="border-b border-gray-300 pb-4 mb-4"
      activeOpacity={0.7}
    >
      <View className="flex-row">
        {/* Imagen del producto */}
        <View className="w-[133px] h-[133px] bg-gray-100 rounded-lg items-center justify-center mr-3">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              className="w-full h-full rounded-lg"
              resizeMode="contain"
            />
          ) : (
            <Text className="text-5xl">📦</Text>
          )}
        </View>

        {/* Información del producto */}
        <View className="flex-1 justify-between">
          {/* Nombre del producto */}
          <Text className="text-xs font-medium text-black" numberOfLines={2}>
            {name}
          </Text>

          {/* Precio anterior (si existe) */}
          {compareAtPrice && (
            <Text className="text-xs text-gray-400 line-through mt-1">
              ${compareAtPrice.toLocaleString('es-AR')}
            </Text>
          )}

          {/* Precio principal */}
          <Text className="text-lg font-semibold text-black mt-1">
            ${price.toLocaleString('es-AR')}
          </Text>

          {/* Precio sin impuestos */}
          <Text className="text-[10px] font-light text-gray-500 mt-0.5">
            Precio sin imp. nac. ${priceWithoutTax.toLocaleString('es-AR')}
          </Text>

          {/* Botones de acción */}
          <View className="flex-row mt-2 justify-between">
            <TouchableOpacity onPress={handleRemoveFavorite}>
              <Text className="text-xs font-medium text-primary">
                Quitar de favoritos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleAddToCart}>
              <Text className="text-xs font-medium text-primary">
                Añadir al carrito
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
