import { useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, View } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, RefreshCw, Search } from 'lucide-react-native';
import { Screen, T, cx } from '@/components/ui';
import { naira } from '@/lib/format';
import { Avatar, ChipRow, useTileWidth } from '@/features/buyer/parts';
import { getMe } from '@/api/auth';
import { getMarketplaceStores, getBuyerOrders } from '@/api/buyer';

const CATS = ['For you', 'Fashion', 'Food', 'Beauty', 'Gadgets'];

export default function BuyerHome() {
  const [cat, setCat] = useState('For you');
  const tile = useTileWidth();
  const { from_onboarding, setup_token } = useLocalSearchParams<{ from_onboarding?: string; setup_token?: string }>();
  const isFromOnboarding = from_onboarding === '1' || !!setup_token;

  useEffect(() => {
    if (!isFromOnboarding) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.replace({
        pathname: '/choose-mode',
        params: { setup_token: setup_token || '', initial_mode: 'shop' },
      });
      return true;
    });
    return () => sub.remove();
  }, [isFromOnboarding, setup_token]);

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const { data: liveStores = [] } = useQuery({
    queryKey: ['marketplace-stores', cat],
    queryFn: () => getMarketplaceStores({ category: cat === 'For you' ? undefined : cat }),
  });
  const { data: orders = [] } = useQuery({ queryKey: ['buyer-orders'], queryFn: getBuyerOrders });

  const activeOrder = orders.find((o) => o.order_status === 'paid' || o.order_status === 'shipped' || o.order_status === 'confirmed' || o.order_status === 'processing');

  const user = me?.user;
  const userName = user?.name ? user.name.split(' ')[0] : 'Shopper';
  const userInitials = user?.name ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'FS';

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-3.5 px-4 pb-6 pt-3" showsVerticalScrollIndicator={false}>
        {isFromOnboarding ? (
          <View className="flex-row items-center justify-between rounded-2xl border border-sand-dark bg-surface px-3.5 py-2.5">
            <View className="flex-1 pr-2">
              <T className="font-sans-bold text-xs text-muted-2">Mode: Shopping</T>
              <T className="text-xs text-muted">First time onboarding</T>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace({ pathname: '/choose-mode', params: { setup_token: setup_token || '', initial_mode: 'shop' } })}
              className="flex-row items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5"
            >
              <RefreshCw size={12} color="#0B6E4F" />
              <T className="font-sans-bold text-xs text-green">Change to Selling</T>
            </Pressable>
          </View>
        ) : null}

        <View className="flex-row items-center justify-between">
          <View>
            <T className="text-[13px] text-muted">Delivering to Nigeria</T>
            <T className="font-display-x text-[26px] tracking-[-0.5px]">Hi {userName}</T>
          </View>
          {user ? (
            <Link href="/switch?from=shop" asChild>
              <Pressable accessibilityRole="button" accessibilityLabel="Switch account" className="h-11 flex-row items-center gap-1.5 rounded-full border border-line bg-surface pl-1 pr-1.5">
                <View className="h-[34px] w-[34px] items-center justify-center rounded-full bg-ink">
                  <T className="font-sans-bold text-xs text-white">{userInitials}</T>
                </View>
                <ChevronDown size={14} color="#4A524E" strokeWidth={2} />
              </Pressable>
            </Link>
          ) : (
            <Link href="/login" asChild>
              <Pressable accessibilityRole="button" accessibilityLabel="Sign in" className="h-10 items-center justify-center rounded-full bg-ink px-4">
                <T className="font-sans-bold text-xs text-white">Sign in</T>
              </Pressable>
            </Link>
          )}
        </View>

        <Link href="/shop/search" asChild>
          <Pressable accessibilityRole="search" className="h-12 flex-row items-center gap-2.5 rounded-[14px] border border-line bg-surface px-3.5">
            <Search size={18} color="#5B6660" strokeWidth={2} />
            <T className="text-[15px] text-muted">Search stores and products</T>
          </Pressable>
        </Link>

        {activeOrder ? (
          <Link href={`/shop/track/${activeOrder.id}`} asChild>
            <Pressable accessibilityRole="button" accessibilityLabel={`Track order ${activeOrder.id}`} className="flex-row items-center gap-3 rounded-[20px] bg-ink p-3.5">
              <Avatar initial={(activeOrder.store?.name || activeOrder.store?.store_name)?.[0] ?? 'S'} color={activeOrder.store?.primary_color ?? '#8E4A5E'} size={44} radius={12} fontSize={16} />
              <View className="flex-1 gap-1.5">
                <T className="text-sm text-bg">
                  <T className="font-sans-bold text-sm text-bg">{activeOrder.order_status === 'shipped' ? 'Out for delivery' : 'Processing'}</T> · {activeOrder.store?.name || activeOrder.store?.store_name || 'Store'}
                </T>
                <View className="flex-row gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <View key={i} className={cx('h-1 flex-1 rounded-full', i < (activeOrder.order_status === 'shipped' ? 3 : 1) ? 'bg-leaf' : 'bg-[#33504A]')} />
                  ))}
                </View>
              </View>
              <T className="font-sans-bold text-[13px] text-gold">Track</T>
            </Pressable>
          </Link>
        ) : null}

        <ChipRow options={CATS} value={cat} onChange={setCat} />

        <View className="flex-row items-baseline justify-between">
          <T className="font-sans-bold text-[17px]">Stores on Frontstore</T>
          <Link href={{ pathname: '/shop/search', params: { filter: 'Stores' } }} asChild>
            <Pressable accessibilityRole="link" hitSlop={12}>
              <T className="font-sans-bold text-[13px] text-green">See all</T>
            </Pressable>
          </Link>
        </View>

        {liveStores.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="grow-0" contentContainerClassName="gap-3">
            {liveStores.map((s, i) => {
              const displayName = s.name || s.store_name || 'Store';
              const displaySlug = s.slug || s.username || String(s.id);
              const displayInitial = displayName[0] || 'S';
              const displayColor = s.primary_color || s.store_color || '#0B6E4F';
              return (
                <Link key={displaySlug} href={`/shop/store/${displaySlug}`} asChild>
                  <Pressable accessibilityRole="link" accessibilityLabel={displayName} className="w-[76px] items-center gap-1.5">
                    <View className={cx('rounded-[24px] border-2 p-0.5', i === 0 ? 'border-green' : 'border-transparent')}>
                      <Avatar initial={displayInitial} color={displayColor} size={64} radius={20} fontSize={22} />
                    </View>
                    <T numberOfLines={1} className="text-center font-sans-semibold text-xs">{displayName}</T>
                  </Pressable>
                </Link>
              );
            })}
          </ScrollView>
        ) : (
          <T className="text-sm text-muted">No stores found for {cat.toLowerCase()}.</T>
        )}

        <Link href="/switch?from=shop" asChild>
          <Pressable accessibilityRole="button" className="mt-4 flex-row items-center gap-3 rounded-[20px] border border-line bg-mint p-4">
            <View className="flex-1">
              <T className="font-sans-bold text-[15px]">Got something to sell?</T>
              <T className="text-[13px] text-muted-2">Open your own Frontstore in minutes.</T>
            </View>
            <T className="font-sans-bold text-[13px] text-green">Start selling</T>
          </Pressable>
        </Link>
      </ScrollView>
    </Screen>
  );
}
