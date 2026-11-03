/**
 * Translate between the Laravel API and the shapes the app's screens use.
 *
 * The server works in naira (price, total_amount, withdrawable_balance) with
 * its own field names (image_urls, inventory_quantity, order_status...). The
 * screens were written for kobo and different names. Everything goes through
 * here so each screen gets one consistent shape, and nothing silently reads
 * a field that doesn't exist.
 */
import type { Order, OrderItem, OrderStatus, PayoutRecord, Product, WalletBalance } from './types';

const kobo = (naira: unknown) => Math.round((Number(naira) || 0) * 100);

/* ------------------------------------------------------------- products */

export function productFromServer(p: any): Product {
  if (!p || typeof p !== 'object') return p;
  const images: string[] = Array.isArray(p.image_urls) ? p.image_urls.filter(Boolean) : p.image_url ? [p.image_url] : [];
  const variants: any[] = Array.isArray(p.variants) ? p.variants : [];
  const tracked = Boolean(p.track_inventory);
  const qty = Number(p.inventory_quantity ?? 0);
  const out = p.stock_status === 'out_of_stock' || (tracked && qty <= 0);
  const hidden = Boolean(p.is_draft) || Boolean(p.hidden_by_admin_at);
  return {
    ...p,
    price_kobo: kobo(p.price),
    compare_at_price_kobo: p.compare_at_price != null ? kobo(p.compare_at_price) : null,
    // Untracked stock counts as available unless marked out of stock.
    stock_count: out ? 0 : tracked ? qty : Math.max(qty, 1),
    status: hidden ? 'hidden' : p.stock_status === 'preorder' ? 'preorder' : 'live',
    images,
    category: typeof p.category === 'object' && p.category ? p.category.name : p.category ?? null,
    sizes: Array.from(new Set(variants.map((v) => v.size).filter(Boolean))),
    variants: variants.map((v) => ({ ...v, name: [v.size, v.color].filter(Boolean).join(' / ') || 'Option', stock: Number(v.inventory_quantity ?? 0), price_kobo: v.price != null ? kobo(v.price) : undefined })),
  };
}

/** App fields -> what POST/PUT /products accepts. Only fields that were given are sent. */
export function productToServer(input: Partial<Product> & { colors?: string[] }): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (input.name !== undefined) out.name = input.name;
  if (input.description !== undefined) out.description = input.description ?? '';
  if (input.price_kobo !== undefined) out.price = Math.round(input.price_kobo) / 100;
  else if (input.price !== undefined) out.price = input.price;
  if (input.compare_at_price_kobo !== undefined) out.compare_at_price = input.compare_at_price_kobo == null ? null : input.compare_at_price_kobo / 100;
  if (input.category) out.category_name = input.category;
  if (input.images !== undefined) out.image_urls = (input.images || []).filter((u) => /^https?:\/\//.test(u)).slice(0, 3);
  if (input.stock_count !== undefined) {
    out.track_inventory = true;
    out.inventory_quantity = Math.max(0, Math.round(input.stock_count));
    out.stock_status = input.stock_count > 0 ? 'in_stock' : 'out_of_stock';
  }
  if (input.status !== undefined) {
    out.is_draft = input.status === 'hidden';
    if (input.status === 'preorder') out.stock_status = 'preorder';
  }
  if (input.colors?.length) out.tags = input.colors.slice(0, 20);
  return out;
}

/* --------------------------------------------------------------- orders */

/** One status for the app, from the server's payment status, order status and delivery steps. */
export function orderStatusFromServer(o: any): OrderStatus {
  if (o.payment_status === 'refunded' || o.order_status === 'refunded') return 'refunded';
  if (o.order_status === 'cancelled' || o.order_status === 'expired') return 'cancelled';
  if (o.delivered_at || o.delivery_milestone === 'delivered' || o.order_status === 'completed') return 'delivered';
  if (o.shipped_at || o.delivery_milestone === 'shipped') return 'shipped';
  if (o.packed_at) return 'packed';
  if (o.payment_status === 'paid') return 'paid';
  return 'pending';
}

function itemFromServer(i: any): OrderItem {
  const unit = Number(i.product_price ?? i.unit_price ?? i.price ?? 0);
  const qty = Number(i.quantity ?? 1);
  return {
    ...i,
    product_name: i.product_name ?? i.name ?? 'Item',
    quantity: qty,
    unit_price_kobo: kobo(unit),
    total_kobo: kobo(unit * qty),
    selected_size: i.size ?? i.selected_size ?? null,
    selected_color: i.color ?? i.selected_color ?? null,
    price: unit,
  };
}

export function orderFromServer(o: any): Order {
  if (!o || typeof o !== 'object') return o;
  const items = Array.isArray(o.items) ? o.items.filter((i: any) => !i.bundle_parent_id).map(itemFromServer) : [];
  const method = String(o.payment_method || '').toLowerCase();
  return {
    ...o,
    total_kobo: kobo(o.total_amount),
    subtotal_kobo: kobo(items.reduce((s: number, i: OrderItem) => s + (i.price || 0) * i.quantity, 0)),
    delivery_fee_kobo: kobo(Number(o.shipping_fee || 0) + Number(o.shipping_handling_fee || 0)),
    status: orderStatusFromServer(o),
    payment_method: method.includes('transfer') ? 'Transfer' : method.includes('ussd') ? 'USSD' : method ? 'Card' : (o.payment_method ?? 'Card'),
    courier_name: o.courier_name ?? o.courier ?? null,
    items,
    items_summary: items.map((i: OrderItem) => `${i.quantity}× ${i.product_name}`).join(', '),
  };
}

/* --------------------------------------------------------------- wallet */

export function walletFromServer(w: any): WalletBalance & { withdrawals: PayoutRecord[] } {
  const available = Number(w?.withdrawable_balance ?? 0);
  const pending = Number(w?.pending_balance ?? 0);
  const withdrawals: any[] = Array.isArray(w?.withdrawals) ? w.withdrawals : [];
  return {
    available_balance_kobo: kobo(available),
    pending_balance_kobo: kobo(pending),
    // Paid out so far plus what is waiting: what this store has earned on Frontstore.
    total_earned_kobo: kobo(available + pending + withdrawals.filter((x) => payoutStatus(x.status) === 'paid').reduce((s, x) => s + Number(x.amount || 0), 0)),
    currency: w?.currency_code || 'NGN',
    bank_name: w?.bank_name ?? null,
    account_number: w?.bank_account_number ?? null,
    account_name: w?.bank_account_name ?? null,
    balance: available,
    withdrawals: withdrawals.map((x) => payoutFromServer(x)),
  };
}

function payoutStatus(s: unknown): PayoutRecord['status'] {
  const v = String(s || '').toLowerCase();
  if (['completed', 'paid', 'success', 'successful'].includes(v)) return 'paid';
  if (['failed', 'rejected', 'reversed', 'cancelled'].includes(v)) return 'failed';
  return 'processing';
}

export function payoutFromServer(x: any): PayoutRecord {
  return {
    id: x.id,
    amount_kobo: kobo(x.amount),
    status: payoutStatus(x.status),
    date: x.created_at || x.updated_at || '',
    orders_count: Number(x.orders_count ?? 0),
    bank_name: x.bank_name || '',
    account_number: x.account_number || '',
  };
}
