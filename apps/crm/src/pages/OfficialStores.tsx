import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { OfficialStore } from '../types';

export default function OfficialStores() {
  const [stores, setStores] = useState<OfficialStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStores();
  }, []);

  async function loadStores() {
    setLoading(true);
    const { data, error } = await supabase
      .from('official_stores')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setStores(data);
    }
    setLoading(false);
  }

  async function toggleStoreStatus(store: OfficialStore) {
    const newStatus = !store.is_active;
    const { error } = await supabase
      .from('official_stores')
      .update({ is_active: newStatus })
      .eq('id', store.id);

    if (!error) {
      alert(`Tienda ${newStatus ? 'activada' : 'desactivada'}`);
      loadStores();
    }
  }

  async function suspendStore(store: OfficialStore) {
    if (!confirm(`¿Suspender la tienda "${store.store_name}"?`)) return;

    const { error } = await supabase
      .from('official_stores')
      .update({
        verification_status: 'suspended',
        is_active: false,
      })
      .eq('id', store.id);

    if (!error) {
      alert('Tienda suspendida');
      loadStores();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tiendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tiendas Oficiales</h1>
        <p className="mt-2 text-gray-600">{stores.length} tiendas registradas</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {stores.map((store) => (
          <div
            key={store.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{store.store_name}</h3>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      store.verification_status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : store.verification_status === 'suspended'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {store.verification_status === 'approved'
                      ? 'Aprobada'
                      : store.verification_status === 'suspended'
                      ? 'Suspendida'
                      : store.verification_status}
                  </span>
                  {!store.is_active && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                      Inactiva
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-4">{store.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Rating</p>
                    <p className="font-semibold text-gray-900">⭐ {store.rating.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Ventas</p>
                    <p className="font-semibold text-gray-900">{store.total_sales}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Productos</p>
                    <p className="font-semibold text-gray-900">{store.total_products}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Seguidores</p>
                    <p className="font-semibold text-gray-900">{store.followers_count}</p>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Email:</span> {store.email}
                  </p>
                  <p>
                    <span className="font-medium">Teléfono:</span> {store.phone || 'N/A'}
                  </p>
                  <p>
                    <span className="font-medium">Ubicación:</span> {store.city}, {store.state}
                  </p>
                  <p>
                    <span className="font-medium">Tipo:</span> {store.business_type}
                  </p>
                </div>
              </div>

              <div className="ml-4 flex flex-col gap-2">
                {store.verification_status === 'approved' && (
                  <>
                    <button
                      onClick={() => toggleStoreStatus(store)}
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                        store.is_active
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {store.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => suspendStore(store)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition"
                    >
                      Suspender
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
