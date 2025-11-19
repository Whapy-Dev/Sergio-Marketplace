import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  can_buy: boolean;
  can_sell: boolean;
  kyc_status: string | null;
  // Wallet fields
  available_balance: number;
  pending_balance: number;
  total_withdrawn: number;
  cbu_cvu: string | null;
  mp_alias: string | null;
  cuil_cuit: string | null;
  account_holder_name: string | null;
  created_at: string;
  updated_at: string;
  // Aggregated data
  total_products?: number;
  total_orders?: number;
  total_sales_amount?: number;
}

interface Stats {
  total_users: number;
  total_sellers: number;
  total_buyers: number;
  total_available_balance: number;
  total_pending_balance: number;
  total_withdrawn: number;
}

export default function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'customer' | 'seller_individual'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<Stats>({
    total_users: 0,
    total_sellers: 0,
    total_buyers: 0,
    total_available_balance: 0,
    total_pending_balance: 0,
    total_withdrawn: 0,
  });
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [filter]);

  async function loadUsers() {
    setLoading(true);

    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (filter !== 'all') {
      query = query.eq('role', filter);
    }

    const { data, error } = await query;

    if (!error && data) {
      // Load aggregated data for each user
      const usersWithStats = await Promise.all(
        data.map(async (user) => {
          // Count products
          const { count: productsCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', user.id);

          // Count orders as buyer
          const { count: ordersCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('buyer_id', user.id);

          // Calculate total sales
          const { data: salesData } = await supabase
            .from('order_items')
            .select('seller_payout')
            .eq('seller_id', user.id);

          const totalSales = salesData?.reduce((sum, item) => sum + (item.seller_payout || 0), 0) || 0;

          return {
            ...user,
            total_products: productsCount || 0,
            total_orders: ordersCount || 0,
            total_sales_amount: totalSales,
          };
        })
      );

      setUsers(usersWithStats);
    }
    setLoading(false);
  }

  async function loadStats() {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('role, available_balance, pending_balance, total_withdrawn');

    if (profiles) {
      const stats = profiles.reduce(
        (acc, profile) => {
          acc.total_users++;
          if (profile.role === 'seller_individual') acc.total_sellers++;
          else acc.total_buyers++;
          acc.total_available_balance += profile.available_balance || 0;
          acc.total_pending_balance += profile.pending_balance || 0;
          acc.total_withdrawn += profile.total_withdrawn || 0;
          return acc;
        },
        {
          total_users: 0,
          total_sellers: 0,
          total_buyers: 0,
          total_available_balance: 0,
          total_pending_balance: 0,
          total_withdrawn: 0,
        }
      );
      setStats(stats);
    }
  }

  function viewUserDetails(user: UserProfile) {
    setSelectedUser(user);
    setShowModal(true);
  }

  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.phone?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
        <p className="mt-2 text-gray-600">Gestiona todos los usuarios del marketplace</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total_users}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm font-medium text-gray-600">Vendedores</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">{stats.total_sellers}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm font-medium text-gray-600">Compradores</p>
          <p className="text-2xl font-bold text-green-600 mt-2">{stats.total_buyers}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm font-medium text-gray-600">Saldo Disponible</p>
          <p className="text-xl font-bold text-gray-900 mt-2">
            ${stats.total_available_balance.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm font-medium text-gray-600">Saldo Pendiente</p>
          <p className="text-xl font-bold text-yellow-600 mt-2">
            ${stats.total_pending_balance.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm font-medium text-gray-600">Total Retirado</p>
          <p className="text-xl font-bold text-purple-600 mt-2">
            ${stats.total_withdrawn.toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Role Filters */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'seller_individual', 'customer'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setFilter(role)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    filter === role
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {role === 'all' ? 'Todos' : role === 'seller_individual' ? 'Vendedores' : 'Compradores'}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar usuario..."
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

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actividad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Finanzas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datos Bancarios
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No hay usuarios
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.full_name || 'Sin nombre'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.phone && (
                          <div className="text-xs text-gray-400">{user.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'seller_individual'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.role === 'seller_individual' ? 'Vendedor' : 'Comprador'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {user.role === 'seller_individual' ? (
                          <>
                            <div className="text-gray-900">
                              {user.total_products || 0} productos
                            </div>
                            <div className="text-gray-500 text-xs">
                              ${(user.total_sales_amount || 0).toLocaleString('es-AR')} vendidos
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-900">
                            {user.total_orders || 0} compras
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'seller_individual' ? (
                        <div className="text-sm">
                          <div className="text-green-600 font-semibold">
                            ${(user.available_balance || 0).toLocaleString('es-AR')}
                          </div>
                          <div className="text-yellow-600 text-xs">
                            Pendiente: ${(user.pending_balance || 0).toLocaleString('es-AR')}
                          </div>
                          <div className="text-gray-500 text-xs">
                            Retirado: ${(user.total_withdrawn || 0).toLocaleString('es-AR')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'seller_individual' ? (
                        <div className="flex gap-2">
                          {user.cbu_cvu && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              CBU
                            </span>
                          )}
                          {user.mp_alias && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              MP
                            </span>
                          )}
                          {!user.cbu_cvu && !user.mp_alias && (
                            <span className="text-gray-400 text-xs">Sin configurar</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => viewUserDetails(user)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {selectedUser.full_name || 'Usuario'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Personal Info */}
              <div className="col-span-2">
                <h4 className="font-semibold text-gray-900 mb-3">Información Personal</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Teléfono:</span>
                    <span className="font-medium">{selectedUser.phone || 'No configurado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dirección:</span>
                    <span className="font-medium">{selectedUser.address || 'No configurada'}</span>
                  </div>
                  {selectedUser.city && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ciudad:</span>
                      <span className="font-medium">{selectedUser.city}, {selectedUser.province}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Banking Info (if seller) */}
              {selectedUser.role === 'seller_individual' && (
                <div className="col-span-2">
                  <h4 className="font-semibold text-gray-900 mb-3">Datos Bancarios</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Titular:</span>
                      <span className="font-medium">{selectedUser.account_holder_name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CUIL/CUIT:</span>
                      <span className="font-medium font-mono">{selectedUser.cuil_cuit || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CBU/CVU:</span>
                      <span className="font-medium font-mono text-xs">{selectedUser.cbu_cvu || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Alias MP:</span>
                      <span className="font-medium">{selectedUser.mp_alias || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Info (if seller) */}
              {selectedUser.role === 'seller_individual' && (
                <div className="col-span-2">
                  <h4 className="font-semibold text-gray-900 mb-3">Información Financiera</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-600 font-medium">Disponible</p>
                      <p className="text-2xl font-bold text-green-700">
                        ${(selectedUser.available_balance || 0).toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <p className="text-sm text-yellow-600 font-medium">Pendiente</p>
                      <p className="text-2xl font-bold text-yellow-700">
                        ${(selectedUser.pending_balance || 0).toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-purple-600 font-medium">Total Retirado</p>
                      <p className="text-2xl font-bold text-purple-700">
                        ${(selectedUser.total_withdrawn || 0).toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 font-medium">Total Ganado</p>
                      <p className="text-2xl font-bold text-blue-700">
                        ${((selectedUser.available_balance || 0) + (selectedUser.pending_balance || 0) + (selectedUser.total_withdrawn || 0)).toLocaleString('es-AR')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Stats */}
              <div className="col-span-2">
                <h4 className="font-semibold text-gray-900 mb-3">Actividad</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {selectedUser.role === 'seller_individual' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Productos publicados:</span>
                        <span className="font-medium">{selectedUser.total_products || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total vendido:</span>
                        <span className="font-medium">${(selectedUser.total_sales_amount || 0).toLocaleString('es-AR')}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total compras:</span>
                      <span className="font-medium">{selectedUser.total_orders || 0}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registrado:</span>
                    <span className="font-medium">
                      {new Date(selectedUser.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
