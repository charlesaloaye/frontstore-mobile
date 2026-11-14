import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from './client';
import { Store, Product, Order, Address, SavedCard, Review, NotificationPreferences } from './types';
import { getToken } from './authStore';

export function normalizeStore(s: any): Store {
  if (!s) return s;
  return {
    ...s,
    id: s.id,
    store_name: s.store_name || s.name || 'Store',
    name: s.store_name || s.name || 'Store',
    username: s.username || s.slug || '',
    slug: s.username || s.slug || '',
    primary_color: s.primary_color || s.store_color || '#0B6E4F',
    store_color: s.store_color || s.primary_color || '#0B6E4F',
    store_bio: s.store_bio || s.bio || '',
    category_label: s.category_label || s.category || '',
    category: s.category_label || s.category || '',
    location: s.location || 'Nigeria',
    logo_url: s.logo_url || null,
    whatsapp_phone: s.whatsapp_phone || s.phone || null,
    is_active: s.is_active ?? true,
  };
}

export function normalizeOrder(o: any): Order {
  if (!o) return o;
  return {
    ...o,
    store: o.store ? normalizeStore(o.store) : o.store,
  };
}

export function normalizeProduct(p: any): Product {
  if (!p) return p;
  return {
    ...p,
    store: p.store ? normalizeStore(p.store) : p.store,
  };
}

export interface PaginatedStoresResponse {
  stores: Store[];
  currentPage: number;
  lastPage: number;
  hasMore: boolean;
  total: number;
}

/** Discover public marketplace stores */
export async function getMarketplaceStores(params?: { category?: string; search?: string; filter?: string; page?: number; per_page?: number }): Promise<Store[]> {
  const data = await apiGet<any>('/public/stores', params);
  let rawList: any[] = [];
  if (Array.isArray(data)) rawList = data;
  else if (data && Array.isArray(data.data)) rawList = data.data;
  else if (data && Array.isArray(data.items)) rawList = data.items;
  return rawList.map(normalizeStore);
}

/** Paginated store list for infinite scrolling */
export async function getMarketplaceStoresPaginated(params?: { category?: string; search?: string; filter?: string; page?: number; per_page?: number }): Promise<PaginatedStoresResponse> {
  const data = await apiGet<any>('/public/stores', { per_page: 15, ...params });
  let rawList: any[] = [];
  if (Array.isArray(data)) {
    rawList = data;
    return {
      stores: rawList.map(normalizeStore),
      currentPage: params?.page || 1,
      lastPage: 1,
      hasMore: false,
      total: rawList.length,
    };
  }

  if (data && Array.isArray(data.data)) {
    rawList = data.data;
  }

  return {
    stores: rawList.map(normalizeStore),
    currentPage: data?.current_page || params?.page || 1,
    lastPage: data?.last_page || 1,
    hasMore: Boolean(data?.has_more),
    total: data?.total ?? rawList.length,
  };
}

/** Search products and stores */
export async function searchMarketplace(query: string): Promise<{ stores: Store[]; products: Product[] }> {
  const res = await apiGet<any>('/public/marketplace', { q: query });
  const payload = res?.data || res || {};
  return {
    stores: (payload.stores || []).map(normalizeStore),
    products: (payload.products || []).map(normalizeProduct),
  };
}

/** Get public store details by slug */
export async function getPublicStore(slug: string): Promise<{ store: Store; products: Product[]; reviews: Review[] }> {
  const res = await apiGet<{ store: any; products: any[]; reviews: any[] }>(`/public/store/${slug}`);
  return {
    store: normalizeStore(res.store || { slug, name: slug }),
    products: (res.products || []).map(normalizeProduct),
    reviews: res.reviews || [],
  };
}

/** Fetch buyer's orders */
export async function getBuyerOrders(): Promise<Order[]> {
  const token = await getToken();
  if (!token) return [];
  try {
    const data = await apiGet<any>('/buyer/auth/orders', undefined, { skipAuthRedirect: true });
    let ordersList: any[] = [];
    if (Array.isArray(data)) {
      ordersList = data;
    } else if (data && Array.isArray(data.data)) {
      ordersList = data.data;
    } else if (data && data.data && Array.isArray(data.data.orders)) {
      ordersList = data.data.orders;
    } else if (data && Array.isArray(data.orders)) {
      ordersList = data.orders;
    }
    return ordersList.map(normalizeOrder);
  } catch {
    return [];
  }
}

/** Track order by ID */
export async function trackOrder(orderId: string | number): Promise<Order> {
  return apiGet<Order>(`/public/orders/${orderId}`);
}

/** Confirm delivery of an order */
export async function confirmOrderDelivery(orderId: string | number): Promise<Order> {
  return apiPost<Order>(`/public/orders/${orderId}/confirm-delivery`);
}

/** Fetch buyer addresses */
export async function getAddresses(): Promise<Address[]> {
  const token = await getToken();
  if (!token) return [];
  try {
    const data = await apiGet<any>('/buyer/addresses', undefined, { skipAuthRedirect: true });
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  } catch {
    return [];
  }
}

/** Add delivery address */
export async function addAddress(payload: Omit<Address, 'id'>): Promise<Address> {
  return apiPost<Address>('/buyer/addresses', payload);
}

/** Update delivery address */
export async function updateAddress(id: number, payload: Partial<Address>): Promise<Address> {
  return apiPut<Address>(`/buyer/addresses/${id}`, payload);
}

/** Delete delivery address */
export async function deleteAddress(id: number): Promise<void> {
  return apiDelete(`/buyer/addresses/${id}`);
}

/** Set default address */
export async function setDefaultAddress(id: number): Promise<void> {
  return apiPatch(`/buyer/addresses/${id}/default`);
}

/** Fetch saved card tokens */
export async function getSavedCards(): Promise<SavedCard[]> {
  const token = await getToken();
  if (!token) return [];
  try {
    const data = await apiGet<any>('/buyer/cards', undefined, { skipAuthRedirect: true });
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  } catch {
    return [];
  }
}

/** Delete saved card token */
export async function deleteSavedCard(id: number): Promise<void> {
  return apiDelete(`/buyer/cards/${id}`);
}

/** Set default saved card */
export async function setDefaultSavedCard(id: number): Promise<void> {
  return apiPatch(`/buyer/cards/${id}/default`);
}

/** Initialize Paystack tokenization charge */
export async function initializeCardTokenization(): Promise<{ authorization_url: string; reference: string }> {
  return apiPost('/buyer/cards/initialize');
}

/** Follow / unfollow store */
export async function toggleFollowStore(storeId: number): Promise<{ followed: boolean }> {
  return apiPost<{ followed: boolean }>(`/buyer/follows/${storeId}`);
}

/** Fetch followed stores */
export async function getFollowedStores(): Promise<Store[]> {
  const token = await getToken();
  if (!token) return [];
  try {
    const data = await apiGet<any>('/buyer/follows', undefined, { skipAuthRedirect: true });
    let rawList: any[] = [];
    if (Array.isArray(data)) rawList = data;
    else if (data && Array.isArray(data.data)) rawList = data.data;
    return rawList.map(normalizeStore);
  } catch {
    return [];
  }
}

/** Save / unsave product */
export async function toggleSaveProduct(productId: number | string): Promise<{ saved: boolean }> {
  return apiPost<{ saved: boolean }>(`/buyer/saved-products/${productId}`);
}

/** Fetch saved products */
export async function getSavedProducts(): Promise<Product[]> {
  const token = await getToken();
  if (!token) return [];
  try {
    const data = await apiGet<any>('/buyer/saved-products', undefined, { skipAuthRedirect: true });
    let rawList: any[] = [];
    if (Array.isArray(data)) rawList = data;
    else if (data && Array.isArray(data.data)) rawList = data.data;
    return rawList.map(normalizeProduct);
  } catch {
    return [];
  }
}

/** Fetch buyer reviews */
export async function getBuyerReviews(): Promise<Review[]> {
  const token = await getToken();
  if (!token) return [];
  try {
    const data = await apiGet<any>('/buyer/reviews', undefined, { skipAuthRedirect: true });
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  } catch {
    return [];
  }
}

/** Submit review for delivered order */
export async function submitOrderReview(orderId: number | string, rating: number, comment: string): Promise<Review> {
  return apiPost<Review>(`/public/orders/${orderId}/reviews`, { rating, comment });
}

/** Fetch buyer notification preferences */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const token = await getToken();
  const fallback: NotificationPreferences = {
    whatsapp_order_updates: false,
    email_notifications: false,
    push_notifications: false,
    new_drops: false,
    price_drops: false,
  };
  if (!token) return fallback;
  try {
    return await apiGet<NotificationPreferences>('/buyer/notification-preferences', undefined, { skipAuthRedirect: true });
  } catch {
    return fallback;
  }
}

/** Update buyer notification preferences */
export async function updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
  return apiPut<NotificationPreferences>('/buyer/notification-preferences', preferences);
}

/** Place public store order */
export async function createStoreOrder(slug: string, payload: any): Promise<any> {
  return apiPost<any>(`/public/store/${slug}/orders`, payload);
}

/** Initialize order payment via Paystack */
export interface OrderPaymentInfo {
  /** Hosted checkout (Stripe / Flutterwave stores) */
  authorization_url?: string;
  /** Bank transfer: the store's dedicated account, confirmed automatically */
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  amount?: number;
  payment_instructions?: string;
}

/** How to pay for a new order; the backend picks the method per store */
export async function initOrderPayment(orderId: string | number): Promise<OrderPaymentInfo> {
  return apiPost<OrderPaymentInfo>(`/public/orders/${orderId}/initialize-payment`);
}
