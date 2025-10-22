import { supabase } from './supabase';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  seller_id: string;
  category_id: string;
  stock: number;
  status: string;
  free_shipping: boolean;
  image_url?: string;
  shipping_cost: number | null;
  condition: string;
  specifications: any;
  brand: string | null;
  sku: string | null;
  weight: number | null;
  shipping_type: string;
  accepts_returns: boolean;
  views: number;
  favorites: number;
  sales: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  display_order: number;
  is_primary: boolean;
}

export interface ProductWithDetails extends Product {
  images: ProductImage[];
  seller?: {
    id: string;
    business_name: string;
    rating: number;
    total_sales: number;
  };
}

export async function getProducts(limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data as Product[];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

export async function getProductById(id: string): Promise<ProductWithDetails | null> {
  try {
    // 1. Obtener el producto
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (productError || !product) {
      console.error('Error fetching product:', productError);
      return null;
    }

    console.log('✅ Producto obtenido:', product.name);

    // 2. QUERY DE DEBUG - Ver TODAS las imágenes primero
    const { data: allImages } = await supabase
      .from('product_images')
      .select('*');
    
    console.log('🌍 TODAS las imágenes en la BD:', allImages);
    console.log('🌍 Total de imágenes:', allImages?.length || 0);
    
    // 3. Ahora intentar filtrar por product_id
    let images: ProductImage[] = [];
    
    const { data: imagesData, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', id)
      .order('display_order', { ascending: true });

    console.log('🔍 Buscando imágenes para product_id:', id);
    console.log('🖼️ Imágenes encontradas:', imagesData);
    console.log('🖼️ Cantidad:', imagesData?.length || 0);
    console.log('❌ Error del query:', imagesError);

    if (!imagesError && imagesData) {
      images = imagesData;
    }

    // 4. Obtener info del vendedor
    let seller = undefined;
    try {
      const { data: sellerData, error: sellerError } = await supabase
        .from('profiles')
        .select('id, full_name, business_name')
        .eq('id', product.seller_id)
        .single();

      if (!sellerError && sellerData) {
        seller = {
          id: sellerData.id,
          business_name: sellerData.business_name || sellerData.full_name || 'Vendedor',
          rating: 4.5,
          total_sales: 0,
        };
      }
    } catch (e) {
      console.log('Could not fetch seller info');
    }

    // 5. Incrementar vistas
    await supabase
      .from('products')
      .update({ views: (product.views || 0) + 1 })
      .eq('id', id);

    return {
      ...product,
      images,
      seller,
    } as ProductWithDetails;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
export async function getProductsByCategory(categoryId: string, limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }

    return data as Product[];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

export async function getProductsBySeller(sellerId: string, limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching products by seller:', error);
      return [];
    }

    return data as Product[];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}