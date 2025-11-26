import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { COLORS } from '../../constants/theme';
import { scale, moderateScale, verticalScale } from '../../utils/responsive';

interface Invoice {
  id: string;
  invoice_number: number;
  invoice_type: 'A' | 'B' | 'C';
  cae: string;
  cae_expiration: string;
  total: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  created_at: string;
  order_number?: string;
}

const INVOICE_TYPE_LABELS = {
  A: { label: 'Factura A', color: '#2563EB', bg: '#DBEAFE' },
  B: { label: 'Factura B', color: '#7C3AED', bg: '#EDE9FE' },
  C: { label: 'Factura C', color: '#059669', bg: '#D1FAE5' },
};

const STATUS_LABELS = {
  pending: { label: 'Pendiente', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  approved: { label: 'Aprobada', color: 'text-green-600', bg: 'bg-green-100' },
  rejected: { label: 'Rechazada', color: 'text-red-600', bg: 'bg-red-100' },
  cancelled: { label: 'Anulada', color: 'text-gray-600', bg: 'bg-gray-100' },
};

export default function MyInvoicesScreen({ navigation }: any) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    if (!user) return;

    try {
      setLoading(true);

      // Get invoices for orders where user is the buyer
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          invoice_type,
          cae,
          cae_expiration,
          total,
          status,
          created_at,
          orders!inner (
            order_number,
            buyer_id
          )
        `)
        .eq('orders.buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading invoices:', error);
        setInvoices([]);
        return;
      }

      const formattedInvoices = (data || []).map((invoice: any) => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        invoice_type: invoice.invoice_type,
        cae: invoice.cae,
        cae_expiration: invoice.cae_expiration,
        total: invoice.total,
        status: invoice.status,
        created_at: invoice.created_at,
        order_number: invoice.orders?.order_number,
      }));

      setInvoices(formattedInvoices);
    } catch (error) {
      console.error('Error:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  function formatInvoiceNumber(type: string, number: number) {
    const punto = '00001';
    const num = String(number).padStart(8, '0');
    return `${punto}-${num}`;
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mr-3"
        >
          <Ionicons name="arrow-back" size={scale(24)} color={COLORS.primary} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Mis Facturas</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : invoices.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="document-text-outline" size={scale(64)} color="#9CA3AF" />
          <Text className="text-xl font-bold text-gray-900 mb-2 mt-4">No hay facturas</Text>
          <Text className="text-base text-gray-600 text-center">
            Las facturas de tus compras apareceran aqui
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1">
          {invoices.map((invoice) => {
            const typeInfo = INVOICE_TYPE_LABELS[invoice.invoice_type];
            const statusInfo = STATUS_LABELS[invoice.status as keyof typeof STATUS_LABELS];

            return (
              <TouchableOpacity
                key={invoice.id}
                onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: invoice.id })}
                className="mx-4 my-2 p-4 bg-white border border-gray-200 rounded-lg"
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <View
                        style={{ backgroundColor: typeInfo.bg }}
                        className="px-2 py-1 rounded mr-2"
                      >
                        <Text style={{ color: typeInfo.color }} className="text-xs font-bold">
                          {typeInfo.label}
                        </Text>
                      </View>
                      <View className={`px-2 py-1 rounded ${statusInfo.bg}`}>
                        <Text className={`text-xs font-semibold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-gray-900 mt-1">
                      N° {formatInvoiceNumber(invoice.invoice_type, invoice.invoice_number)}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center mb-2">
                  <Ionicons name="calendar-outline" size={scale(14)} color="#6B7280" />
                  <Text className="text-sm text-gray-600 ml-1">
                    {formatDate(invoice.created_at)}
                  </Text>
                </View>

                {invoice.order_number && (
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="cart-outline" size={scale(14)} color="#6B7280" />
                    <Text className="text-sm text-gray-600 ml-1">
                      Pedido #{invoice.order_number}
                    </Text>
                  </View>
                )}

                {invoice.cae && (
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="checkmark-circle-outline" size={scale(14)} color="#059669" />
                    <Text className="text-sm text-gray-600 ml-1">
                      CAE: {invoice.cae}
                    </Text>
                  </View>
                )}

                <View className="border-t border-gray-100 pt-3 mt-2">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm text-gray-600">Total</Text>
                    <Text className="text-lg font-bold text-primary">
                      ${invoice.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          <View className="h-6" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
