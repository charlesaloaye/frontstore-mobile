import { router } from 'expo-router';
import { apiPut } from './client';
import { logout as apiLogout } from './auth';
import { queryClient } from './queryClient';

/** Log out on the server, forget the token and every cached screen, go to Log in. */
export async function signOut(): Promise<void> {
  await apiLogout(); // also removes the token, even if the server call fails
  queryClient.clear();
  router.replace('/login');
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
