import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Setting {
  key: string;
  value: any;
  description: string | null;
  updated_at: string;
}

interface User {
  id: string;
  email: string;
  profiles?: {
    full_name?: string;
  };
}

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, Setting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Form state
  const [minimumWithdrawal, setMinimumWithdrawal] = useState('5000');
  const [marketplaceOwnerId, setMarketplaceOwnerId] = useState('');
  const [defaultCommission, setDefaultCommission] = useState('10.00');

  useEffect(() => {
    getCurrentUser();
    loadSettings();
    loadUsers();
  }, []);

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  }

  async function loadSettings() {
    setLoading(true);

    const { data, error } = await supabase
      .from('settings')
      .select('*');

    if (!error && data) {
      const settingsObj: Record<string, Setting> = {};
      data.forEach((setting) => {
        settingsObj[setting.key] = setting;
      });

      setSettings(settingsObj);

      // Set form values
      if (settingsObj.minimum_withdrawal_amount) {
        setMinimumWithdrawal(settingsObj.minimum_withdrawal_amount.value as string);
      }
      if (settingsObj.marketplace_owner_id) {
        const ownerId = settingsObj.marketplace_owner_id.value as string;
        setMarketplaceOwnerId(ownerId !== 'null' ? ownerId : '');
      }
      if (settingsObj.default_commission_rate) {
        setDefaultCommission(settingsObj.default_commission_rate.value as string);
      }
    }

    setLoading(false);
  }

  async function loadUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('can_sell', true)
      .order('full_name');

    if (!error && data) {
      setUsers(data.map(p => ({
        id: p.id,
        email: p.email,
        profiles: { full_name: p.full_name }
      })));
    }
  }

  async function updateSetting(key: string, value: any) {
    if (!currentUser) return false;

    const { error } = await supabase
      .from('settings')
      .update({
        value,
        updated_by: currentUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('key', key);

    return !error;
  }

  async function handleSave() {
    setSaving(true);

    try {
      const updates = [
        updateSetting('minimum_withdrawal_amount', minimumWithdrawal),
        updateSetting('marketplace_owner_id', marketplaceOwnerId || 'null'),
        updateSetting('default_commission_rate', defaultCommission),
      ];

      const results = await Promise.all(updates);

      if (results.every(r => r)) {
        alert('Configuración guardada exitosamente');
        loadSettings();
      } else {
        alert('Hubo un error al guardar algunas configuraciones');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuración del Marketplace</h1>
        <p className="mt-2 text-gray-600">
          Gestiona la configuración global de tu marketplace
        </p>
      </div>

      {/* Settings Cards */}
      <div className="space-y-6">
        {/* Financial Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Configuración Financiera</h2>
            <p className="text-sm text-gray-600 mt-1">
              Configura comisiones y retiros
            </p>
          </div>
          <div className="p-6 space-y-6">
            {/* Default Commission Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comisión por Defecto (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={defaultCommission}
                onChange={(e) => setDefaultCommission(e.target.value)}
                className="max-w-xs border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-sm text-gray-500 mt-2">
                Comisión que se aplicará a las categorías que no tengan una comisión específica configurada
              </p>
            </div>

            {/* Minimum Withdrawal Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto Mínimo de Retiro (ARS)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={minimumWithdrawal}
                onChange={(e) => setMinimumWithdrawal(e.target.value)}
                className="max-w-xs border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-sm text-gray-500 mt-2">
                Monto mínimo en pesos argentinos que los vendedores deben acumular para poder solicitar un retiro
              </p>
            </div>
          </div>
        </div>

        {/* Marketplace Owner */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Dueño del Marketplace</h2>
            <p className="text-sm text-gray-600 mt-1">
              Define quién es el propietario del marketplace
            </p>
          </div>
          <div className="p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario Propietario
              </label>
              <select
                value={marketplaceOwnerId}
                onChange={(e) => setMarketplaceOwnerId(e.target.value)}
                className="max-w-md border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Sin propietario definido</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.profiles?.full_name || user.email} - {user.email}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-2">
                Los productos del dueño del marketplace NO pagan comisión (comisión = 0%)
              </p>

              {marketplaceOwnerId && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-900">Importante</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Todos los productos de este usuario tendrán comisión 0%. Esto es útil si el dueño del marketplace también vende productos propios.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Métodos de Pago</h2>
            <p className="text-sm text-gray-600 mt-1">
              Configuración de MercadoPago
            </p>
          </div>
          <div className="p-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">MercadoPago Configurado</p>
                  <p className="text-sm text-green-700 mt-1">
                    Tu cuenta de MercadoPago está correctamente configurada. Todos los pagos se procesan centralizadamente.
                  </p>
                  <div className="mt-2 text-xs text-green-600 font-mono">
                    Modo: TEST
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-900">Antes de Producción</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Recuerda cambiar a las credenciales de PRODUCCIÓN de MercadoPago en el archivo src/config/mercadopago.ts antes de lanzar el marketplace.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Información del Sistema</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Base de Datos</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">Supabase PostgreSQL</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Última Actualización</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {settings.minimum_withdrawal_amount?.updated_at
                    ? new Date(settings.minimum_withdrawal_amount.updated_at).toLocaleDateString('es-AR')
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Versión del CRM</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">1.0.0</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Modelo de Negocio</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">Marketplace Centralizado</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-3 rounded-lg font-semibold text-white ${
            saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'
          }`}
        >
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  );
}
