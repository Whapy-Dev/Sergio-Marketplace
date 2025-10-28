import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  stock: number;
}

interface FavoritesContextType {
  favorites: string[];
  favoriteProducts: Product[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    saveFavorites();
    loadFavoriteProducts();
  }, [favorites]);

  async function loadFavorites() {
    try {
      const savedFavorites = await AsyncStorage.getItem('favorites');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }

  async function saveFavorites() {
    try {
      await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }

  async function loadFavoriteProducts() {
    if (favorites.length === 0) {
      setFavoriteProducts([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image_url, stock')
        .in('id', favorites);

      if (error) {
        console.error('Error loading favorite products:', error);
      } else {
        setFavoriteProducts(data || []);
      }
    } catch (error) {
      console.error('Error loading favorite products:', error);
    }
  }

  function isFavorite(productId: string): boolean {
    return favorites.includes(productId);
  }

  function toggleFavorite(productId: string) {
    setFavorites((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  }

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteProducts,
        isFavorite,
        toggleFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}