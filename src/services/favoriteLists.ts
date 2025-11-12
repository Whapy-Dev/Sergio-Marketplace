import { supabase } from './supabase';

export interface FavoriteList {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  product_count?: number;
  preview_images?: string[];
}

export interface FavoriteListItem {
  id: string;
  list_id: string;
  product_id: string;
  created_at: string;
}

// Obtener todas las listas del usuario
export async function getUserLists(userId: string): Promise<FavoriteList[]> {
  try {
    const { data: lists, error } = await supabase
      .from('favorite_lists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Para cada lista, obtener el conteo de productos y las primeras 3 imágenes
    const listsWithData = await Promise.all(
      (lists || []).map(async (list) => {
        // Obtener el conteo de productos
        const { count } = await supabase
          .from('favorite_list_items')
          .select('*', { count: 'exact', head: true })
          .eq('list_id', list.id);

        // Obtener las primeras 3 imágenes de productos
        const { data: items } = await supabase
          .from('favorite_list_items')
          .select(`
            product_id,
            products(image_url)
          `)
          .eq('list_id', list.id)
          .limit(3);

        const preview_images = items
          ?.map((item: any) => item.products?.image_url)
          .filter(Boolean) || [];

        return {
          ...list,
          product_count: count || 0,
          preview_images,
        };
      })
    );

    return listsWithData;
  } catch (error) {
    console.error('Error getting user lists:', error);
    return [];
  }
}

// Crear una nueva lista
export async function createList(userId: string, name: string): Promise<FavoriteList | null> {
  try {
    const { data, error } = await supabase
      .from('favorite_lists')
      .insert({
        user_id: userId,
        name,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating list:', error);
    return null;
  }
}

// Actualizar nombre de una lista
export async function updateListName(listId: string, name: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('favorite_lists')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', listId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating list:', error);
    return false;
  }
}

// Eliminar una lista
export async function deleteList(listId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('favorite_lists')
      .delete()
      .eq('id', listId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting list:', error);
    return false;
  }
}

// Obtener productos de una lista
export async function getListProducts(listId: string) {
  try {
    const { data, error } = await supabase
      .from('favorite_list_items')
      .select(`
        id,
        product_id,
        products(
          id,
          name,
          price,
          compare_at_price,
          image_url,
          stock,
          free_shipping
        )
      `)
      .eq('list_id', listId);

    if (error) throw error;
    return data?.map((item: any) => item.products).filter(Boolean) || [];
  } catch (error) {
    console.error('Error getting list products:', error);
    return [];
  }
}

// Agregar producto a una lista
export async function addProductToList(listId: string, productId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('favorite_list_items')
      .insert({
        list_id: listId,
        product_id: productId,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding product to list:', error);
    return false;
  }
}

// Eliminar producto de una lista
export async function removeProductFromList(listId: string, productId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('favorite_list_items')
      .delete()
      .eq('list_id', listId)
      .eq('product_id', productId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing product from list:', error);
    return false;
  }
}
