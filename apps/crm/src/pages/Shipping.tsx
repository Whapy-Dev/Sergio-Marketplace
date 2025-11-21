import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ShippingZone {
  id: string;
  name: string;
  provinces: string[];
  is_active: boolean;
}

interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  carrier?: string;
  estimated_days_min: number;
  estimated_days_max: number;
  is_active: boolean;
}

interface ShippingRate {
  id: string;
  zone_id: string;
  method_id: string;
  base_price: number;
  price_per_kg: number;
  free_shipping_min?: number;
  max_weight_kg?: number;
  is_active: boolean;
  zone?: ShippingZone;
  method?: ShippingMethod;
}

export default function Shipping() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rates' | 'zones' | 'methods'>('rates');

  // Modal states
  const [showRateModal, setShowRateModal] = useState(false);
  const [editingRate, setEditingRate] = useState<Partial<ShippingRate> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [zonesRes, methodsRes, ratesRes] = await Promise.all([
        supabase.from('shipping_zones').select('*').order('name'),
        supabase.from('shipping_methods').select('*').order('estimated_days_min'),
        supabase.from('shipping_rates').select('*, zone:shipping_zones(*), method:shipping_methods(*)').order('zone_id'),
      ]);

      if (zonesRes.data) setZones(zonesRes.data);
      if (methodsRes.data) setMethods(methodsRes.data);
      if (ratesRes.data) setRates(ratesRes.data);
    } catch (error) {
      console.error('Error loading shipping data:', error);
    }
    setLoading(false);
  };

  const openRateModal = (rate?: ShippingRate) => {
    if (rate) {
      setEditingRate(rate);
    } else {
      setEditingRate({
        zone_id: zones[0]?.id,
        method_id: methods[0]?.id,
        base_price: 0,
        price_per_kg: 0,
        is_active: true,
      });
    }
    setShowRateModal(true);
  };

  const saveRate = async () => {
    if (!editingRate?.zone_id || !editingRate?.method_id) return;

    setSaving(true);
    try {
      const rateData = {
        zone_id: editingRate.zone_id,
        method_id: editingRate.method_id,
        base_price: editingRate.base_price || 0,
        price_per_kg: editingRate.price_per_kg || 0,
        free_shipping_min: editingRate.free_shipping_min || null,
        max_weight_kg: editingRate.max_weight_kg || null,
        is_active: editingRate.is_active,
      };

      if (editingRate.id) {
        const { error } = await supabase
          .from('shipping_rates')
          .update(rateData)
          .eq('id', editingRate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('shipping_rates')
          .insert(rateData);
        if (error) throw error;
      }

      setShowRateModal(false);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Error al guardar tarifa');
    }
    setSaving(false);
  };

  const toggleRateActive = async (rate: ShippingRate) => {
    try {
      const { error } = await supabase
        .from('shipping_rates')
        .update({ is_active: !rate.is_active })
        .eq('id', rate.id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error toggling rate:', error);
    }
  };

  const deleteRate = async (rate: ShippingRate) => {
    if (!confirm('¿Eliminar esta tarifa de envío?')) return;

    try {
      const { error } = await supabase
        .from('shipping_rates')
        .delete()
        .eq('id', rate.id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting rate:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Configuración de Envíos</h1>
        {activeTab === 'rates' && (
          <button
            onClick={() => openRateModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Nueva Tarifa
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Zonas de Envío</p>
          <p className="text-2xl font-bold">{zones.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Métodos de Envío</p>
          <p className="text-2xl font-bold">{methods.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Tarifas Configuradas</p>
          <p className="text-2xl font-bold text-green-600">
            {rates.filter(r => r.is_active).length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['rates', 'zones', 'methods'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'rates' ? 'Tarifas' : tab === 'zones' ? 'Zonas' : 'Métodos'}
            </button>
          ))}
        </nav>
      </div>

      {/* Rates Tab */}
      {activeTab === 'rates' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {rates.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay tarifas configuradas
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zona</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Base</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Por Kg</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Envío Gratis</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {rate.zone?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>{rate.method?.name || '-'}</div>
                      <div className="text-xs text-gray-400">
                        {rate.method?.estimated_days_min}-{rate.method?.estimated_days_max} días
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ${rate.base_price.toLocaleString('es-AR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      ${rate.price_per_kg.toLocaleString('es-AR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {rate.free_shipping_min
                        ? `> $${rate.free_shipping_min.toLocaleString('es-AR')}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        rate.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rate.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => openRateModal(rate)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleRateActive(rate)}
                        className="text-yellow-600 hover:text-yellow-800"
                      >
                        {rate.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => deleteRate(rate)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Zones Tab */}
      {activeTab === 'zones' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zona</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provincias</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {zones.map((zone) => (
                <tr key={zone.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {zone.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {zone.provinces.join(', ')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      zone.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {zone.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Methods Tab */}
      {activeTab === 'methods' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transportista</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiempo Estimado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {methods.map((method) => (
                <tr key={method.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{method.name}</div>
                    <div className="text-xs text-gray-500">{method.description}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {method.carrier || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {method.estimated_days_min}-{method.estimated_days_max} días
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      method.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {method.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rate Modal */}
      {showRateModal && editingRate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingRate.id ? 'Editar Tarifa' : 'Nueva Tarifa'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zona</label>
                <select
                  value={editingRate.zone_id || ''}
                  onChange={(e) => setEditingRate({ ...editingRate, zone_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
                <select
                  value={editingRate.method_id || ''}
                  onChange={(e) => setEditingRate({ ...editingRate, method_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {methods.map((method) => (
                    <option key={method.id} value={method.id}>{method.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio Base ($)</label>
                <input
                  type="number"
                  value={editingRate.base_price || ''}
                  onChange={(e) => setEditingRate({
                    ...editingRate,
                    base_price: parseFloat(e.target.value) || 0,
                  })}
                  min="0"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio por Kg ($)</label>
                <input
                  type="number"
                  value={editingRate.price_per_kg || ''}
                  onChange={(e) => setEditingRate({
                    ...editingRate,
                    price_per_kg: parseFloat(e.target.value) || 0,
                  })}
                  min="0"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Envío Gratis desde ($)
                </label>
                <input
                  type="number"
                  value={editingRate.free_shipping_min || ''}
                  onChange={(e) => setEditingRate({
                    ...editingRate,
                    free_shipping_min: parseFloat(e.target.value) || undefined,
                  })}
                  min="0"
                  placeholder="Sin envío gratis"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingRate.is_active}
                  onChange={(e) => setEditingRate({
                    ...editingRate,
                    is_active: e.target.checked,
                  })}
                  className="mr-2"
                />
                <span className="text-sm">Activo</span>
              </label>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowRateModal(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveRate}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
