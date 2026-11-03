import { apiGet, apiPatch, apiPost } from './client';
import { Order, OrderStatus, WalletBalance, PayoutRecord } from './types';
import { orderFromServer, walletFromServer } from './adapters';

/** Fetch seller orders */
export async function getSellerOrders(params?: { status?: string }): Promise<Order[]> {
  const data = await apiGet<any>('/orders', params);
  const list = Array.isArray(data) ? data : data && Array.isArray(data.data) ? data.data : [];
  return list.map(orderFromServer);
}

/** Fetch order detail by ID */
export async function getOrder(id: string | number): Promise<Order> {
  return orderFromServer(await apiGet<any>(`/orders/${id}`));
}

/**
 * Move an order along (packed -> shipped -> delivered, or cancelled) using
 * the same fulfilment endpoints as the web dashboard.
 */
export async function updateOrderStatus(
  id: string | number,
  status: OrderStatus,
  courierInfo?: { courier_name?: string; tracking_number?: string }
): Promise<Order> {
  if (status === 'packed') await apiPost(`/orders/${id}/packed`);
  else if (status === 'shipped') await apiPost(`/orders/${id}/delivery`, { courier: courierInfo?.courier_name || 'Own rider', tracking_number: courierInfo?.tracking_number || undefined });
  else if (status === 'delivered') await apiPost(`/orders/${id}/delivered`);
  else if (status === 'cancelled') await apiPatch(`/orders/${id}/status`, { order_status: 'cancelled' });
  else throw new Error('That status can’t be set from the app.');
  return getOrder(id);
}

/** Refund the whole order to the buyer (the server refunds the full amount). */
export async function refundOrder(id: string | number, _amountKobo?: number, reason?: string): Promise<Order> {
  await apiPost(`/orders/${id}/refund`, { reason: reason?.trim() || 'Refunded by seller' });
  return getOrder(id);
}

/** Fetch seller wallet balance */
export async function getWalletBalance(): Promise<WalletBalance & { withdrawals: PayoutRecord[] }> {
  return walletFromServer(await apiGet<any>('/store/wallet'));
}

/** Fetch seller payout history */
export async function getPayoutHistory(): Promise<PayoutRecord[]> {
  // A seller's payouts come with their wallet (/withdrawals is the admin list).
  return (await getWalletBalance()).withdrawals;
}

/** Request withdrawal payout */
export async function requestWithdrawal(amountKobo: number, otpCode?: string): Promise<any> {
  // The server takes naira and the code as otp_code.
  return apiPost('/store/withdraw', {
    amount: Math.round(amountKobo) / 100,
    otp_code: otpCode,
  });
}

/** Send OTP for withdrawal/payout account change */
export async function sendWithdrawalOtp(): Promise<any> {
  return apiPost('/store/withdraw/send-otp');
}
