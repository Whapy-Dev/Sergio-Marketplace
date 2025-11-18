import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  title: string;
  price: number;
  condition: string;
  status: string;
  stock: number;
  created_at: string;
  profiles?: {
    email: string;
    full_name?: string;
  };
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'sold'>('all');

  useEffect(() => {
    loadProducts();
  }, [filter]);

  async function loadProducts() {
    setLoading(true);

    let query = supabase
      .from('products')
      .select(`
        *,
        profiles:seller_id (
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
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
        <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
        <p className="mt-2 text-gray-600">{products.length} productos</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {(['all', 'active', 'paused', 'sold'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {status === 'all' ? 'Todos' : status === 'active' ? 'Activos' : status === 'paused' ? 'Pausados' : 'Vendidos'}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{product.title}</h3>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <span className="text-gray-600">
                    Precio: <span className="font-semibold text-gray-900">${product.price.toLocaleString()}</span>
                  </span>
                  <span className="text-gray-600">
                    Stock: <span className="font-semibold text-gray-900">{product.stock}</span>
                  </span>
                  <span className="text-gray-600">
                    Condición: <span className="font-semibold text-gray-900">{product.condition}</span>
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Vendedor: {product.profiles?.full_name || product.profiles?.email || 'N/A'}
                </p>
              </div>
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  product.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : product.status === 'paused'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {product.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
