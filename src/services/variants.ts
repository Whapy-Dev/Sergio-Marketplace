import { supabase } from './supabase';

export interface VariantType {
  id: string;
  product_id: string;
  name: string;
  display_order: number;
  options?: VariantOption[];
}

export interface VariantOption {
  id: string;
  variant_type_id: string;
  value: string;
  color_hex?: string;
  display_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku?: string;
  price?: number;
  compare_at_price?: number;
  stock: number;
  is_active: boolean;
  options: Record<string, string>; // { "Color": "Rojo", "Talle": "M" }
  images?: VariantImage[];
}

export interface VariantImage {
  id: string;
  variant_id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
}

export interface ProductVariantsData {
  variantTypes: VariantType[];
  variants: ProductVariant[];
}

/**
 * Get all variant data for a product
 */
export async function getProductVariants(productId: string): Promise<ProductVariantsData> {
  try {
    // Get variant types with options
    const { data: types, error: typesError } = await supabase
      .from('product_variant_types')
      .select(`
        *,
        options:product_variant_options(*)
      `)
      .eq('product_id', productId)
      .order('display_order');

    if (typesError) throw typesError;

    // Get variants with images
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select(`
        *,
        images:product_variant_images(*)
      `)
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('created_at');

    if (variantsError) throw variantsError;

    return {
      variantTypes: (types || []).map(type => ({
        ...type,
        options: type.options?.sort((a: VariantOption, b: VariantOption) =>
          a.display_order - b.display_order
        )
      })),
      variants: (variants || []).map(variant => ({
        ...variant,
        images: variant.images?.sort((a: VariantImage, b: VariantImage) =>
          a.display_order - b.display_order
        )
      }))
    };
  } catch (error) {
    console.error('Error fetching product variants:', error);
    return { variantTypes: [], variants: [] };
  }
}

/**
 * Find a variant by selected options
 */
export function findVariantByOptions(
  variants: ProductVariant[],
  selectedOptions: Record<string, string>
): ProductVariant | undefined {
  return variants.find(variant => {
    const variantOptions = variant.options;
    return Object.keys(selectedOptions).every(
      key => variantOptions[key] === selectedOptions[key]
    );
  });
}

/**
 * Get available options for a variant type based on current selection
 */
export function getAvailableOptions(
  variants: ProductVariant[],
  variantTypeName: string,
  currentSelection: Record<string, string>
): string[] {
  const availableValues = new Set<string>();

  variants.forEach(variant => {
    // Check if this variant matches all currently selected options (except the one we're checking)
    const matchesOtherSelections = Object.entries(currentSelection).every(([key, value]) => {
      if (key === variantTypeName) return true;
      return variant.options[key] === value;
    });

    if (matchesOtherSelections && variant.stock > 0) {
      const optionValue = variant.options[variantTypeName];
      if (optionValue) {
        availableValues.add(optionValue);
      }
    }
  });

  return Array.from(availableValues);
}

/**
 * Create variant types for a product
 */
export async function createVariantTypes(
  productId: string,
  types: { name: string; options: { value: string; colorHex?: string }[] }[]
): Promise<boolean> {
  try {
    for (let i = 0; i < types.length; i++) {
      const type = types[i];

      // Create variant type
      const { data: variantType, error: typeError } = await supabase
        .from('product_variant_types')
        .insert({
          product_id: productId,
          name: type.name,
          display_order: i
        })
        .select()
        .single();

      if (typeError) throw typeError;

      // Create options for this type
      const optionsToInsert = type.options.map((opt, j) => ({
        variant_type_id: variantType.id,
        value: opt.value,
        color_hex: opt.colorHex,
        display_order: j
      }));

      const { error: optionsError } = await supabase
        .from('product_variant_options')
        .insert(optionsToInsert);

      if (optionsError) throw optionsError;
    }

    return true;
  } catch (error) {
    console.error('Error creating variant types:', error);
    return false;
  }
}

/**
 * Create a product variant
 */
export async function createVariant(
  productId: string,
  variant: {
    sku?: string;
    price?: number;
    compareAtPrice?: number;
    stock: number;
    options: Record<string, string>;
    images?: string[];
  }
): Promise<ProductVariant | null> {
  try {
    // Create variant
    const { data: newVariant, error: variantError } = await supabase
      .from('product_variants')
      .insert({
        product_id: productId,
        sku: variant.sku,
        price: variant.price,
        compare_at_price: variant.compareAtPrice,
        stock: variant.stock,
        options: variant.options
      })
      .select()
      .single();

    if (variantError) throw variantError;

    // Create variant images
    if (variant.images && variant.images.length > 0) {
      const imagesToInsert = variant.images.map((url, i) => ({
        variant_id: newVariant.id,
        image_url: url,
        display_order: i,
        is_primary: i === 0
      }));

      const { error: imagesError } = await supabase
        .from('product_variant_images')
        .insert(imagesToInsert);

      if (imagesError) throw imagesError;
    }

    return newVariant;
  } catch (error) {
    console.error('Error creating variant:', error);
    return null;
  }
}

/**
 * Update variant stock
 */
export async function updateVariantStock(
  variantId: string,
  newStock: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('product_variants')
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', variantId);

    return !error;
  } catch (error) {
    console.error('Error updating variant stock:', error);
    return false;
  }
}

/**
 * Delete all variants for a product
 */
export async function deleteProductVariants(productId: string): Promise<boolean> {
  try {
    // Delete variant types (will cascade to options)
    await supabase
      .from('product_variant_types')
      .delete()
      .eq('product_id', productId);

    // Delete variants (will cascade to images)
    await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', productId);

    return true;
  } catch (error) {
    console.error('Error deleting product variants:', error);
    return false;
  }
}

/**
 * Get variant image for display (first image of variant or product image)
 */
export function getVariantDisplayImage(
  variant: ProductVariant | undefined,
  productImageUrl?: string
): string | undefined {
  if (variant?.images && variant.images.length > 0) {
    const primaryImage = variant.images.find(img => img.is_primary);
    return primaryImage?.image_url || variant.images[0].image_url;
  }
  return productImageUrl;
}
