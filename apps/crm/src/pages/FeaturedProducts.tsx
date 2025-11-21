import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  is_featured: boolean;
  featured_order: number;
  featured_until: string | null;
  seller_name?: string;
  status: string;
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        image_url,
        is_featured,
        featured_order,
        featured_until,
        status,
        sellers(store_name)
      `)
      .eq('status', 'active')
      .order('featured_order', { ascending: true });

    if (!error && data) {
      const formatted = data.map((p: any) => ({
        ...p,
        seller_name: p.sellers?.store_name || 'Sin tienda'
      }));

      setProducts(formatted.filter(p => !p.is_featured));
      setFeaturedProducts(formatted.filter(p => p.is_featured).sort((a, b) => a.featured_order - b.featured_order));
    }

    setLoading(false);
  }

  async function addToFeatured(productId: string) {
    const maxOrder = featuredProducts.length > 0
      ? Math.max(...featuredProducts.map(p => p.featured_order)) + 1
      : 1;

    const { error } = await supabase
      .from('products')
      .update({
        is_featured: true,
        featured_order: maxOrder
      })
      .eq('id', productId);

    if (!error) loadProducts();
  }

  async function removeFromFeatured(productId: string) {
    const { error } = await supabase
      .from('products')
      .update({
        is_featured: false,
        featured_order: 0,
        featured_until: null
      })
      .eq('id', productId);

    if (!error) loadProducts();
  }

  async function moveUp(index: number) {
    if (index === 0) return;
    const newOrder = [...featuredProducts];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];

    for (let i = 0; i < newOrder.length; i++) {
      await supabase
        .from('products')
        .update({ featured_order: i + 1 })
        .eq('id', newOrder[i].id);
    }
    loadProducts();
  }

  async function moveDown(index: number) {
    if (index === featuredProducts.length - 1) return;
    const newOrder = [...featuredProducts];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];

    for (let i = 0; i < newOrder.length; i++) {
      await supabase
        .from('products')
        .update({ featured_order: i + 1 })
        .eq('id', newOrder[i].id);
    }
    loadProducts();
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.seller_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Productos Destacados</h1>
        <p className="mt-2 text-gray-600">
          Gestiona que productos aparecen en el home de la app
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Featured Products */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              Productos en Home ({featuredProducts.length})
            </h2>
            <p className="text-sm text-gray-500">Usa las flechas para reordenar</p>
          </div>

          <div className="p-4">
            {featuredProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay productos destacados
              </div>
            ) : (
              <div className="space-y-3">
                {featuredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ²
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === featuredProducts.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ¼
                      </button>
                    </div>

                    <span className="text-lg font-bold text-primary-600 w-8">
                      #{index + 1}
                    </span>

                    <img
                      src={product.image_url || 'https://via.placeholder.com/50'}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        {product.seller_name} - ${product.price.toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => removeFromFeatured(product.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Available Products */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              Productos Disponibles ({filteredProducts.length})
            </h2>
            <input
              type="text"
              placeholder="Buscar producto o tienda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="p-4 max-h-[600px] overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay productos disponibles
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <img
                      src={product.image_url || 'https://via.placeholder.com/50'}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">
                        {product.seller_name} - ${product.price.toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => addToFeatured(product.id)}
                      className="bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700"
                    >
                      + Agregar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
