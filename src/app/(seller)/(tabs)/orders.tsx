import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { Search, ShoppingBag } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen, T, cx } from '@/components/ui';
import { getSellerOrders } from '@/api/orders';
import { formatNaira } from '@/lib/format';

type OrderTab = 'paid' | 'shipped' | 'delivered';
const orderTabs: Array<[OrderTab, string]> = [
  ['paid', 'To ship'],
  ['shipped', 'Shipped'],
  ['delivered', 'Delivered'],
];

function EmptyOrders() {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8 pb-10">
      <View className="h-[140px] w-40">
        <View style={{ transform: [{ rotate: '-6deg' }] }} className="absolute left-5 top-5 h-[110px] w-[120px] rounded-[24px] bg-[#E7DCC8]" />
        <View className="absolute left-5 top-[14px] h-[110px] w-[120px] items-center justify-center rounded-[24px] border border-line bg-surface">
          <ShoppingBag size={44} color="#0B6E4F" strokeWidth={1.6} />
        </View>
      </View>
      <T className="text-center font-display-x text-2xl">No orders yet</T>
      <T className="text-center text-[15px] leading-[22px] text-muted-2">
        When someone pays on your store, their order appears here and we'll notify you.
      </T>
      <Link href="/share" asChild>
        <Pressable accessibilityRole="button" className="mt-2 h-[52px] justify-center rounded-full bg-deep px-6">
          <T className="font-sans-bold text-base text-white">Share your store link</T>
        </Pressable>
      </Link>
      <Link href="/add-product" asChild>
        <Pressable accessibilityRole="link" className="min-h-[44px] justify-center">
          <T className="font-sans-bold text-[15px] text-deep">Add more products</T>
        </Pressable>
      </Link>
    </View>
  );
}

export default function Orders() {
  const { empty } = useLocalSearchParams<{ empty?: string }>();
  const [tab, setTab] = useState<OrderTab>('paid');
  const [query, setQuery] = useState('');

  const { data: apiOrders, isLoading } = useQuery({
    queryKey: ['seller-orders'],
    queryFn: () => getSellerOrders(),
  });

  const list = useMemo(() => {
    if (!apiOrders) return [];
    const q = query.trim().toLowerCase();
    return apiOrders.filter((o) => {
      if (o.status !== tab) return false;
      if (!q) return true;
      const text = `${o.customer_name} ${o.order_number} ${o.items_summary || ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [apiOrders, tab, query]);

  if (empty === '1') {
    return (
      <Screen>
        <View className="px-5 pt-3">
          <T className="font-display text-[32px] tracking-[-0.6px]">Orders</T>
        </View>
        <EmptyOrders />
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="gap-4 px-5 pt-3">
        <T className="font-display text-[32px] tracking-[-0.6px]">Orders</T>
        <View accessibilityRole="tablist" className="flex-row gap-1 rounded-[14px] bg-sand p-1">
          {orderTabs.map(([id, label]) => {
            const on = id === tab;
            return (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setTab(id)}
                style={on ? { shadowColor: '#0E1A15', shadowOpacity: 0.12, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 } : undefined}
                className={cx('h-10 flex-1 items-center justify-center rounded-[11px]', on && 'bg-surface')}
              >
                <T className={cx('text-sm', on ? 'font-sans-bold text-ink' : 'font-sans-semibold text-muted-2')}>{label}</T>
              </Pressable>
            );
          })}
        </View>
        <View className="h-11 flex-row items-center gap-2 rounded-xl border border-line bg-surface px-3">
          <Search size={16} color="#5B6660" strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search orders or customers"
            placeholderTextColor="#5B6660"
            accessibilityLabel="Search orders"
            returnKeyType="search"
            className="h-full min-w-0 flex-1 font-sans text-base text-ink"
          />
        </View>
      </View>

      <ScrollView contentContainerClassName="gap-3 px-5 pb-8 pt-3.5">
        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#0B6E4F" />
          </View>
        ) : list.map((o) => {
          const href = `/order/${o.id}` as const;
          const nextAction = tab === 'paid' ? 'Mark shipped' : tab === 'shipped' ? 'Mark delivered' : 'Send receipt';

          return (
            <View key={o.id} className="gap-3 rounded-[20px] border border-line bg-surface p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 flex-row items-center gap-2.5">
                  <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#E9A23B]">
                    <T className="font-sans-bold text-white text-base">{o.customer_name ? o.customer_name[0] : 'C'}</T>
                  </View>
                  <View className="flex-1">
                    <T className="font-sans-bold" numberOfLines={1}>{o.customer_name}</T>
                    <T className="text-xs text-muted">#{o.order_number}</T>
                  </View>
                </View>
                <View className="items-end gap-1">
                  <T className="font-sans-bold">{formatNaira(o.total_kobo / 100)}</T>
                  <View className="rounded-full bg-mint-2 px-2 py-[3px]">
                    <T className="font-sans-bold text-[11px] text-deep">Paid · {o.payment_method}</T>
                  </View>
                </View>
              </View>
              <T className="text-sm leading-5 text-[#33403A]">{o.items_summary || 'Order items'}</T>
              <View className="flex-row gap-2">
                <Link href={href} asChild>
                  <Pressable accessibilityRole="button" className="h-11 flex-1 items-center justify-center rounded-full border border-line-2 bg-surface">
                    <T className="font-sans-bold text-sm">View order</T>
                  </Pressable>
                </Link>
                <Link href={href} asChild>
                  <Pressable accessibilityRole="button" className="h-11 flex-1 items-center justify-center rounded-full bg-deep">
                    <T className="font-sans-bold text-sm text-white">{nextAction}</T>
                  </Pressable>
                </Link>
              </View>
            </View>
          );
        })}
        {!isLoading && list.length === 0 ? <T className="py-10 text-center text-muted">No orders in this tab.</T> : null}
      </ScrollView>
    </Screen>
  );
}
