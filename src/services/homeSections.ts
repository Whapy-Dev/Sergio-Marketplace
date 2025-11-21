import { supabase } from './supabase';

export interface HomeSection {
  id: string;
  name: string;
  slug: string;
  title: string;
  subtitle: string | null;
  display_order: number;
  is_active: boolean;
  layout_type: 'horizontal' | 'vertical' | 'grid';
  max_products: number;
  products: HomeSectionProduct[];
}

export interface HomeSectionProduct {
  id: string;
  product_id: string;
  display_order: number;
  custom_label: string | null;
  custom_label_color: string;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    compare_at_price?: number;
  };
}

export async function getHomeSections(): Promise<HomeSection[]> {
  try {
    // Get active sections
    const { data: sections, error: sectionsError } = await supabase
      .from('home_sections')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (sectionsError || !sections) {
      console.error('Error fetching sections:', sectionsError);
      return [];
    }

    // Get products for each section
    const sectionsWithProducts: HomeSection[] = [];

    for (const section of sections) {
      const { data: sectionProducts, error: productsError } = await supabase
        .from('home_section_products')
        .select(`
          id,
          product_id,
          display_order,
          custom_label,
          custom_label_color,
          products(id, name, price, image_url, compare_at_price)
        `)
        .eq('section_id', section.id)
        .order('display_order', { ascending: true })
        .limit(section.max_products);

      if (!productsError && sectionProducts) {
        const formattedProducts = sectionProducts
          .filter((sp: any) => sp.products)
          .map((sp: any) => ({
            id: sp.id,
            product_id: sp.product_id,
            display_order: sp.display_order,
            custom_label: sp.custom_label,
            custom_label_color: sp.custom_label_color,
            product: sp.products
          }));

        sectionsWithProducts.push({
          ...section,
          products: formattedProducts
        });
      }
    }

    return sectionsWithProducts;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

// Fallback function if sections table doesn't exist yet
export async function getDefaultProducts(limit: number = 10) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('is_featured', { ascending: false, nullsFirst: false })
    .order('featured_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data || [];
}
