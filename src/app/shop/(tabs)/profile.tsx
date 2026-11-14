import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Link, router, type Href } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react-native';
import { Screen, T, cx } from '@/components/ui';
import { Avatar } from '@/features/buyer/parts';
import { getMe, logout } from '@/api/auth';
import { getBuyerOrders, getSavedProducts, getFollowedStores } from '@/api/buyer';

const ROWS: { label: string; value: string; href?: Href }[] = [
  { label: 'Delivery addresses', value: 'Saved addresses', href: '/shop/addresses' },
  { label: 'Payment cards', value: 'Cards & tokens', href: '/shop/cards' },
  { label: 'Notifications', value: 'WhatsApp, push', href: '/shop/settings' },
  { label: 'My reviews', value: 'Reviews', href: '/shop/reviews' },
  { label: 'Settings', value: 'Login, privacy', href: '/shop/settings' },
];

export default function BuyerProfile() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const { data: me, refetch: refetchMe } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const { data: orders = [], refetch: refetchOrders } = useQuery({ queryKey: ['buyer-orders'], queryFn: getBuyerOrders });
  const { data: saved = [], refetch: refetchSaved } = useQuery({ queryKey: ['saved-products'], queryFn: getSavedProducts });
  const { data: follows = [], refetch: refetchFollows } = useQuery({ queryKey: ['followed-stores'], queryFn: getFollowedStores });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchMe(), refetchOrders(), refetchSaved(), refetchFollows()]);
    } finally {
      setRefreshing(false);
    }
  };

  const user = me?.user;
  const sellerStore = me?.store;

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'FS';

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    router.replace('/login');
  };

  const stats = [
    { n: String(orders.length), label: 'Orders', href: '/shop/orders' as Href },
    { n: String(saved.length), label: 'Saved', href: '/shop/saved' as Href },
    { n: String(follows.length), label: 'Following', href: '/shop/saved' as Href },
  ];

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="gap-3.5 px-4 pb-6 pt-3"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0B6E4F" />}
      >
        <View className="flex-row items-center gap-3.5">
          <View className="h-[60px] w-[60px] items-center justify-center rounded-full bg-ink">
            <T className="font-sans-bold text-xl text-white">{initials}</T>
          </View>
          <View className="flex-1">
            <T className="font-display text-[22px]">{user?.name ?? 'Guest Shopper'}</T>
            <T className="text-[13px] text-muted">{user?.email ?? user?.phone_number ?? 'Browse stores & track orders'}</T>
          </View>
        </View>

        {sellerStore ? (
          <Link href="/switch?from=shop" asChild>
            <Pressable accessibilityRole="button" accessibilityLabel={`Switch to selling, ${sellerStore.store_name || sellerStore.name || 'Store'}`} className="flex-row items-center gap-3 rounded-[20px] bg-deep p-4">
              <Avatar initial={(sellerStore.store_name || sellerStore.name || 'S')[0]} color={sellerStore.primary_color ?? sellerStore.store_color ?? '#0B6E4F'} size={44} radius={13} fontSize={16} />
              <View className="flex-1">
                <T className="text-xs text-on-dark-2">Switch to selling</T>
                <T className="font-sans-bold text-base text-bg">{sellerStore.store_name || sellerStore.name}</T>
              </View>
              <View className="rounded-full bg-saffron px-[9px] py-1">
                <T className="font-display-x text-xs text-deep">Seller Mode</T>
              </View>
            </Pressable>
          </Link>
        ) : (
          <Link href="/switch?from=shop" asChild>
            <Pressable accessibilityRole="button" className="flex-row items-center gap-3 rounded-[20px] border border-line bg-mint p-4">
              <View className="flex-1">
                <T className="font-sans-bold text-[15px]">Got something to sell?</T>
                <T className="text-[13px] text-muted-2">Open your own Frontstore in minutes.</T>
              </View>
              <T className="font-sans-bold text-[13px] text-green">Start selling</T>
            </Pressable>
          </Link>
        )}

        <View className="flex-row gap-2.5">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} asChild>
              <Pressable accessibilityRole="link" accessibilityLabel={`${s.n} ${s.label}`} className="flex-1 items-center gap-0.5 rounded-2xl border border-line bg-surface px-2 py-3.5">
                <T className="font-sans-bold text-xl">{s.n}</T>
                <T className="text-xs text-muted">{s.label}</T>
              </Pressable>
            </Link>
          ))}
        </View>

        <View className="rounded-[20px] border border-line bg-surface">
          {ROWS.map((r, i) => (
            <Pressable
              key={r.label}
              accessibilityRole="button"
              accessibilityLabel={r.value ? `${r.label}, ${r.value}` : r.label}
              onPress={r.href ? () => router.push(r.href!) : undefined}
              className={cx('min-h-[52px] flex-row items-center gap-3 px-4', i < ROWS.length - 1 && 'border-b border-[#F0ECE3]')}
            >
              <T className="flex-1 font-sans-semibold text-[15px]">{r.label}</T>
              {r.value ? <T className="text-[13px] text-muted">{r.value}</T> : null}
              <ChevronRight size={16} color="#5B6660" strokeWidth={2} />
            </Pressable>
          ))}
        </View>

        {user ? (
          <Pressable accessibilityRole="button" onPress={handleLogout} className="h-11 items-center justify-center">
            <T className="font-sans-bold text-[15px] text-danger">Log out</T>
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => router.push('/login')} className="h-12 items-center justify-center rounded-[16px] bg-ink">
            <T className="font-sans-bold text-[15px] text-white">Log in or Sign up</T>
          </Pressable>
        )}
      </ScrollView>
    </Screen>
  );
}
