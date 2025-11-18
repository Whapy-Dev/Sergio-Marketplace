import { supabase } from './supabase';
import type {
  OfficialStore,
  OfficialStoreWithDetails,
  StoreMetrics,
  StorePolicies,
  StoreApplication,
  CreateStoreApplicationData,
  UpdateStoreData,
} from '../types/officialStore';

// =====================================================
// OFFICIAL STORES
// =====================================================

/**
 * Get all approved and active official stores
 */
export async function getOfficialStores(
  limit: number = 20
): Promise<OfficialStore[]> {
  try {
    const { data, error } = await supabase
      .from('official_stores')
      .select('*')
      .eq('verification_status', 'approved')
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .order('total_sales', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching official stores:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getOfficialStores:', error);
    return [];
  }
}

/**
 * Get official store by ID with all details
 */
export async function getOfficialStoreById(
  storeId: string,
  userId?: string
): Promise<OfficialStoreWithDetails | null> {
  try {
    // Get store data
    const { data: store, error: storeError } = await supabase
      .from('official_stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      console.error('Error fetching store:', storeError);
      return null;
    }

    // Get store metrics
    const { data: metrics } = await supabase
      .from('store_metrics')
      .select('*')
      .eq('store_id', storeId)
      .eq('metric_type', 'all_time')
      .single();

    // Get store policies
    const { data: policies } = await supabase
      .from('store_policies')
      .select('*')
      .eq('store_id', storeId)
      .single();

    // Check if user follows this store
    let isFollowed = false;
    if (userId) {
      const { data: follower } = await supabase
        .from('store_followers')
        .select('id')
        .eq('store_id', storeId)
        .eq('user_id', userId)
        .single();

      isFollowed = !!follower;
    }

    // Get store products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('official_store_id', storeId)
      .eq('status', 'active')
      .limit(12);

    return {
      ...store,
      metrics: metrics || undefined,
      policies: policies || undefined,
      is_followed: isFollowed,
      products: products || [],
    };
  } catch (error) {
    console.error('Error in getOfficialStoreById:', error);
    return null;
  }
}

/**
 * Get official store by slug
 */
export async function getOfficialStoreBySlug(
  slug: string,
  userId?: string
): Promise<OfficialStoreWithDetails | null> {
  try {
    const { data: store, error } = await supabase
      .from('official_stores')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !store) {
      console.error('Error fetching store by slug:', error);
      return null;
    }

    return getOfficialStoreById(store.id, userId);
  } catch (error) {
    console.error('Error in getOfficialStoreBySlug:', error);
    return null;
  }
}

/**
 * Get user's own official store (if they have one)
 */
export async function getUserOfficialStore(
  userId: string
): Promise<OfficialStore | null> {
  try {
    const { data, error } = await supabase
      .from('official_stores')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - user doesn't have a store
        return null;
      }
      console.error('Error fetching user store:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserOfficialStore:', error);
    return null;
  }
}

/**
 * Update official store information
 */
export async function updateOfficialStore(
  storeId: string,
  updates: UpdateStoreData
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('official_stores')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId);

    if (error) {
      console.error('Error updating store:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateOfficialStore:', error);
    return false;
  }
}

// =====================================================
// STORE FOLLOWERS
// =====================================================

/**
 * Follow an official store
 */
export async function followStore(
  userId: string,
  storeId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from('store_followers').insert({
      user_id: userId,
      store_id: storeId,
    });

    if (error) {
      console.error('Error following store:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in followStore:', error);
    return false;
  }
}

/**
 * Unfollow an official store
 */
export async function unfollowStore(
  userId: string,
  storeId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('store_followers')
      .delete()
      .eq('user_id', userId)
      .eq('store_id', storeId);

    if (error) {
      console.error('Error unfollowing store:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in unfollowStore:', error);
    return false;
  }
}

/**
 * Get stores followed by user
 */
export async function getUserFollowedStores(
  userId: string
): Promise<OfficialStore[]> {
  try {
    const { data, error } = await supabase
      .from('store_followers')
      .select('store_id, official_stores(*)')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching followed stores:', error);
      return [];
    }

    return (data || []).map((item: any) => item.official_stores).filter(Boolean);
  } catch (error) {
    console.error('Error in getUserFollowedStores:', error);
    return [];
  }
}

/**
 * Check if user follows a store
 */
export async function isFollowingStore(
  userId: string,
  storeId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('store_followers')
      .select('id')
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .single();

    if (error) {
      return false;
    }

    return !!data;
  } catch (error) {
    return false;
  }
}

// =====================================================
// STORE APPLICATIONS
// =====================================================

/**
 * Submit application to become an official store
 */
export async function submitStoreApplication(
  userId: string,
  applicationData: CreateStoreApplicationData,
  documents?: Record<string, string>
): Promise<{ success: boolean; applicationId?: string }> {
  try {
    const { data, error } = await supabase
      .from('store_applications')
      .insert({
        user_id: userId,
        application_data: applicationData,
        documents: documents || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting application:', error);
      return { success: false };
    }

    return { success: true, applicationId: data.id };
  } catch (error) {
    console.error('Error in submitStoreApplication:', error);
    return { success: false };
  }
}

/**
 * Get user's store application status
 */
export async function getUserStoreApplication(
  userId: string
): Promise<StoreApplication | null> {
  try {
    const { data, error } = await supabase
      .from('store_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No application found
        return null;
      }
      console.error('Error fetching application:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserStoreApplication:', error);
    return null;
  }
}

/**
 * Update store application
 */
export async function updateStoreApplication(
  applicationId: string,
  updates: Partial<StoreApplication>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('store_applications')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (error) {
      console.error('Error updating application:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateStoreApplication:', error);
    return false;
  }
}

// =====================================================
// STORE PRODUCTS
// =====================================================

/**
 * Get products from an official store
 */
export async function getStoreProducts(
  storeId: string,
  limit: number = 20,
  offset: number = 0
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('official_store_id', storeId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching store products:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getStoreProducts:', error);
    return [];
  }
}

/**
 * Search products from official stores
 */
export async function searchOfficialStoreProducts(
  query: string,
  limit: number = 20
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, official_stores!inner(*)')
      .not('official_store_id', 'is', null)
      .eq('official_stores.verification_status', 'approved')
      .eq('status', 'active')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching store products:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchOfficialStoreProducts:', error);
    return [];
  }
}
