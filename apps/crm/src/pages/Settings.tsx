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

  // MercadoPago
  const [mpPublicKey, setMpPublicKey] = useState('');
  const [mpAccessToken, setMpAccessToken] = useState('');
  const [mpTestMode, setMpTestMode] = useState(true);

  // ARCA
  const [arcaCuit, setArcaCuit] = useState('');
  const [arcaCertificate, setArcaCertificate] = useState('');
  const [arcaPrivateKey, setArcaPrivateKey] = useState('');
  const [arcaTestMode, setArcaTestMode] = useState(true);

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
      // MercadoPago
      if (settingsObj.mp_public_key) {
        setMpPublicKey(settingsObj.mp_public_key.value as string);
      }
      if (settingsObj.mp_access_token) {
        setMpAccessToken(settingsObj.mp_access_token.value as string);
      }
      if (settingsObj.mp_test_mode) {
        setMpTestMode(settingsObj.mp_test_mode.value === 'true' || settingsObj.mp_test_mode.value === true);
      }
      // ARCA
      if (settingsObj.arca_cuit) {
        setArcaCuit(settingsObj.arca_cuit.value as string);
      }
      if (settingsObj.arca_certificate) {
        setArcaCertificate(settingsObj.arca_certificate.value as string);
      }
      if (settingsObj.arca_private_key) {
        setArcaPrivateKey(settingsObj.arca_private_key.value as string);
      }
      if (settingsObj.arca_test_mode) {
        setArcaTestMode(settingsObj.arca_test_mode.value === 'true' || settingsObj.arca_test_mode.value === true);
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
        // MercadoPago
        updateSetting('mp_public_key', mpPublicKey),
        updateSetting('mp_access_token', mpAccessToken),
        updateSetting('mp_test_mode', mpTestMode.toString()),
        // ARCA
        updateSetting('arca_cuit', arcaCuit),
        updateSetting('arca_certificate', arcaCertificate),
        updateSetting('arca_private_key', arcaPrivateKey),
        updateSetting('arca_test_mode', arcaTestMode.toString()),
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

        {/* MercadoPago Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">MercadoPago</h2>
            <p className="text-sm text-gray-600 mt-1">
              Credenciales para procesamiento de pagos
            </p>
          </div>
          <div className="p-6 space-y-6">
            {/* Test Mode Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Modo de Prueba</label>
                <p className="text-sm text-gray-500">Usar credenciales de test</p>
              </div>
              <button
                type="button"
                onClick={() => setMpTestMode(!mpTestMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  mpTestMode ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    mpTestMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Public Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Public Key
              </label>
              <input
                type="text"
                value={mpPublicKey}
                onChange={(e) => setMpPublicKey(e.target.value)}
                placeholder={mpTestMode ? 'TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' : 'APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              />
              <p className="text-sm text-gray-500 mt-1">
                Se usa en el frontend para inicializar MercadoPago
              </p>
            </div>

            {/* Access Token */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Token
              </label>
              <input
                type="password"
                value={mpAccessToken}
                onChange={(e) => setMpAccessToken(e.target.value)}
                placeholder={mpTestMode ? 'TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' : 'APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              />
              <p className="text-sm text-gray-500 mt-1">
                Solo se usa en el backend. Nunca se expone al cliente.
              </p>
            </div>

            {mpTestMode && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Modo TEST activo.</strong> Los pagos no serán reales. Cambia a producción cuando estés listo para lanzar.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ARCA Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">ARCA (Facturación Electrónica)</h2>
            <p className="text-sm text-gray-600 mt-1">
              Credenciales para emisión de facturas electrónicas
            </p>
          </div>
          <div className="p-6 space-y-6">
            {/* Test Mode Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Modo Homologación</label>
                <p className="text-sm text-gray-500">Usar ambiente de pruebas de ARCA</p>
              </div>
              <button
                type="button"
                onClick={() => setArcaTestMode(!arcaTestMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  arcaTestMode ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    arcaTestMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* CUIT */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CUIT del Emisor
              </label>
              <input
                type="text"
                value={arcaCuit}
                onChange={(e) => setArcaCuit(e.target.value)}
                placeholder="20-12345678-9"
                className="max-w-xs border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                CUIT de la empresa que emite las facturas
              </p>
            </div>

            {/* Certificate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificado (.crt)
              </label>
              <textarea
                value={arcaCertificate}
                onChange={(e) => setArcaCertificate(e.target.value)}
                placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 font-mono text-xs"
              />
              <p className="text-sm text-gray-500 mt-1">
                Certificado digital obtenido de ARCA
              </p>
            </div>

            {/* Private Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clave Privada (.key)
              </label>
              <textarea
                value={arcaPrivateKey}
                onChange={(e) => setArcaPrivateKey(e.target.value)}
                placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 font-mono text-xs"
              />
              <p className="text-sm text-gray-500 mt-1">
                Clave privada correspondiente al certificado
              </p>
            </div>

            {arcaTestMode && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Modo homologación activo.</strong> Las facturas se emitirán en el ambiente de pruebas de ARCA.
                </p>
              </div>
            )}
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
