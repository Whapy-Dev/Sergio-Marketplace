import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getFavorites, addFavorite, removeFavorite } from '../services/favorites';

interface FavoritesContextType {
  favorites: string[];
  loading: boolean;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('🟢 FavoritesProvider - user cambió:', user?.id);
    if (user) {
      loadFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  async function loadFavorites() {
    if (!user) {
      console.log('⚠️ loadFavorites - No hay user');
      return;
    }

    try {
      setLoading(true);
      console.log('📥 Cargando favoritos para user:', user.id);
      const data = await getFavorites(user.id);
      const productIds = data.map((fav: any) => fav.product_id);
      setFavorites(productIds);
      console.log('✅ Favoritos cargados:', productIds);
    } catch (error) {
      console.error('❌ Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }

  function checkIsFavorite(productId: string): boolean {
    const result = favorites.includes(productId);
    return result;
  }

  async function toggleFavorite(productId: string): Promise<boolean> {
    console.log('🔵 toggleFavorite LLAMADO - productId:', productId.slice(0, 8));
    console.log('🔵 user:', user?.id);
    console.log('🔵 favorites actuales:', favorites);

    if (!user) {
      console.error('❌ toggleFavorite - No hay user');
      return false;
    }

    const currentlyFavorite = favorites.includes(productId);
    console.log('🔵 currentlyFavorite:', currentlyFavorite);

    try {
      if (currentlyFavorite) {
        // REMOVER
        console.log('🔴 Intentando remover...');
        const success = await removeFavorite(user.id, productId);
        console.log('🔴 removeFavorite result:', success);
        
        if (success) {
          const newFavs = favorites.filter((id) => id !== productId);
          setFavorites(newFavs);
          console.log('✅ REMOVIDO - Nuevos favoritos:', newFavs);
          return true;
        } else {
          console.log('❌ No se pudo remover');
          return false;
        }
      } else {
        // AGREGAR
        console.log('🟢 Intentando agregar...');
        const result = await addFavorite(user.id, productId);
        console.log('🟢 addFavorite result:', result);
        
        if (result) {
          const newFavs = [...favorites, productId];
          setFavorites(newFavs);
          console.log('✅ AGREGADO - Nuevos favoritos:', newFavs);
          return true;
        } else {
          console.log('❌ No se pudo agregar');
          return false;
        }
      }
    } catch (error) {
      console.error('❌ Error en toggleFavorite:', error);
      return false;
    }
  }

  const value = {
    favorites,
    loading,
    isFavorite: checkIsFavorite,
    toggleFavorite,
    refreshFavorites: loadFavorites,
  };

  console.log('🎨 FavoritesProvider render - favorites:', favorites.length);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};