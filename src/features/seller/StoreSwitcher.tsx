import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Plus } from 'lucide-react-native';
import { T, cx } from '@/components/ui';
import { apiGet, apiPost } from '@/api/client';

type MyStore = { id: string; name: string; username: string; is_active: boolean; paused_for_plan: boolean; current: boolean };
type MyStores = { stores: MyStore[]; limit: number; can_add: boolean; is_business: boolean };

/**
 * Business plan owners with more than one store: tap a store to work in it.
 * Everything in the app (orders, products, wallet) then follows that store.
 * New stores are opened on the web dashboard.
 */
export function StoreSwitcher() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const { data } = useQuery({ queryKey: ['my-stores'], queryFn: () => apiGet<MyStores>('/my-stores') });

  if (!data || (data.stores.length < 2 && !data.can_add)) return null;

  const switchTo = async (s: MyStore) => {
    if (s.current || busy) return;
    setBusy(s.id);
    setError('');
    try {
      await apiPost(`/my-stores/${s.id}/switch`, {});
      // Drop every cached screen so nothing from the previous store shows.
      qc.clear();
      router.replace('/home');
    } catch (e: any) {
      setError(e?.message || 'Could not switch store.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View className="gap-2">
      <T className="font-sans-bold text-xs uppercase tracking-wider text-muted">Your stores</T>
      <View className="rounded-[22px] border border-line bg-surface">
        {data.stores.map((s, i) => (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            accessibilityState={{ selected: s.current, disabled: s.paused_for_plan }}
            accessibilityLabel={`${s.name}${s.current ? ', current store' : s.paused_for_plan ? ', paused' : ', switch to this store'}`}
            disabled={s.paused_for_plan || !!busy}
            onPress={() => switchTo(s)}
            className={cx('min-h-[60px] flex-row items-center gap-3 px-4', i < data.stores.length - 1 && 'border-b border-[#F0ECE3]', s.paused_for_plan && 'opacity-50')}
          >
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-mint">
              <T className="font-sans-bold text-green">{(s.name[0] || 'S').toUpperCase()}</T>
            </View>
            <View className="flex-1">
              <T className="font-sans-semibold text-[15px]">{s.name}</T>
              <T className="text-[12px] text-muted">{s.paused_for_plan ? 'Paused · needs Business plan' : `frontstore.app/${s.username}`}</T>
            </View>
            {busy === s.id ? <ActivityIndicator size="small" color="#0B6E4F" /> : s.current ? <Check size={18} color="#0B6E4F" strokeWidth={2.4} /> : null}
          </Pressable>
        ))}
        {data.can_add ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => Linking.openURL('https://frontstore.app/dashboard')}
            className="min-h-[52px] flex-row items-center gap-3 border-t border-[#F0ECE3] px-4"
          >
            <Plus size={18} color="#0B6E4F" />
            <T className="flex-1 font-sans-semibold text-[15px] text-green">Open another store</T>
            <T className="text-[12px] text-muted">{data.stores.length}/{data.limit} · on the web</T>
          </Pressable>
        ) : null}
      </View>
      {error ? <T className="text-[13px] text-danger">{error}</T> : null}
    </View>
  );
}
