import { apiGet, apiPost, apiPut } from './client';
import { Store, Bank, Country, Currency } from './types';
import { setToken } from './authStore';
import { registerForPush } from '@/lib/push';

/** Check if a store username / subdomain is available */
export async function checkSubdomainAvailable(username: string): Promise<boolean> {
  if (!username || username.trim().length < 3) return false;
  try {
    const slug = username.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const store = await apiGet(`/public/store/${slug}`);
    // If store exists (200), domain is taken
    return !store;
  } catch (err: any) {
    if (err.status === 404) {
      // 404 means store does not exist -> username is available!
      return true;
    }
    return false;
  }
}

/** Get list of supported countries */
export async function getCountries(): Promise<Country[]> {
  return apiGet<Country[]>('/meta/countries');
}

/** Get list of supported currencies */
export async function getCurrencies(): Promise<Currency[]> {
  return apiGet<Currency[]>('/meta/currencies');
}

/** Detect requester's country and default currency via IP */
export async function detectLocation(): Promise<{ country_code: string; currency_code: string }> {
  return apiGet('/meta/detect-location');
}

/** Get list of supported Nigerian banks */
export async function getBanks(): Promise<Bank[]> {
  return apiGet<Bank[]>('/payments/banks');
}

/** Resolve bank account number to account name */
export async function resolveAccount(accountNumber: string, bankCode: string): Promise<{ account_name: string; account_number: string }> {
  return apiPost(
    '/payments/resolve-account',
    {
      account_number: accountNumber,
      bank_code: bankCode,
    },
    { skipAuthRedirect: true }
  );
}

/** Complete merchant store setup */
export async function completeStoreSetup(params: {
  setup_token?: string;
  name?: string;
  store_name: string;
  username: string;
  bank_code?: string;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  store_color?: string;
  primary_color?: string;
  category?: string;
  country_code?: string;
  currency_code?: string;
  location?: string;
  phone_number?: string;
}): Promise<{ store: Store; token?: string }> {
  const res = await apiPost<{ store?: Store; token?: string; data?: { store?: Store; user?: any } }>(
    '/auth/complete-setup',
    params
  );

  const token = res.token;
  if (token) {
    await setToken(token);
    registerForPush();
  }

  const store = res.store || res.data?.store;
  return { store: store as Store, token };
}

/** Fetch active seller store details */
export async function getStore(): Promise<Store> {
  return apiGet<Store>('/store');
}


/** Upload the store logo (store must exist) */
export async function uploadStoreLogo(fileUri: string): Promise<{ url: string }> {
  const formData = new FormData();
  const filename = fileUri.split('/').pop() || 'logo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  formData.append('logo', { uri: fileUri, name: filename, type: match ? `image/${match[1]}` : 'image/jpeg' } as any);
  return apiPost<{ url: string }>('/store/upload-logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
}

/** Update store profile (name, bio, brand colour) */
export async function updateStore(payload: { store_name?: string; store_bio?: string | null; primary_color?: string }): Promise<Store> {
  return apiPut<Store>('/store', payload);
}
