import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from './client';
import { Store, Product, Order, Address, SavedCard, Review, NotificationPreferences } from './types';
import { orderFromServer, productFromServer } from './adapters';

/** Discover public marketplace stores */
export async function getMarketplaceStores(params?: { category?: string; search?: string }): Promise<Store[]> {
  const data = await apiGet<any>('/public/stores', params);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

/** Search products and stores */
export async function searchMarketplace(query: string): Promise<{ stores: Store[]; products: Product[] }> {
  const r: any = await apiGet<any>('/public/marketplace', { q: query });
  return { stores: r?.stores ?? [], products: (r?.products ?? []).map(productFromServer) };
}

/** Get public store details by slug */
export async function getPublicStore(slug: string): Promise<{ store: Store; products: Product[]; reviews: Review[] }> {
  const r: any = await apiGet<any>(`/public/store/${slug}`);
  return { ...r, products: (r?.products ?? []).map(productFromServer), reviews: r?.reviews ?? [] };
}

/** Fetch buyer's orders */
export async function getBuyerOrders(): Promise<Order[]> {
  const data = await apiGet<any>('/buyer/auth/orders');
  const list = Array.isArray(data) ? data : data && Array.isArray(data.data) ? data.data : [];
  return list.map(orderFromServer);
}

/** Track order by ID */
export async function trackOrder(orderId: string | number): Promise<Order> {
  return orderFromServer(await apiGet<any>(`/public/orders/${orderId}`));
}

/** Confirm delivery of an order */
export async function confirmOrderDelivery(orderId: string | number): Promise<Order> {
  return apiPost<Order>(`/public/orders/${orderId}/confirm-delivery`);
}

/** Fetch buyer addresses */
export async function getAddresses(): Promise<Address[]> {
  const data = await apiGet<any>('/buyer/addresses');
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
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
  const data = await apiGet<any>('/buyer/cards');
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
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
  const data = await apiGet<any>('/buyer/follows');
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

/** Save / unsave product */
export async function toggleSaveProduct(productId: number | string): Promise<{ saved: boolean }> {
  return apiPost<{ saved: boolean }>(`/buyer/saved-products/${productId}`);
}

/** Fetch saved products */
export async function getSavedProducts(): Promise<Product[]> {
  const data = await apiGet<any>('/buyer/saved-products');
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

/** Fetch buyer reviews */
export async function getBuyerReviews(): Promise<Review[]> {
  const data = await apiGet<any>('/buyer/reviews');
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

/** Submit review for delivered order */
export async function submitOrderReview(orderId: number | string, rating: number, comment: string): Promise<Review> {
  return apiPost<Review>(`/public/orders/${orderId}/reviews`, { rating, comment });
}

/** Fetch buyer notification preferences */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return apiGet<NotificationPreferences>('/buyer/notification-preferences');
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
export async function initOrderPayment(orderId: string | number): Promise<any> {
  return apiPost<any>(`/orders/${orderId}/initialize-payment`);
}
