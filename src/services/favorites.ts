import { supabase } from './supabase';

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export async function getFavorites(userId: string) {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        product_id,
        created_at,
        products (
          id,
          name,
          price,
          compare_at_price,
          stock,
          free_shipping
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching favorites:', error);
      return [];
    }

    console.log('✅ getFavorites result:', data);
    return data || [];
  } catch (error) {
    console.error('❌ Error:', error);
    return [];
  }
}

export async function addFavorite(userId: string, productId: string) {
  try {
    console.log('🟢 addFavorite llamado:', { userId, productId });
    
    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        product_id: productId,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error adding favorite:', error);
      return null;
    }

    console.log('✅ Favorite agregado:', data);
    return data;
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

export async function removeFavorite(userId: string, productId: string) {
  try {
    console.log('🔴 removeFavorite llamado:', { userId, productId });
    
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) {
      console.error('❌ Error removing favorite:', error);
      return false;
    }

    console.log('✅ Favorite removido');
    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

export async function isFavorite(userId: string, productId: string) {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking favorite:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}