import { router } from 'expo-router';
import { apiGet, apiPost, apiPut } from './client';
import { removeToken } from './authStore';
import { logout as apiLogout } from './auth';
import { queryClient } from './queryClient';

export type AccountKind = 'seller' | 'buyer';

/** Log out on the server, forget the token and every cached screen, go to Welcome. */
export async function signOut(): Promise<void> {
  await apiLogout(); // also removes the token, even if the server call fails
  queryClient.clear();
  router.replace('/welcome');
}

/** Everything we hold about the account, as JSON (sellers: store, products, orders; buyers: orders, addresses...). */
export async function exportAccountData(kind: AccountKind): Promise<unknown> {
  return apiPost(kind === 'seller' ? '/user/export-data' : '/buyer/auth/export-data');
}

/** Seller only: reasons the account can't be deleted yet (e.g. money still to pay out). */
export async function deletionBlockers(): Promise<string[]> {
  try {
    const report = await apiGet<{ can_delete?: boolean; blockers?: string[] }>('/user/delete-account');
    return report?.can_delete === false ? report.blockers ?? ['Your account can’t be deleted yet.'] : [];
  } catch {
    return []; // the delete call checks again on the server
  }
}

export async function deleteAccount(kind: AccountKind): Promise<void> {
  await apiPost(kind === 'seller' ? '/user/delete-account' : '/buyer/auth/delete-account', { confirm: 'DELETE' });
  await removeToken();
  queryClient.clear();
  router.replace('/welcome');
}

/** Save store fields (same endpoint the web dashboard uses). */
export async function updateStore(fields: Record<string, unknown>): Promise<unknown> {
  return apiPut('/store', fields);
}

/** Plan key from the server (free, pro_monthly, legend_yearly...) as the name sellers see. */
export function planName(plan?: string | null): 'Free' | 'Pro' | 'Business' {
  if (plan?.startsWith('legend')) return 'Business';
  if (plan?.startsWith('pro')) return 'Pro';
  return 'Free';
}
