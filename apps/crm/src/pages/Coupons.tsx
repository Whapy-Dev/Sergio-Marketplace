import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_discount?: number;
  usage_limit?: number;
  usage_per_user: number;
  current_usage: number;
  starts_at: string;
  expires_at?: string;
  is_active: boolean;
  applies_to: string;
  first_purchase_only: boolean;
  new_users_only: boolean;
  created_at: string;
}

const defaultCoupon: Partial<Coupon> = {
  code: '',
  name: '',
  description: '',
  discount_type: 'percentage',
  discount_value: 10,
  min_purchase: 0,
  max_discount: undefined,
  usage_limit: undefined,
  usage_per_user: 1,
  starts_at: new Date().toISOString().slice(0, 16),
  expires_at: undefined,
  is_active: true,
  applies_to: 'all',
  first_purchase_only: false,
  new_users_only: false,
};

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error loading coupons:', error);
    }
    setLoading(false);
  };

  const openModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon({
        ...coupon,
        starts_at: coupon.starts_at.slice(0, 16),
        expires_at: coupon.expires_at?.slice(0, 16),
      });
    } else {
      setEditingCoupon({ ...defaultCoupon });
    }
    setShowModal(true);
  };

  const saveCoupon = async () => {
    if (!editingCoupon?.code || !editingCoupon?.name) return;

    setSaving(true);
    try {
      const couponData = {
        code: editingCoupon.code.toUpperCase(),
        name: editingCoupon.name,
        description: editingCoupon.description,
        discount_type: editingCoupon.discount_type,
        discount_value: editingCoupon.discount_value,
        min_purchase: editingCoupon.min_purchase || 0,
        max_discount: editingCoupon.max_discount || null,
        usage_limit: editingCoupon.usage_limit || null,
        usage_per_user: editingCoupon.usage_per_user || 1,
        starts_at: editingCoupon.starts_at,
        expires_at: editingCoupon.expires_at || null,
        is_active: editingCoupon.is_active,
        applies_to: editingCoupon.applies_to,
        first_purchase_only: editingCoupon.first_purchase_only,
        new_users_only: editingCoupon.new_users_only,
      };

      if (editingCoupon.id) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert(couponData);
        if (error) throw error;
      }

      setShowModal(false);
      loadCoupons();
    } catch (error: any) {
      alert(error.message || 'Error al guardar cupón');
    }
    setSaving(false);
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id);

      if (error) throw error;
      loadCoupons();
    } catch (error) {
      console.error('Error toggling coupon:', error);
    }
  };

  const deleteCoupon = async (coupon: Coupon) => {
    if (!confirm(`¿Eliminar cupón "${coupon.code}"?`)) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', coupon.id);

      if (error) throw error;
      loadCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isExpired = (coupon: Coupon) => {
    if (!coupon.expires_at) return false;
    return new Date(coupon.expires_at) < new Date();
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
        <h1 className="text-2xl font-bold text-gray-900">Cupones de Descuento</h1>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Nuevo Cupón
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Cupones</p>
          <p className="text-2xl font-bold">{coupons.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Activos</p>
          <p className="text-2xl font-bold text-green-600">
            {coupons.filter(c => c.is_active && !isExpired(c)).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Expirados</p>
          <p className="text-2xl font-bold text-red-600">
            {coupons.filter(c => isExpired(c)).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Usos Totales</p>
          <p className="text-2xl font-bold text-blue-600">
            {coupons.reduce((sum, c) => sum + c.current_usage, 0)}
          </p>
        </div>
      </div>

      {/* Coupons table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {coupons.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay cupones creados aún
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Descuento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Usos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Validez
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono font-bold text-gray-900">
                      {coupon.code}
                    </div>
                    <div className="text-xs text-gray-500">{coupon.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-green-600">
                      {coupon.discount_type === 'percentage'
                        ? `${coupon.discount_value}%`
                        : `$${coupon.discount_value}`}
                    </span>
                    {coupon.min_purchase > 0 && (
                      <div className="text-xs text-gray-500">
                        Mín: ${coupon.min_purchase}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {coupon.current_usage}
                    {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{formatDate(coupon.starts_at)}</div>
                    {coupon.expires_at && (
                      <div className="text-xs">
                        hasta {formatDate(coupon.expires_at)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isExpired(coupon) ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        Expirado
                      </span>
                    ) : coupon.is_active ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Activo
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => openModal(coupon)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleActive(coupon)}
                      className="text-yellow-600 hover:text-yellow-800"
                    >
                      {coupon.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => deleteCoupon(coupon)}
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

      {/* Modal */}
      {showModal && editingCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingCoupon.id ? 'Editar Cupón' : 'Nuevo Cupón'}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  value={editingCoupon.code || ''}
                  onChange={(e) => setEditingCoupon({
                    ...editingCoupon,
                    code: e.target.value.toUpperCase(),
                  })}
                  placeholder="DESCUENTO10"
                  className="w-full px-3 py-2 border rounded-md uppercase"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={editingCoupon.name || ''}
                  onChange={(e) => setEditingCoupon({
                    ...editingCoupon,
                    name: e.target.value,
                  })}
                  placeholder="Descuento de bienvenida"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              {/* Discount type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Descuento
                </label>
                <select
                  value={editingCoupon.discount_type || 'percentage'}
                  onChange={(e) => setEditingCoupon({
                    ...editingCoupon,
                    discount_type: e.target.value as 'percentage' | 'fixed',
                  })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Monto Fijo ($)</option>
                </select>
              </div>

              {/* Discount value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor del Descuento
                </label>
                <input
                  type="number"
                  value={editingCoupon.discount_value || ''}
                  onChange={(e) => setEditingCoupon({
                    ...editingCoupon,
                    discount_value: parseFloat(e.target.value) || 0,
                  })}
                  min="0"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              {/* Min purchase */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compra Mínima ($)
                </label>
                <input
                  type="number"
                  value={editingCoupon.min_purchase || ''}
                  onChange={(e) => setEditingCoupon({
                    ...editingCoupon,
                    min_purchase: parseFloat(e.target.value) || 0,
                  })}
                  min="0"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              {/* Max discount (for percentage) */}
              {editingCoupon.discount_type === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descuento Máximo ($)
                  </label>
                  <input
                    type="number"
                    value={editingCoupon.max_discount || ''}
                    onChange={(e) => setEditingCoupon({
                      ...editingCoupon,
                      max_discount: parseFloat(e.target.value) || undefined,
                    })}
                    min="0"
                    placeholder="Sin límite"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              )}

              {/* Usage limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Límite de Usos
                </label>
                <input
                  type="number"
                  value={editingCoupon.usage_limit || ''}
                  onChange={(e) => setEditingCoupon({
                    ...editingCoupon,
                    usage_limit: parseInt(e.target.value) || undefined,
                  })}
                  min="1"
                  placeholder="Ilimitado"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              {/* Usage per user */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usos por Usuario
                </label>
                <input
                  type="number"
                  value={editingCoupon.usage_per_user || 1}
                  onChange={(e) => setEditingCoupon({
                    ...editingCoupon,
                    usage_per_user: parseInt(e.target.value) || 1,
                  })}
                  min="1"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              {/* Start date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Inicio
                </label>
                <input
                  type="datetime-local"
                  value={editingCoupon.starts_at || ''}
                  onChange={(e) => setEditingCoupon({
                    ...editingCoupon,
                    starts_at: e.target.value,
                  })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              {/* End date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Expiración
                </label>
                <input
                  type="datetime-local"
                  value={editingCoupon.expires_at || ''}
                  onChange={(e) => setEditingCoupon({
                    ...editingCoupon,
                    expires_at: e.target.value || undefined,
                  })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              {/* Checkboxes */}
              <div className="col-span-2 space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingCoupon.is_active}
                    onChange={(e) => setEditingCoupon({
                      ...editingCoupon,
                      is_active: e.target.checked,
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">Activo</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingCoupon.first_purchase_only}
                    onChange={(e) => setEditingCoupon({
                      ...editingCoupon,
                      first_purchase_only: e.target.checked,
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">Solo primera compra</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingCoupon.new_users_only}
                    onChange={(e) => setEditingCoupon({
                      ...editingCoupon,
                      new_users_only: e.target.checked,
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">Solo usuarios nuevos (últimos 30 días)</span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveCoupon}
                disabled={saving || !editingCoupon.code || !editingCoupon.name}
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
