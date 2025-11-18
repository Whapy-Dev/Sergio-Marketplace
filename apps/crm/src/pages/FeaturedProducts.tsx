import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  title: string;
  price: number;
  is_featured: boolean;
  featured_until?: string;
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);

    // Load all active products
    const { data: allProducts } = await supabase
      .from('products')
      .select('id, title, price, is_featured, featured_until')
      .eq('status', 'active')
      .order('title');

    // Load featured products
    const { data: featured } = await supabase
      .from('products')
      .select('id, title, price, is_featured, featured_until')
      .eq('is_featured', true)
      .order('featured_until', { ascending: true });

    if (allProducts) setProducts(allProducts);
    if (featured) setFeaturedProducts(featured);

    setLoading(false);
  }

  async function featureProduct(productId: string, days: number) {
    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + days);

    const { error } = await supabase
      .from('products')
      .update({
        is_featured: true,
        featured_until: featuredUntil.toISOString(),
      })
      .eq('id', productId);

    if (!error) {
      alert(`Producto destacado por ${days} días`);
      loadProducts();
    }
  }

  async function unfeatureProduct(productId: string) {
    const { error } = await supabase
      .from('products')
      .update({
        is_featured: false,
        featured_until: null,
      })
      .eq('id', productId);

    if (!error) {
      alert('Producto removido de destacados');
      loadProducts();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Productos Destacados</h1>
        <p className="mt-2 text-gray-600">Gestiona los productos destacados en la home</p>
      </div>

      {/* Currently Featured */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Actualmente Destacados</h2>
        {featuredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-gray-600">No hay productos destacados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">{product.title}</h3>
                  <p className="text-sm text-gray-600">${product.price.toLocaleString()}</p>
                  {product.featured_until && (
                    <p className="text-xs text-gray-500 mt-1">
                      Hasta: {new Date(product.featured_until).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => unfeatureProduct(product.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Products */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Productos Disponibles</h2>
        <div className="grid grid-cols-1 gap-4">
          {products
            .filter((p) => !p.is_featured)
            .map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">{product.title}</h3>
                  <p className="text-sm text-gray-600">${product.price.toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => featureProduct(product.id, 7)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
                  >
                    7 días
                  </button>
                  <button
                    onClick={() => featureProduct(product.id, 30)}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition"
                  >
                    30 días
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
