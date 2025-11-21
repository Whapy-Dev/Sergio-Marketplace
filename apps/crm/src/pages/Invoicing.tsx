import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ARCAConfig {
  cuit: string;
  certificate: string;
  certificatePassword: string;
  pointOfSale: number;
  ivaCondition: number;
  businessName: string;
  address: string;
  isHomologation: boolean;
}

interface Invoice {
  id: string;
  order_id: string;
  cae: string;
  cae_expiration: string;
  invoice_number: number;
  point_of_sale: number;
  invoice_type: number;
  buyer_doc_number: string;
  buyer_name: string;
  net_amount: number;
  iva_amount: number;
  total_amount: number;
  status: string;
  created_at: string;
}

const invoiceTypeNames: Record<number, string> = {
  1: 'Factura A',
  2: 'Nota de Débito A',
  3: 'Nota de Crédito A',
  6: 'Factura B',
  7: 'Nota de Débito B',
  8: 'Nota de Crédito B',
  11: 'Factura C',
  12: 'Nota de Débito C',
  13: 'Nota de Crédito C',
};

const ivaConditions: Record<number, string> = {
  1: 'Responsable Inscripto',
  4: 'Exento',
  5: 'Consumidor Final',
  6: 'Monotributo',
};

export default function Invoicing() {
  const [config, setConfig] = useState<ARCAConfig>({
    cuit: '',
    certificate: '',
    certificatePassword: '',
    pointOfSale: 1,
    ivaCondition: 1,
    businessName: '',
    address: '',
    isHomologation: true,
  });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'invoices'>('config');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load config
      const { data: configData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'arca_config')
        .single();

      if (configData?.value) {
        setConfig(configData.value as ARCAConfig);
      }

      // Load invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (invoicesData) {
        setInvoices(invoicesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'arca_config',
          value: config,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: 'Error al guardar la configuración' });
    }

    setSaving(false);
  };

  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      setConfig({ ...config, certificate: base64 });
    };
    reader.readAsDataURL(file);
  };

  const formatInvoiceNumber = (pointOfSale: number, invoiceNumber: number) => {
    return `${pointOfSale.toString().padStart(4, '0')}-${invoiceNumber.toString().padStart(8, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCAEExpiration = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 8) return '-';
    return `${dateStr.slice(6, 8)}/${dateStr.slice(4, 6)}/${dateStr.slice(0, 4)}`;
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
        <h1 className="text-2xl font-bold text-gray-900">Facturación Electrónica (ARCA)</h1>
        <span className={`px-3 py-1 rounded-full text-sm ${config.isHomologation ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
          {config.isHomologation ? 'Homologación' : 'Producción'}
        </span>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Configuración
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invoices'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Comprobantes Emitidos ({invoices.length})
          </button>
        </nav>
      </div>

      {activeTab === 'config' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Configuración ARCA</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CUIT */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CUIT del Marketplace
              </label>
              <input
                type="text"
                value={config.cuit}
                onChange={(e) => setConfig({ ...config, cuit: e.target.value })}
                placeholder="20-12345678-9"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Razón Social
              </label>
              <input
                type="text"
                value={config.businessName}
                onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
                placeholder="Marketplace Formosa S.A."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domicilio Fiscal
              </label>
              <input
                type="text"
                value={config.address}
                onChange={(e) => setConfig({ ...config, address: e.target.value })}
                placeholder="Av. Principal 123, Formosa"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* IVA Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condición de IVA
              </label>
              <select
                value={config.ivaCondition}
                onChange={(e) => setConfig({ ...config, ivaCondition: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(ivaConditions).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Point of Sale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Punto de Venta
              </label>
              <input
                type="number"
                value={config.pointOfSale}
                onChange={(e) => setConfig({ ...config, pointOfSale: parseInt(e.target.value) || 1 })}
                min="1"
                max="9999"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Debe estar habilitado en ARCA para facturación electrónica
              </p>
            </div>

            {/* Certificate */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certificado Digital (.p12 o .pfx)
              </label>
              <input
                type="file"
                accept=".p12,.pfx"
                onChange={handleCertificateUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              {config.certificate && (
                <p className="mt-1 text-sm text-green-600">Certificado cargado</p>
              )}
            </div>

            {/* Certificate Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña del Certificado
              </label>
              <input
                type="password"
                value={config.certificatePassword}
                onChange={(e) => setConfig({ ...config, certificatePassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Environment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ambiente
              </label>
              <div className="flex items-center space-x-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={config.isHomologation}
                    onChange={() => setConfig({ ...config, isHomologation: true })}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Homologación (Testing)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!config.isHomologation}
                    onChange={() => setConfig({ ...config, isHomologation: false })}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Producción</span>
                </label>
              </div>
            </div>
          </div>

          {/* Help text */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Requisitos para facturar:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>1. Obtener certificado digital desde ARCA (afip.gob.ar)</li>
              <li>2. Habilitar punto de venta para facturación electrónica (Webservices)</li>
              <li>3. Asociar certificado al servicio "wsfe" en ARCA</li>
              <li>4. Usar homologación primero para pruebas</li>
            </ul>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveConfig}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay comprobantes emitidos aún
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Comprobante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    CAE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vto. CAE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatInvoiceNumber(invoice.point_of_sale, invoice.invoice_number)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoiceTypeNames[invoice.invoice_type] || invoice.invoice_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{invoice.buyer_name || '-'}</div>
                      <div className="text-xs text-gray-400">{invoice.buyer_doc_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${invoice.total_amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {invoice.cae}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCAEExpiration(invoice.cae_expiration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
