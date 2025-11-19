import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface WithdrawalRequest {
  id: string;
  seller_id: string;
  amount: number;
  payment_method: 'cbu_cvu' | 'mp_alias';
  payment_details: {
    cbu_cvu?: string;
    mp_alias?: string;
    account_holder_name?: string;
  };
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'cancelled';
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  admin_notes?: string;
  rejection_reason?: string;
  transaction_reference?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name?: string;
    email: string;
    phone?: string;
    cuil_cuit?: string;
  };
}

interface Stats {
  pending: number;
  approved: number;
  processing: number;
  completed: number;
  rejected: number;
  totalPending: number;
  totalCompleted: number;
}

export default function Withdrawals() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'processing' | 'completed' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    approved: 0,
    processing: 0,
    completed: 0,
    rejected: 0,
    totalPending: 0,
    totalCompleted: 0,
  });
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser();
    loadRequests();
    loadStats();
  }, [filter]);

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  }

  async function loadRequests() {
    setLoading(true);

    let query = supabase
      .from('withdrawal_requests')
      .select(`
        *,
        profiles:seller_id (
          full_name,
          email,
          phone,
          cuil_cuit
        )
      `)
      .order('requested_at', { ascending: false })
      .limit(100);

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  }

  async function loadStats() {
    const { data } = await supabase
      .from('withdrawal_requests')
      .select('status, amount');

    if (data) {
      const stats = data.reduce(
        (acc, req) => {
          acc[req.status] = (acc[req.status] || 0) + 1;
          if (req.status === 'pending' || req.status === 'approved' || req.status === 'processing') {
            acc.totalPending += req.amount;
          }
          if (req.status === 'completed') {
            acc.totalCompleted += req.amount;
          }
          return acc;
        },
        {
          pending: 0,
          approved: 0,
          processing: 0,
          completed: 0,
          rejected: 0,
          totalPending: 0,
          totalCompleted: 0,
        }
      );
      setStats(stats);
    }
  }

  async function handleUpdateStatus(
    requestId: string,
    newStatus: WithdrawalRequest['status']
  ) {
    if (!currentUser) return;

    const updateData: any = {
      status: newStatus,
      processed_by: currentUser.id,
      admin_notes: adminNotes || null,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'rejected' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    if (newStatus === 'completed') {
      updateData.processed_at = new Date().toISOString();
      if (transactionRef) {
        updateData.transaction_reference = transactionRef;
      }
    }

    const { error } = await supabase
      .from('withdrawal_requests')
      .update(updateData)
      .eq('id', requestId);

    if (!error) {
      setShowModal(false);
      setSelectedRequest(null);
      setAdminNotes('');
      setRejectionReason('');
      setTransactionRef('');
      loadRequests();
      loadStats();
      alert(`Solicitud actualizada a: ${getStatusLabel(newStatus)}`);
    } else {
      alert('Error al actualizar la solicitud');
    }
  }

  function openModal(request: WithdrawalRequest, action: 'approve' | 'reject' | 'complete') {
    setSelectedRequest(request);
    setAdminNotes('');
    setRejectionReason('');
    setTransactionRef('');
    setShowModal(true);
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      processing: 'Procesando',
      completed: 'Completado',
      rejected: 'Rechazado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  const filteredRequests = requests.filter((req) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      req.profiles?.full_name?.toLowerCase().includes(search) ||
      req.profiles?.email?.toLowerCase().includes(search) ||
      req.payment_details?.account_holder_name?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Solicitudes de Retiro</h1>
        <p className="mt-2 text-gray-600">
          Gestiona los retiros de los vendedores
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.pending}</p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            ${stats.totalPending.toLocaleString('es-AR')} ARS
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Proceso</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.approved + stats.processing}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completados</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.completed}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            ${stats.totalCompleted.toLocaleString('es-AR')} ARS
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rechazados</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.rejected}</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Status Filters */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'pending', 'approved', 'processing', 'completed', 'rejected'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    filter === status
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'Todos' : getStatusLabel(status)}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por vendedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Solicitado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No hay solicitudes de retiro
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {request.profiles?.full_name || 'Sin nombre'}
                        </div>
                        <div className="text-sm text-gray-500">{request.profiles?.email}</div>
                        {request.profiles?.cuil_cuit && (
                          <div className="text-xs text-gray-400">CUIL/CUIT: {request.profiles.cuil_cuit}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-gray-900">
                        ${request.amount.toLocaleString('es-AR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.payment_method === 'cbu_cvu' ? 'Transferencia' : 'Mercado Pago'}
                        </div>
                        {request.payment_method === 'cbu_cvu' && request.payment_details?.cbu_cvu && (
                          <div className="text-xs text-gray-500 font-mono">
                            {request.payment_details.cbu_cvu}
                          </div>
                        )}
                        {request.payment_method === 'mp_alias' && request.payment_details?.mp_alias && (
                          <div className="text-xs text-gray-500">
                            {request.payment_details.mp_alias}
                          </div>
                        )}
                        {request.payment_details?.account_holder_name && (
                          <div className="text-xs text-gray-400">
                            {request.payment_details.account_holder_name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(request.requested_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openModal(request, 'approve')}
                              className="text-green-600 hover:text-green-900"
                              title="Aprobar"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => openModal(request, 'reject')}
                              className="text-red-600 hover:text-red-900"
                              title="Rechazar"
                            >
                              ✗
                            </button>
                          </>
                        )}
                        {(request.status === 'approved' || request.status === 'processing') && (
                          <button
                            onClick={() => openModal(request, 'complete')}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Marcar Completado
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Procesar Retiro - {selectedRequest.profiles?.full_name}
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600">Monto:</p>
              <p className="text-2xl font-bold text-gray-900">
                ${selectedRequest.amount.toLocaleString('es-AR')}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas del Admin
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={3}
                placeholder="Notas opcionales..."
              />
            </div>

            {selectedRequest.status === 'pending' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de Rechazo (si rechazas)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Requerido si rechazas la solicitud..."
                />
              </div>
            )}

            {(selectedRequest.status === 'approved' || selectedRequest.status === 'processing') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referencia de Transacción
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="ID de transacción bancaria o MP..."
                />
              </div>
            )}

            <div className="flex gap-3">
              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => {
                      if (!rejectionReason.trim()) {
                        alert('Debes ingresar un motivo de rechazo');
                        return;
                      }
                      handleUpdateStatus(selectedRequest.id, 'rejected');
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Rechazar
                  </button>
                </>
              )}

              {(selectedRequest.status === 'approved' || selectedRequest.status === 'processing') && (
                <button
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'completed')}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Marcar Completado
                </button>
              )}

              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
