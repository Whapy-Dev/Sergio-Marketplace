/**
 * Reviews Service
 * Handles product reviews and ratings
 */

import { supabase } from './supabase';

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id?: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  status: 'pending' | 'approved' | 'rejected';
  helpful_count: number;
  seller_response?: string;
  seller_responded_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface CreateReviewData {
  product_id: string;
  user_id: string;
  order_id?: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface ReviewStats {
  average: number;
  total: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

/**
 * Create a new review
 */
export async function createReview(data: CreateReviewData): Promise<Review | null> {
  try {
    // Check if user already reviewed this product
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('product_id', data.product_id)
      .eq('user_id', data.user_id)
      .single();

    if (existing) {
      throw new Error('Ya has reseñado este producto');
    }

    // If order_id provided, verify purchase
    if (data.order_id) {
      const { data: order } = await supabase
        .from('orders')
        .select('id, status')
        .eq('id', data.order_id)
        .eq('buyer_id', data.user_id)
        .single();

      if (!order || !['completed', 'delivered'].includes(order.status)) {
        throw new Error('Solo puedes reseñar productos que hayas comprado');
      }
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        product_id: data.product_id,
        user_id: data.user_id,
        order_id: data.order_id,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        images: data.images,
        status: 'approved', // Auto-approve or set to 'pending' for moderation
      })
      .select()
      .single();

    if (error) throw error;

    return review;
  } catch (error: any) {
    console.error('Error creating review:', error);
    throw error;
  }
}

/**
 * Get reviews for a product
 */
export async function getProductReviews(
  productId: string,
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: 'recent' | 'helpful' | 'rating_high' | 'rating_low';
  }
): Promise<Review[]> {
  try {
    let query = supabase
      .from('reviews')
      .select(`
        *,
        user:profiles!reviews_buyer_id_fkey(id, full_name, avatar_url)
      `)
      .eq('product_id', productId)
      .eq('status', 'approved');

    // Sorting
    switch (options?.sortBy) {
      case 'helpful':
        query = query.order('helpful_count', { ascending: false });
        break;
      case 'rating_high':
        query = query.order('rating', { ascending: false });
        break;
      case 'rating_low':
        query = query.order('rating', { ascending: true });
        break;
      default: // recent
        query = query.order('created_at', { ascending: false });
    }

    // Pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return [];
  }
}

/**
 * Get review statistics for a product
 */
export async function getProductReviewStats(productId: string): Promise<ReviewStats> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('status', 'approved');

    if (error) throw error;

    const reviews = data || [];
    const total = reviews.length;

    if (total === 0) {
      return {
        average: 0,
        total: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = Math.round((sum / total) * 10) / 10;

    const distribution = {
      1: reviews.filter((r) => r.rating === 1).length,
      2: reviews.filter((r) => r.rating === 2).length,
      3: reviews.filter((r) => r.rating === 3).length,
      4: reviews.filter((r) => r.rating === 4).length,
      5: reviews.filter((r) => r.rating === 5).length,
    };

    return { average, total, distribution };
  } catch (error) {
    console.error('Error fetching review stats:', error);
    return {
      average: 0,
      total: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }
}

/**
 * Get user's reviews
 */
export async function getUserReviews(userId: string): Promise<Review[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        product:products(id, name, images)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return [];
  }
}

/**
 * Update a review
 */
export async function updateReview(
  reviewId: string,
  userId: string,
  data: {
    rating?: number;
    title?: string;
    comment?: string;
    images?: string[];
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('reviews')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .eq('user_id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error updating review:', error);
    return false;
  }
}

/**
 * Delete a review
 */
export async function deleteReview(
  reviewId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting review:', error);
    return false;
  }
}

/**
 * Vote on a review (helpful/not helpful)
 */
export async function voteOnReview(
  reviewId: string,
  userId: string,
  isHelpful: boolean
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('review_votes')
      .upsert(
        {
          review_id: reviewId,
          user_id: userId,
          is_helpful: isHelpful,
        },
        {
          onConflict: 'review_id,user_id',
        }
      );

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error voting on review:', error);
    return false;
  }
}

/**
 * Remove vote from a review
 */
export async function removeVote(
  reviewId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('review_votes')
      .delete()
      .eq('review_id', reviewId)
      .eq('user_id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error removing vote:', error);
    return false;
  }
}

/**
 * Check if user has purchased a product
 */
export async function hasUserPurchasedProduct(
  userId: string,
  productId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        id,
        order:orders!inner(id, buyer_id, status)
      `)
      .eq('product_id', productId)
      .eq('order.buyer_id', userId)
      .in('order.status', ['completed', 'delivered'])
      .limit(1);

    if (error) throw error;

    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking purchase:', error);
    return false;
  }
}

/**
 * Check if user has already reviewed a product
 */
export async function hasUserReviewedProduct(
  userId: string,
  productId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return !!data;
  } catch (error) {
    console.error('Error checking review:', error);
    return false;
  }
}

/**
 * Seller responds to a review
 */
export async function respondToReview(
  reviewId: string,
  sellerId: string,
  response: string
): Promise<boolean> {
  try {
    // Verify seller owns the product
    const { data: review } = await supabase
      .from('reviews')
      .select('product_id')
      .eq('id', reviewId)
      .single();

    if (!review) return false;

    const { data: product } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', review.product_id)
      .single();

    if (product?.seller_id !== sellerId) {
      throw new Error('No tienes permiso para responder esta reseña');
    }

    const { error } = await supabase
      .from('reviews')
      .update({
        seller_response: response,
        seller_responded_at: new Date().toISOString(),
      })
      .eq('id', reviewId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error responding to review:', error);
    return false;
  }
}

/**
 * Format rating stars (for display)
 */
export function formatRatingStars(rating: number): string {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
}
