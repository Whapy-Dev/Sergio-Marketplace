import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { StoreApplication } from '../types';

export default function StoreApplications() {
  const [applications, setApplications] = useState<StoreApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<StoreApplication | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    setLoading(true);
    const { data, error } = await supabase
      .from('store_applications')
      .select(`
        *,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .in('status', ['pending', 'under_review'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      setApplications(data);
    }
    setLoading(false);
  }

  async function approveApplication(application: StoreApplication) {
    if (!confirm(`¿Aprobar la tienda "${application.application_data.store_name}"?`)) {
      return;
    }

    setProcessing(true);

    try {
      const slug = application.application_data.store_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // 1. Create official store
      const { data: newStore, error: storeError } = await supabase
        .from('official_stores')
        .insert({
          user_id: application.user_id,
          store_name: application.application_data.store_name,
          slug: slug,
          description: application.application_data.description,
          email: application.application_data.email,
          phone: application.application_data.phone,
          website: application.application_data.website || null,
          address: application.application_data.address,
          city: application.application_data.city,
          state: application.application_data.state,
          postal_code: application.application_data.postal_code,
          country: 'Argentina',
          business_type: application.application_data.business_type,
          tax_id: application.application_data.tax_id,
          legal_name: application.application_data.legal_name,
          verification_status: 'approved',
          verified_at: new Date().toISOString(),
          is_active: true,
          rating: 0,
          total_sales: 0,
          total_products: 0,
          followers_count: 0,
        })
        .select()
        .single();

      if (storeError) throw storeError;

      // 2. Create default policies
      await supabase.from('store_policies').insert({
        store_id: newStore.id,
        warranty_days: 30,
        return_policy: 'Consultar con el vendedor',
        accepts_returns: true,
        return_window_days: 30,
        shipping_policy: 'Envío a coordinar con el vendedor',
        payment_methods: ['cash', 'transfer'],
        accepts_installments: false,
        support_email: application.application_data.email,
        support_phone: application.application_data.phone,
        support_hours: 'Lun-Vie 9-18hs',
      });

      // 3. Create initial metrics
      await supabase.from('store_metrics').insert({
        store_id: newStore.id,
        metric_type: 'all_time',
        total_revenue: 0,
        monthly_revenue: 0,
        avg_order_value: 0,
        avg_rating: 0,
        total_reviews: 0,
        customer_satisfaction_rate: 0,
        response_time_hours: 0,
        response_rate: 100,
        products_count: 0,
        active_products_count: 0,
        out_of_stock_count: 0,
        total_customers: 0,
        repeat_customers: 0,
        repeat_customer_rate: 0,
        return_rate: 0,
        refund_rate: 0,
      });

      // 4. Update application status
      await supabase
        .from('store_applications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          review_notes: 'Aplicación aprobada desde el CRM',
        })
        .eq('id', application.id);

      alert('¡Tienda aprobada exitosamente!');
      setSelectedApp(null);
      loadApplications();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al aprobar la aplicación');
    } finally {
      setProcessing(false);
    }
  }

  async function rejectApplication(application: StoreApplication) {
    const reason = prompt('Motivo del rechazo (opcional):');
    if (reason === null) return;

    setProcessing(true);

    const { error } = await supabase
      .from('store_applications')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        review_notes: reason || 'Aplicación rechazada',
      })
      .eq('id', application.id);

    if (!error) {
      alert('Aplicación rechazada');
      setSelectedApp(null);
      loadApplications();
    }

    setProcessing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando aplicaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Aplicaciones de Tiendas Oficiales</h1>
        <p className="mt-2 text-gray-600">
          {applications.length} solicitud{applications.length !== 1 ? 'es' : ''} pendiente
          {applications.length !== 1 ? 's' : ''}
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No hay aplicaciones pendientes
          </h3>
          <p className="text-gray-600">Todas las solicitudes han sido procesadas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold text-gray-900">
                      {app.application_data.store_name}
                    </h3>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                      {app.status === 'pending' ? 'Pendiente' : 'En revisión'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">Email:</span> {app.profiles?.email || 'N/A'}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Usuario:</span>{' '}
                        {app.profiles?.full_name || 'N/A'}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Teléfono:</span> {app.application_data.phone}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Tipo:</span> {app.application_data.business_type}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">Ciudad:</span> {app.application_data.city},{' '}
                        {app.application_data.state}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">CUIT:</span> {app.application_data.tax_id}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Razón Social:</span>{' '}
                        {app.application_data.legal_name}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Aplicó:</span>{' '}
                        {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Descripción:</span>
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      {app.application_data.description}
                    </p>
                  </div>
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  <button
                    onClick={() => approveApplication(app)}
                    disabled={processing}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => rejectApplication(app)}
                    disabled={processing}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm font-semibold rounded-lg transition"
                  >
                    {selectedApp?.id === app.id ? 'Ocultar' : 'Ver más'}
                  </button>
                </div>
              </div>

              {selectedApp?.id === app.id && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Datos completos</h4>
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(app.application_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
