import { apiGet, apiPatch, apiPost } from './client';
import { Order, OrderStatus, WalletBalance, PayoutRecord } from './types';

/**
 * The backend keeps order_status / payment_status / delivery_milestone and
 * amounts in naira; the screens use one fulfilment stage and kobo.
 */
export function orderStage(o: any): OrderStatus {
  if (o.payment_status === 'refunded' || o.order_status === 'refunded') return 'refunded';
  if (o.order_status === 'cancelled' || o.order_status === 'expired') return 'cancelled';
  if (o.order_status === 'completed' || o.delivery_milestone === 'delivered') return 'delivered';
  if (o.delivery_milestone === 'shipped') return 'shipped';
  if (o.order_status === 'processing') return 'packed';
  return 'paid';
}

/** How the buyer paid, in words a seller recognises. */
function paymentLabel(method: unknown): string {
  const m = String(method || '').toLowerCase();
  if (m.includes('transfer') || m === 'bank') return 'Transfer';
  if (m.includes('ussd')) return 'USSD';
  if (m.includes('card') || m === 'paystack' || m === 'stripe') return 'Card';
  if (m === 'payment_link') return 'Payment link';
  if (['delivery', 'cod', 'cash_on_delivery', 'pay_on_delivery'].includes(m)) return 'On delivery';
  if (m === 'whatsapp') return 'WhatsApp';
  return m ? m.charAt(0).toUpperCase() + m.slice(1) : '';
}

function normalizeOrder(o: any): Order {
  const amount = Number(o.display_amount ?? o.total_amount ?? 0);
  // Bundle parts are listed under their bundle; summarise the top-level lines.
  const items = Array.isArray(o.items) ? o.items.filter((i: any) => !i.bundle_parent_id) : [];
  const summary = items.map((i: any) => `${Number(i.quantity ?? 1)}× ${i.product_name ?? i.name ?? 'Item'}`).join(', ');
  return {
    ...o,
    status: orderStage(o),
    total_kobo: Math.round(amount * 100),
    items_summary: o.items_summary ?? summary,
    payment_method: paymentLabel(o.payment_method) as Order['payment_method'],
  };
}

/** Fetch seller orders */
export async function getSellerOrders(params?: { status?: string }): Promise<Order[]> {
  const data = await apiGet<any>('/orders', params);
  const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return list.map(normalizeOrder);
}

/** Fetch order detail by ID */
export async function getOrder(id: string | number): Promise<Order> {
  return normalizeOrder(await apiGet<any>(`/orders/${id}`));
}

/** Move an order to the next stage (paid -> packed -> shipped -> delivered) */
export async function updateOrderStatus(
  id: string | number,
  status: OrderStatus,
  courierInfo?: { courier_name?: string; tracking_number?: string }
): Promise<Order> {
  if (status === 'shipped') {
    return normalizeOrder(await apiPatch<any>(`/orders/${id}/shipment`, courierInfo));
  }
  const orderStatus = status === 'packed' ? 'processing' : status === 'delivered' ? 'completed' : null;
  if (!orderStatus) throw new Error(`Can't move an order to "${status}" from the app.`);
  return normalizeOrder(await apiPatch<any>(`/orders/${id}/status`, { order_status: orderStatus }));
}

/** Merchant refunds the whole order */
export async function refundOrder(id: string | number, reason: string): Promise<Order> {
  return normalizeOrder(await apiPost<any>(`/orders/${id}/refund`, { reason }));
}

const toKobo = (naira: unknown) => Math.round((Number(naira) || 0) * 100);

function payoutStatus(s: unknown): PayoutRecord['status'] {
  const v = String(s || '').toLowerCase();
  if (['completed', 'paid', 'success', 'successful'].includes(v)) return 'paid';
  if (['failed', 'rejected', 'reversed', 'cancelled'].includes(v)) return 'failed';
  return 'processing';
}

/**
 * Seller wallet. The backend sends naira (withdrawable_balance, pending_balance)
 * and the payout list; the screens use kobo and these names.
 */
export async function getWalletBalance(): Promise<WalletBalance & { withdrawals: PayoutRecord[] }> {
  const w: any = await apiGet<any>('/store/wallet');
  const available = Number(w?.withdrawable_balance ?? 0);
  const pending = Number(w?.pending_balance ?? 0);
  const withdrawals: PayoutRecord[] = (Array.isArray(w?.withdrawals) ? w.withdrawals : []).map((x: any) => ({
    id: x.id,
    amount_kobo: toKobo(x.amount),
    status: payoutStatus(x.status),
    date: x.created_at || x.updated_at || '',
    orders_count: Number(x.orders_count ?? 0),
    bank_name: x.bank_name || '',
    account_number: x.account_number || '',
  }));
  return {
    ...w,
    available_balance_kobo: toKobo(available),
    pending_balance_kobo: toKobo(pending),
    total_earned_kobo: toKobo(available + pending + withdrawals.filter((x) => x.status === 'paid').reduce((sum, x) => sum + x.amount_kobo / 100, 0)),
    currency: w?.currency_code || 'NGN',
    bank_name: w?.bank_name ?? null,
    account_number: w?.bank_account_number ?? null,
    account_name: w?.bank_account_name ?? null,
    balance: available,
    withdrawals,
  };
}

/** Seller payout history: it comes with the wallet (/withdrawals is the admin-only list). */
export async function getPayoutHistory(): Promise<PayoutRecord[]> {
  return (await getWalletBalance()).withdrawals;
}

/** Request a payout. The backend takes the amount in naira and the code as otp_code. */
export async function requestWithdrawal(amountKobo: number, otpCode?: string): Promise<any> {
  return apiPost('/store/withdraw', {
    amount: Math.round(amountKobo) / 100,
    otp_code: otpCode,
  });
}

/** Send OTP for withdrawal/payout account change */
export async function sendWithdrawalOtp(): Promise<any> {
  return apiPost('/store/withdraw/send-otp');
}
