import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { COLORS } from '../../constants/theme';

interface InvoiceDetail {
  id: string;
  order_id: string;
  invoice_number: number;
  invoice_type: 'A' | 'B' | 'C';
  point_of_sale: number;
  cae: string;
  cae_expiration: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  customer_doc_type: number;
  customer_doc_number: string;
  customer_name: string;
  customer_address: string;
  created_at: string;
  pdf_url?: string;
  order?: {
    order_number: string;
  };
}

const INVOICE_TYPE_LABELS = {
  A: { label: 'Factura A', color: '#2563EB', bg: '#DBEAFE' },
  B: { label: 'Factura B', color: '#7C3AED', bg: '#EDE9FE' },
  C: { label: 'Factura C', color: '#059669', bg: '#D1FAE5' },
};

const STATUS_LABELS = {
  pending: { label: 'Pendiente', color: '#D97706', bg: '#FEF3C7' },
  approved: { label: 'Aprobada', color: '#059669', bg: '#D1FAE5' },
  rejected: { label: 'Rechazada', color: '#DC2626', bg: '#FEE2E2' },
  cancelled: { label: 'Anulada', color: '#6B7280', bg: '#F3F4F6' },
};

const DOC_TYPES: { [key: number]: string } = {
  80: 'CUIT',
  86: 'CUIL',
  96: 'DNI',
  99: 'Consumidor Final',
};

export default function InvoiceDetailScreen({ navigation, route }: any) {
  const { invoiceId } = route.params;
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  async function loadInvoice() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders (
            order_number
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (error) {
        console.error('Error loading invoice:', error);
        Alert.alert('Error', 'No se pudo cargar la factura');
        navigation.goBack();
        return;
      }

      setInvoice({
        ...data,
        order: data.orders,
      });
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Ocurrio un error al cargar la factura');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  function formatInvoiceNumber(pointOfSale: number, number: number) {
    const punto = String(pointOfSale).padStart(5, '0');
    const num = String(number).padStart(8, '0');
    return `${punto}-${num}`;
  }

  async function handleShare() {
    if (!invoice) return;

    try {
      const message = `Factura ${INVOICE_TYPE_LABELS[invoice.invoice_type].label}\n` +
        `N° ${formatInvoiceNumber(invoice.point_of_sale, invoice.invoice_number)}\n` +
        `CAE: ${invoice.cae}\n` +
        `Vto CAE: ${formatDate(invoice.cae_expiration)}\n` +
        `Total: $${invoice.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

      await Share.share({
        message,
        title: 'Factura',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!invoice) {
    return null;
  }

  const typeInfo = INVOICE_TYPE_LABELS[invoice.invoice_type];
  const statusInfo = STATUS_LABELS[invoice.status];

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-3"
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Detalle de Factura</Text>
        </View>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {/* Invoice Header Card */}
        <View className="mx-4 mt-4 p-4 bg-white rounded-lg border border-gray-200">
          <View className="flex-row items-center justify-between mb-4">
            <View
              style={{ backgroundColor: typeInfo.bg }}
              className="px-3 py-1.5 rounded"
            >
              <Text style={{ color: typeInfo.color }} className="text-sm font-bold">
                {typeInfo.label}
              </Text>
            </View>
            <View
              style={{ backgroundColor: statusInfo.bg }}
              className="px-3 py-1.5 rounded"
            >
              <Text style={{ color: statusInfo.color }} className="text-sm font-bold">
                {statusInfo.label}
              </Text>
            </View>
          </View>

          <Text className="text-2xl font-bold text-gray-900 mb-1">
            N° {formatInvoiceNumber(invoice.point_of_sale, invoice.invoice_number)}
          </Text>
          <Text className="text-sm text-gray-500">
            Fecha: {formatDate(invoice.created_at)}
          </Text>
          {invoice.order?.order_number && (
            <Text className="text-sm text-gray-500 mt-1">
              Pedido: #{invoice.order.order_number}
            </Text>
          )}
        </View>

        {/* CAE Info */}
        {invoice.cae && (
          <View className="mx-4 mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <Text className="text-sm font-semibold text-gray-700 mb-3">
              Informacion Fiscal
            </Text>

            <View className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
              <Text className="text-sm text-gray-900 ml-2 font-medium">
                CAE: {invoice.cae}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons name="calendar" size={20} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-2">
                Vencimiento CAE: {formatDate(invoice.cae_expiration)}
              </Text>
            </View>
          </View>
        )}

        {/* Customer Info */}
        <View className="mx-4 mt-4 p-4 bg-white rounded-lg border border-gray-200">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Datos del Cliente
          </Text>

          <View className="space-y-2">
            <View className="flex-row">
              <Text className="text-sm text-gray-500 w-24">Nombre:</Text>
              <Text className="text-sm text-gray-900 flex-1">{invoice.customer_name || '-'}</Text>
            </View>

            <View className="flex-row mt-2">
              <Text className="text-sm text-gray-500 w-24">Documento:</Text>
              <Text className="text-sm text-gray-900 flex-1">
                {DOC_TYPES[invoice.customer_doc_type] || 'Doc'}: {invoice.customer_doc_number || '-'}
              </Text>
            </View>

            {invoice.customer_address && (
              <View className="flex-row mt-2">
                <Text className="text-sm text-gray-500 w-24">Direccion:</Text>
                <Text className="text-sm text-gray-900 flex-1">{invoice.customer_address}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Amounts */}
        <View className="mx-4 mt-4 p-4 bg-white rounded-lg border border-gray-200">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Importes
          </Text>

          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">Subtotal</Text>
              <Text className="text-sm text-gray-900">
                ${invoice.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Text>
            </View>

            <View className="flex-row justify-between mt-2">
              <Text className="text-sm text-gray-600">IVA (21%)</Text>
              <Text className="text-sm text-gray-900">
                ${invoice.tax_amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Text>
            </View>

            <View className="border-t border-gray-200 mt-3 pt-3">
              <View className="flex-row justify-between">
                <Text className="text-base font-bold text-gray-900">Total</Text>
                <Text className="text-xl font-bold text-primary">
                  ${invoice.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Download Button */}
        {invoice.pdf_url && (
          <TouchableOpacity
            className="mx-4 mt-4 p-4 bg-primary rounded-lg flex-row items-center justify-center"
            onPress={() => {
              // Handle PDF download
              Alert.alert('Descargar', 'La factura se descargara en breve');
            }}
          >
            <Ionicons name="download-outline" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Descargar PDF</Text>
          </TouchableOpacity>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
