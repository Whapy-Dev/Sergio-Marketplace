import { supabase } from './supabase';

export interface Review {
  id: string;
  product_id: string;
  seller_id: string;
  buyer_id: string;
  order_item_id: string;
  product_rating: number | null;
  seller_rating: number | null;
  comment: string | null;
  is_verified_purchase: boolean;
  seller_response: string | null;
  seller_responded_at: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  buyer?: any;
  seller?: any;
  product?: any;
}

export interface ProductRating {
  average_rating: number;
  total_reviews: number;
}

export interface RatingDistribution {
  rating: number;
  count: number;
}

// Crear una reseña
export async function createReview(data: {
  productId: string;
  sellerId: string;
  buyerId: string;
  orderItemId: string;
  productRating: number;
  sellerRating?: number;
  comment?: string;
}) {
  try {
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        product_id: data.productId,
        seller_id: data.sellerId,
        buyer_id: data.buyerId,
        order_item_id: data.orderItemId,
        product_rating: data.productRating,
        seller_rating: data.sellerRating || null,
        comment: data.comment || null,
        is_verified_purchase: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating review:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: review };
  } catch (error: any) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}

// Obtener reseñas de un producto
export async function getProductReviews(productId: string) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting reviews:', error);
      return [];
    }

    if (!data) return [];

    // Obtener datos de los compradores
    const reviewsWithBuyers = await Promise.all(
      data.map(async (review) => {
        const { data: buyer } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', review.buyer_id)
          .single();

        return {
          ...review,
          buyer,
        };
      })
    );

    return reviewsWithBuyers;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

// Obtener rating promedio de un producto
export async function getProductRating(productId: string): Promise<ProductRating> {
  try {
    const { data, error } = await supabase.rpc('get_product_rating', {
      product_uuid: productId,
    });

    if (error) {
      console.error('Error getting product rating:', error);
      return { average_rating: 0, total_reviews: 0 };
    }

    if (!data || data.length === 0) {
      return { average_rating: 0, total_reviews: 0 };
    }

    return {
      average_rating: parseFloat(data[0].average_rating) || 0,
      total_reviews: parseInt(data[0].total_reviews) || 0,
    };
  } catch (error) {
    console.error('Error:', error);
    return { average_rating: 0, total_reviews: 0 };
  }
}

// Obtener rating promedio de un vendedor
export async function getSellerRating(sellerId: string): Promise<ProductRating> {
  try {
    const { data, error } = await supabase.rpc('get_seller_rating', {
      seller_uuid: sellerId,
    });

    if (error) {
      console.error('Error getting seller rating:', error);
      return { average_rating: 0, total_reviews: 0 };
    }

    if (!data || data.length === 0) {
      return { average_rating: 0, total_reviews: 0 };
    }

    return {
      average_rating: parseFloat(data[0].average_rating) || 0,
      total_reviews: parseInt(data[0].total_reviews) || 0,
    };
  } catch (error) {
    console.error('Error:', error);
    return { average_rating: 0, total_reviews: 0 };
  }
}

// Obtener distribución de ratings
export async function getRatingDistribution(productId: string): Promise<RatingDistribution[]> {
  try {
    const { data, error } = await supabase.rpc('get_rating_distribution', {
      product_uuid: productId,
    });

    if (error) {
      console.error('Error getting rating distribution:', error);
      return [];
    }

    if (!data) return [];

    // Asegurar que existan todas las estrellas (1-5)
    const distribution: RatingDistribution[] = [5, 4, 3, 2, 1].map((rating) => {
      const found = data.find((d: any) => d.rating === rating);
      return {
        rating,
        count: found ? parseInt(found.count) : 0,
      };
    });

    return distribution;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

// Verificar si el usuario puede dejar reseña
export async function canUserReviewProduct(
  userId: string,
  productId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('can_user_review_product', {
      user_uuid: userId,
      product_uuid: productId,
    });

    if (error) {
      console.error('Error checking review eligibility:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

// Obtener reseña del usuario para un producto
export async function getUserReviewForProduct(
  userId: string,
  productId: string
): Promise<Review | null> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('buyer_id', userId)
      .eq('product_id', productId)
      .single();

    if (error) {
      // No encontrado no es un error real
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error getting user review:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Actualizar una reseña (solo el comentario)
export async function updateReview(
  reviewId: string,
  comment: string
) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .update({ comment })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      console.error('Error updating review:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}

// Eliminar una reseña
export async function deleteReview(reviewId: string) {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      console.error('Error deleting review:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}

// Vendedor responde a una reseña
export async function respondToReview(
  reviewId: string,
  sellerResponse: string
) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        seller_response: sellerResponse,
        seller_responded_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      console.error('Error responding to review:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}

// Obtener productos sin reseña del usuario
export async function getProductsToReview(userId: string) {
  try {
    // Obtener órdenes ENTREGADAS del usuario
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        order_items (
          id,
          product_id,
          products (
            id,
            name,
            image_url,
            seller_id
          )
        )
      `)
      .eq('buyer_id', userId)
      .eq('status', 'delivered');

    if (ordersError || !orders) {
      console.error('Error getting orders:', ordersError);
      return [];
    }

    // Obtener todas las reseñas del usuario
    const { data: existingReviews } = await supabase
      .from('reviews')
      .select('product_id')
      .eq('buyer_id', userId);

    const reviewedProductIds = new Set(
      existingReviews?.map((r) => r.product_id) || []
    );

    // Filtrar productos que no tienen reseña
    const productsToReview: any[] = [];
    orders.forEach((order: any) => {
      order.order_items?.forEach((item: any) => {
        if (
          item.products &&
          !reviewedProductIds.has(item.product_id)
        ) {
          productsToReview.push({
            order_item_id: item.id,
            product: item.products,
          });
        }
      });
    });

    return productsToReview;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}