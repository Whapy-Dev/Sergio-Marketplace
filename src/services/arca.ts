/**
 * ARCA (ex AFIP) Electronic Invoicing Service
 * Integrates with WSAA (authentication) and WSFE (invoicing) web services
 *
 * Documentation: https://www.afip.gob.ar/ws/documentacion/
 */

import { supabase } from './supabase';

// Environment configuration
const IS_PRODUCTION = false; // Set to true for production

// ARCA Web Service URLs
const WSAA_URL = IS_PRODUCTION
  ? 'https://wsaa.afip.gov.ar/ws/services/LoginCms'
  : 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms';

const WSFE_URL = IS_PRODUCTION
  ? 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'
  : 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx';

// Invoice types
export enum InvoiceType {
  FACTURA_A = 1,
  NOTA_DEBITO_A = 2,
  NOTA_CREDITO_A = 3,
  FACTURA_B = 6,
  NOTA_DEBITO_B = 7,
  NOTA_CREDITO_B = 8,
  FACTURA_C = 11,
  NOTA_DEBITO_C = 12,
  NOTA_CREDITO_C = 13,
}

// Document types
export enum DocumentType {
  CUIT = 80,
  CUIL = 86,
  CDI = 87,
  DNI = 96,
  PASAPORTE = 94,
  CONSUMIDOR_FINAL = 99, // No document
}

// IVA conditions
export enum IvaCondition {
  RESPONSABLE_INSCRIPTO = 1,
  EXENTO = 4,
  CONSUMIDOR_FINAL = 5,
  MONOTRIBUTO = 6,
}

// IVA rates
export enum IvaRate {
  IVA_0 = 3,
  IVA_10_5 = 4,
  IVA_21 = 5,
  IVA_27 = 6,
  IVA_5 = 8,
  IVA_2_5 = 9,
}

export interface InvoiceData {
  // Buyer info
  buyerDocType: DocumentType;
  buyerDocNumber: string;
  buyerName?: string;
  buyerAddress?: string;
  buyerIvaCondition: IvaCondition;

  // Invoice details
  invoiceType: InvoiceType;
  pointOfSale: number;
  concept: 1 | 2 | 3; // 1: Products, 2: Services, 3: Products & Services

  // Amounts
  netAmount: number; // Base amount without IVA
  ivaAmount: number; // IVA amount
  totalAmount: number; // Total with IVA

  // IVA breakdown (optional for detailed invoices)
  ivaDetails?: {
    rate: IvaRate;
    baseAmount: number;
    amount: number;
  }[];

  // Service dates (required if concept includes services)
  serviceStartDate?: string; // YYYYMMDD
  serviceEndDate?: string; // YYYYMMDD
  paymentDueDate?: string; // YYYYMMDD

  // Optional
  currency?: string; // Default: PES (pesos)
  exchangeRate?: number; // Default: 1

  // Items for internal tracking
  items?: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

export interface InvoiceResult {
  success: boolean;
  cae?: string; // Código de Autorización Electrónico
  caeExpiration?: string; // Fecha vencimiento CAE (YYYYMMDD)
  invoiceNumber?: number;
  pointOfSale?: number;
  invoiceType?: InvoiceType;
  error?: string;
  errorCode?: string;
  observations?: string[];
}

export interface ARCAConfig {
  cuit: string;
  certificate: string; // Base64 encoded .p12 or .pfx
  certificatePassword: string;
  pointOfSale: number;
  ivaCondition: IvaCondition;
  businessName: string;
  address: string;
}

// Store authentication token
let authToken: {
  token: string;
  sign: string;
  expiration: Date;
} | null = null;

/**
 * Get ARCA configuration from database
 */
export async function getARCAConfig(): Promise<ARCAConfig | null> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'arca_config')
      .single();

    if (error || !data) {
      console.error('ARCA config not found in settings');
      return null;
    }

    return data.value as ARCAConfig;
  } catch (error) {
    console.error('Error fetching ARCA config:', error);
    return null;
  }
}

/**
 * Save ARCA configuration to database
 */
export async function saveARCAConfig(config: ARCAConfig): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({
        key: 'arca_config',
        value: config,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving ARCA config:', error);
    return false;
  }
}

/**
 * Authenticate with WSAA to get token and sign
 * Token is valid for 12 hours
 */
export async function authenticate(): Promise<boolean> {
  try {
    // Check if we have a valid token
    if (authToken && authToken.expiration > new Date()) {
      return true;
    }

    const config = await getARCAConfig();
    if (!config) {
      throw new Error('ARCA configuration not found');
    }

    // Create TRA (Ticket de Requerimiento de Acceso)
    const now = new Date();
    const expiration = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours

    const tra = `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${Math.floor(Date.now() / 1000)}</uniqueId>
    <generationTime>${now.toISOString()}</generationTime>
    <expirationTime>${expiration.toISOString()}</expirationTime>
  </header>
  <service>wsfe</service>
</loginTicketRequest>`;

    // TODO: Sign TRA with certificate (requires crypto implementation)
    // For now, this is a placeholder - actual implementation needs:
    // 1. Parse .p12 certificate
    // 2. Sign TRA with private key using CMS/PKCS#7
    // 3. Base64 encode the signed message

    const signedTRA = await signTRA(tra, config.certificate, config.certificatePassword);

    // Call WSAA
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov">
  <soapenv:Body>
    <wsaa:loginCms>
      <wsaa:in0>${signedTRA}</wsaa:in0>
    </wsaa:loginCms>
  </soapenv:Body>
</soapenv:Envelope>`;

    const response = await fetch(WSAA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': '',
      },
      body: soapEnvelope,
    });

    const responseText = await response.text();

    // Parse response to extract token and sign
    const tokenMatch = responseText.match(/<token>(.+?)<\/token>/);
    const signMatch = responseText.match(/<sign>(.+?)<\/sign>/);

    if (!tokenMatch || !signMatch) {
      throw new Error('Failed to parse WSAA response');
    }

    authToken = {
      token: tokenMatch[1],
      sign: signMatch[1],
      expiration,
    };

    return true;
  } catch (error) {
    console.error('WSAA authentication error:', error);
    return false;
  }
}

/**
 * Sign TRA with certificate
 * This is a placeholder - needs proper crypto implementation
 */
async function signTRA(tra: string, certificate: string, password: string): Promise<string> {
  // TODO: Implement proper signing with node-forge or similar
  // This requires:
  // 1. Load PKCS#12 certificate
  // 2. Extract private key and certificate chain
  // 3. Create CMS signed data
  // 4. Base64 encode result

  // For testing, you can use a pre-signed TRA or implement with:
  // - node-forge
  // - pkcs7
  // - openssl commands via exec

  console.warn('TRA signing not fully implemented - using placeholder');
  return Buffer.from(tra).toString('base64');
}

/**
 * Get next invoice number for a point of sale and invoice type
 */
export async function getNextInvoiceNumber(
  pointOfSale: number,
  invoiceType: InvoiceType
): Promise<number | null> {
  try {
    if (!authToken) {
      const authenticated = await authenticate();
      if (!authenticated) return null;
    }

    const config = await getARCAConfig();
    if (!config) return null;

    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ar="http://ar.gov.afip.dif.FEV1/">
  <soapenv:Body>
    <ar:FECompUltimoAutorizado>
      <ar:Auth>
        <ar:Token>${authToken!.token}</ar:Token>
        <ar:Sign>${authToken!.sign}</ar:Sign>
        <ar:Cuit>${config.cuit}</ar:Cuit>
      </ar:Auth>
      <ar:PtoVta>${pointOfSale}</ar:PtoVta>
      <ar:CbteTipo>${invoiceType}</ar:CbteTipo>
    </ar:FECompUltimoAutorizado>
  </soapenv:Body>
</soapenv:Envelope>`;

    const response = await fetch(WSFE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'http://ar.gov.afip.dif.FEV1/FECompUltimoAutorizado',
      },
      body: soapEnvelope,
    });

    const responseText = await response.text();
    const numberMatch = responseText.match(/<CbteNro>(\d+)<\/CbteNro>/);

    if (!numberMatch) {
      throw new Error('Failed to get last invoice number');
    }

    return parseInt(numberMatch[1]) + 1;
  } catch (error) {
    console.error('Error getting next invoice number:', error);
    return null;
  }
}

/**
 * Create an electronic invoice with ARCA
 */
export async function createInvoice(data: InvoiceData): Promise<InvoiceResult> {
  try {
    // Ensure we're authenticated
    if (!authToken) {
      const authenticated = await authenticate();
      if (!authenticated) {
        return {
          success: false,
          error: 'Authentication failed',
        };
      }
    }

    const config = await getARCAConfig();
    if (!config) {
      return {
        success: false,
        error: 'ARCA configuration not found',
      };
    }

    // Get next invoice number
    const invoiceNumber = await getNextInvoiceNumber(data.pointOfSale, data.invoiceType);
    if (!invoiceNumber) {
      return {
        success: false,
        error: 'Failed to get next invoice number',
      };
    }

    // Format date as YYYYMMDD
    const today = new Date();
    const invoiceDate = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Build IVA array (required for Factura A and B)
    let ivaArray = '';
    if (data.ivaDetails && data.ivaDetails.length > 0) {
      ivaArray = `<ar:Iva>
        ${data.ivaDetails.map(iva => `
          <ar:AlicIva>
            <ar:Id>${iva.rate}</ar:Id>
            <ar:BaseImp>${iva.baseAmount.toFixed(2)}</ar:BaseImp>
            <ar:Importe>${iva.amount.toFixed(2)}</ar:Importe>
          </ar:AlicIva>
        `).join('')}
      </ar:Iva>`;
    }

    // Service dates (required if concept is 2 or 3)
    let serviceDates = '';
    if (data.concept !== 1) {
      serviceDates = `
        <ar:FchServDesde>${data.serviceStartDate || invoiceDate}</ar:FchServDesde>
        <ar:FchServHasta>${data.serviceEndDate || invoiceDate}</ar:FchServHasta>
        <ar:FchVtoPago>${data.paymentDueDate || invoiceDate}</ar:FchVtoPago>
      `;
    }

    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ar="http://ar.gov.afip.dif.FEV1/">
  <soapenv:Body>
    <ar:FECAESolicitar>
      <ar:Auth>
        <ar:Token>${authToken!.token}</ar:Token>
        <ar:Sign>${authToken!.sign}</ar:Sign>
        <ar:Cuit>${config.cuit}</ar:Cuit>
      </ar:Auth>
      <ar:FeCAEReq>
        <ar:FeCabReq>
          <ar:CantReg>1</ar:CantReg>
          <ar:PtoVta>${data.pointOfSale}</ar:PtoVta>
          <ar:CbteTipo>${data.invoiceType}</ar:CbteTipo>
        </ar:FeCabReq>
        <ar:FeDetReq>
          <ar:FECAEDetRequest>
            <ar:Concepto>${data.concept}</ar:Concepto>
            <ar:DocTipo>${data.buyerDocType}</ar:DocTipo>
            <ar:DocNro>${data.buyerDocNumber}</ar:DocNro>
            <ar:CbteDesde>${invoiceNumber}</ar:CbteDesde>
            <ar:CbteHasta>${invoiceNumber}</ar:CbteHasta>
            <ar:CbteFch>${invoiceDate}</ar:CbteFch>
            <ar:ImpTotal>${data.totalAmount.toFixed(2)}</ar:ImpTotal>
            <ar:ImpTotConc>0.00</ar:ImpTotConc>
            <ar:ImpNeto>${data.netAmount.toFixed(2)}</ar:ImpNeto>
            <ar:ImpOpEx>0.00</ar:ImpOpEx>
            <ar:ImpTrib>0.00</ar:ImpTrib>
            <ar:ImpIVA>${data.ivaAmount.toFixed(2)}</ar:ImpIVA>
            ${serviceDates}
            <ar:MonId>${data.currency || 'PES'}</ar:MonId>
            <ar:MonCotiz>${data.exchangeRate || 1}</ar:MonCotiz>
            ${ivaArray}
          </ar:FECAEDetRequest>
        </ar:FeDetReq>
      </ar:FeCAEReq>
    </ar:FECAESolicitar>
  </soapenv:Body>
</soapenv:Envelope>`;

    const response = await fetch(WSFE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'http://ar.gov.afip.dif.FEV1/FECAESolicitar',
      },
      body: soapEnvelope,
    });

    const responseText = await response.text();

    // Parse response
    const resultMatch = responseText.match(/<Resultado>(.+?)<\/Resultado>/);
    const caeMatch = responseText.match(/<CAE>(\d+)<\/CAE>/);
    const caeExpMatch = responseText.match(/<CAEFchVto>(\d+)<\/CAEFchVto>/);
    const errorMatch = responseText.match(/<Err>.*?<Code>(\d+)<\/Code>.*?<Msg>(.+?)<\/Msg>/s);

    if (resultMatch && resultMatch[1] === 'A' && caeMatch) {
      // Success
      const result: InvoiceResult = {
        success: true,
        cae: caeMatch[1],
        caeExpiration: caeExpMatch ? caeExpMatch[1] : undefined,
        invoiceNumber,
        pointOfSale: data.pointOfSale,
        invoiceType: data.invoiceType,
      };

      // Store invoice in database
      await storeInvoice(result, data);

      return result;
    } else {
      // Error
      return {
        success: false,
        error: errorMatch ? errorMatch[2] : 'Unknown error from ARCA',
        errorCode: errorMatch ? errorMatch[1] : undefined,
      };
    }
  } catch (error) {
    console.error('Error creating invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Store invoice in database for records
 */
async function storeInvoice(result: InvoiceResult, data: InvoiceData): Promise<void> {
  try {
    await supabase.from('invoices').insert({
      cae: result.cae,
      cae_expiration: result.caeExpiration,
      invoice_number: result.invoiceNumber,
      point_of_sale: result.pointOfSale,
      invoice_type: result.invoiceType,
      buyer_doc_type: data.buyerDocType,
      buyer_doc_number: data.buyerDocNumber,
      buyer_name: data.buyerName,
      net_amount: data.netAmount,
      iva_amount: data.ivaAmount,
      total_amount: data.totalAmount,
      items: data.items,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error storing invoice:', error);
  }
}

/**
 * Determine invoice type based on seller and buyer IVA conditions
 */
export function determineInvoiceType(
  sellerCondition: IvaCondition,
  buyerCondition: IvaCondition
): InvoiceType {
  // Monotributo always issues Factura C
  if (sellerCondition === IvaCondition.MONOTRIBUTO) {
    return InvoiceType.FACTURA_C;
  }

  // Responsable Inscripto
  if (sellerCondition === IvaCondition.RESPONSABLE_INSCRIPTO) {
    // To another RI → Factura A
    if (buyerCondition === IvaCondition.RESPONSABLE_INSCRIPTO) {
      return InvoiceType.FACTURA_A;
    }
    // To CF, Monotributo, Exento → Factura B
    return InvoiceType.FACTURA_B;
  }

  // Default to Factura B
  return InvoiceType.FACTURA_B;
}

/**
 * Calculate IVA breakdown for an amount
 */
export function calculateIVA(
  netAmount: number,
  rate: number = 21
): { netAmount: number; ivaAmount: number; totalAmount: number } {
  const ivaAmount = netAmount * (rate / 100);
  const totalAmount = netAmount + ivaAmount;

  return {
    netAmount: Math.round(netAmount * 100) / 100,
    ivaAmount: Math.round(ivaAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
}

/**
 * Format invoice number for display (0001-00000001)
 */
export function formatInvoiceNumber(pointOfSale: number, invoiceNumber: number): string {
  return `${pointOfSale.toString().padStart(4, '0')}-${invoiceNumber.toString().padStart(8, '0')}`;
}

/**
 * Get invoice type name in Spanish
 */
export function getInvoiceTypeName(type: InvoiceType): string {
  const names: Record<InvoiceType, string> = {
    [InvoiceType.FACTURA_A]: 'Factura A',
    [InvoiceType.NOTA_DEBITO_A]: 'Nota de Débito A',
    [InvoiceType.NOTA_CREDITO_A]: 'Nota de Crédito A',
    [InvoiceType.FACTURA_B]: 'Factura B',
    [InvoiceType.NOTA_DEBITO_B]: 'Nota de Débito B',
    [InvoiceType.NOTA_CREDITO_B]: 'Nota de Crédito B',
    [InvoiceType.FACTURA_C]: 'Factura C',
    [InvoiceType.NOTA_DEBITO_C]: 'Nota de Débito C',
    [InvoiceType.NOTA_CREDITO_C]: 'Nota de Crédito C',
  };
  return names[type] || 'Comprobante';
}

/**
 * Create invoice for an order
 * This is the main function to call after a successful payment
 */
export async function createInvoiceForOrder(
  orderId: string,
  buyerData: {
    docType: DocumentType;
    docNumber: string;
    name?: string;
    ivaCondition: IvaCondition;
  }
): Promise<InvoiceResult> {
  try {
    // Get order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return {
        success: false,
        error: 'Order not found',
      };
    }

    const config = await getARCAConfig();
    if (!config) {
      return {
        success: false,
        error: 'ARCA configuration not found',
      };
    }

    // Determine invoice type
    const invoiceType = determineInvoiceType(config.ivaCondition, buyerData.ivaCondition);

    // Calculate amounts
    // For simplicity, assuming 21% IVA included in total
    const totalAmount = order.total;
    const netAmount = totalAmount / 1.21;
    const ivaAmount = totalAmount - netAmount;

    // Prepare items
    const items = order.order_items.map((item: any) => ({
      description: item.product_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      total: item.subtotal,
    }));

    // Create invoice
    const result = await createInvoice({
      buyerDocType: buyerData.docType,
      buyerDocNumber: buyerData.docNumber,
      buyerName: buyerData.name,
      buyerIvaCondition: buyerData.ivaCondition,
      invoiceType,
      pointOfSale: config.pointOfSale,
      concept: 1, // Products
      netAmount,
      ivaAmount,
      totalAmount,
      ivaDetails: invoiceType !== InvoiceType.FACTURA_C ? [
        {
          rate: IvaRate.IVA_21,
          baseAmount: netAmount,
          amount: ivaAmount,
        },
      ] : undefined,
      items,
    });

    // Update order with invoice info
    if (result.success) {
      await supabase
        .from('orders')
        .update({
          invoice_number: formatInvoiceNumber(result.pointOfSale!, result.invoiceNumber!),
          fiscal_data: {
            cae: result.cae,
            caeExpiration: result.caeExpiration,
            invoiceType,
            pointOfSale: result.pointOfSale,
          },
        })
        .eq('id', orderId);
    }

    return result;
  } catch (error) {
    console.error('Error creating invoice for order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
