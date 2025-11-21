import { supabase } from './supabase';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface SellerBalance {
  available_balance: number;
  pending_balance: number;
  total_withdrawn: number;
  total_earned: number;
}

export interface WithdrawalRequest {
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
}

export interface BalanceTransaction {
  id: string;
  user_id: string;
  type: 'sale' | 'withdrawal' | 'refund' | 'adjustment' | 'commission';
  amount: number;
  balance_after: number;
  reference_type?: string;
  reference_id?: string;
  description?: string;
  created_at: string;
}

export interface BankingDetails {
  cbu_cvu?: string;
  mp_alias?: string;
  cuil_cuit?: string;
  account_holder_name?: string;
}

export interface CommissionCalculation {
  subtotal: number;
  commission_rate: number;
  commission_amount: number;
  seller_payout: number;
}

// ============================================
// BALANCE & EARNINGS
// ============================================

/**
 * Get seller's current balance
 */
export async function getSellerBalance(sellerId: string): Promise<SellerBalance | null> {
  try {
    const { data, error } = await supabase
      .from('seller_balances')
      .select('available_balance, pending_balance, total_earned')
      .eq('seller_id', sellerId)
      .single();

    if (error) {
      // If no balance record exists, return zeros
      if (error.code === 'PGRST116') {
        return {
          available_balance: 0,
          pending_balance: 0,
          total_withdrawn: 0,
          total_earned: 0,
        };
      }
      throw error;
    }

    return {
      available_balance: data.available_balance || 0,
      pending_balance: data.pending_balance || 0,
      total_withdrawn: 0,
      total_earned: data.total_earned || 0,
    };
  } catch (error) {
    console.error('Error fetching seller balance:', error);
    return null;
  }
}

/**
 * Get seller's balance transaction history
 */
export async function getBalanceTransactions(
  userId: string,
  limit: number = 50
): Promise<BalanceTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('balance_transactions')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching balance transactions:', error);
    return [];
  }
}

// ============================================
// BANKING DETAILS
// ============================================

/**
 * Get user's banking details
 */
export async function getBankingDetails(userId: string): Promise<BankingDetails | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('cbu_cvu, mp_alias, cuil_cuit, account_holder_name')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching banking details:', error);
    return null;
  }
}

/**
 * Update user's banking details
 */
export async function updateBankingDetails(
  userId: string,
  details: BankingDetails
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(details)
      .eq('id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error updating banking details:', error);
    return false;
  }
}

// ============================================
// WITHDRAWAL REQUESTS
// ============================================

/**
 * Get minimum withdrawal amount setting
 */
export async function getMinimumWithdrawalAmount(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'minimum_withdrawal_amount')
      .single();

    if (error) throw error;

    return parseFloat(data.value as string) || 5000;
  } catch (error) {
    console.error('Error fetching minimum withdrawal amount:', error);
    return 5000; // Default fallback
  }
}

/**
 * Create a withdrawal request
 */
export async function createWithdrawalRequest(
  sellerId: string,
  amount: number,
  paymentMethod: 'cbu_cvu' | 'mp_alias'
): Promise<WithdrawalRequest | null> {
  try {
    // Get banking details
    const bankingDetails = await getBankingDetails(sellerId);
    if (!bankingDetails) {
      throw new Error('Banking details not found');
    }

    // Prepare payment details
    const paymentDetails: any = {
      account_holder_name: bankingDetails.account_holder_name,
    };

    if (paymentMethod === 'cbu_cvu') {
      if (!bankingDetails.cbu_cvu) {
        throw new Error('CBU/CVU not configured');
      }
      paymentDetails.cbu_cvu = bankingDetails.cbu_cvu;
    } else {
      if (!bankingDetails.mp_alias) {
        throw new Error('Mercado Pago alias not configured');
      }
      paymentDetails.mp_alias = bankingDetails.mp_alias;
    }

    // Create request
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: sellerId,
        amount,
        payment_method: paymentMethod,
        bank_account_info: paymentDetails,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    return null;
  }
}

/**
 * Get seller's withdrawal requests
 */
export async function getSellerWithdrawalRequests(sellerId: string): Promise<WithdrawalRequest[]> {
  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', sellerId)
      .order('requested_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    return [];
  }
}

/**
 * Cancel a pending withdrawal request
 */
export async function cancelWithdrawalRequest(requestId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('withdrawal_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId)
      .eq('status', 'pending'); // Can only cancel pending requests

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error cancelling withdrawal request:', error);
    return false;
  }
}

/**
 * Get all withdrawal requests (for admin)
 */
export async function getAllWithdrawalRequests(
  status?: string,
  limit: number = 100
): Promise<WithdrawalRequest[]> {
  try {
    let query = supabase
      .from('withdrawal_requests')
      .select('*')
      .order('requested_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching all withdrawal requests:', error);
    return [];
  }
}

/**
 * Update withdrawal request status (admin only)
 */
export async function updateWithdrawalRequestStatus(
  requestId: string,
  status: WithdrawalRequest['status'],
  adminId: string,
  notes?: string,
  rejectionReason?: string,
  transactionReference?: string
): Promise<boolean> {
  try {
    const updateData: any = {
      status,
      processed_by: adminId,
      admin_notes: notes,
    };

    if (status === 'rejected' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    if (status === 'completed' && transactionReference) {
      updateData.transaction_reference = transactionReference;
      updateData.processed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('withdrawal_requests')
      .update(updateData)
      .eq('id', requestId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error updating withdrawal request:', error);
    return false;
  }
}

// ============================================
// COMMISSION CALCULATION
// ============================================

/**
 * Calculate commission for a product sale
 */
export async function calculateCommission(
  productId: string,
  sellerId: string,
  categoryId: string,
  unitPrice: number,
  quantity: number
): Promise<CommissionCalculation | null> {
  try {
    const { data, error } = await supabase
      .rpc('calculate_seller_payout', {
        p_product_id: productId,
        p_seller_id: sellerId,
        p_category_id: categoryId,
        p_unit_price: unitPrice,
        p_quantity: quantity,
      });

    if (error) throw error;

    return data[0] || null;
  } catch (error) {
    console.error('Error calculating commission:', error);
    // Fallback calculation if RPC fails
    const subtotal = unitPrice * quantity;
    const defaultRate = 10.0;
    const commissionAmount = (subtotal * defaultRate) / 100;

    return {
      subtotal,
      commission_rate: defaultRate,
      commission_amount: commissionAmount,
      seller_payout: subtotal - commissionAmount,
    };
  }
}

/**
 * Get category commission rate
 */
export async function getCategoryCommissionRate(categoryId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('commission_rate')
      .eq('id', categoryId)
      .single();

    if (error) throw error;

    return data?.commission_rate || 10.0;
  } catch (error) {
    console.error('Error fetching category commission rate:', error);
    return 10.0; // Default
  }
}

/**
 * Get store commission rate
 */
export async function getStoreCommissionRate(storeId: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('official_stores')
      .select('commission_rate')
      .eq('id', storeId)
      .single();

    if (error) throw error;

    return data?.commission_rate ?? null;
  } catch (error) {
    console.error('Error fetching store commission rate:', error);
    return null;
  }
}

// ============================================
// SETTINGS
// ============================================

/**
 * Get marketplace owner ID
 */
export async function getMarketplaceOwnerId(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'marketplace_owner_id')
      .single();

    if (error) throw error;

    const value = data.value as string;
    return value !== 'null' ? value : null;
  } catch (error) {
    console.error('Error fetching marketplace owner ID:', error);
    return null;
  }
}

/**
 * Update setting
 */
export async function updateSetting(
  key: string,
  value: any,
  adminId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('settings')
      .update({
        value,
        updated_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('key', key);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error updating setting:', error);
    return false;
  }
}
