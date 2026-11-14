import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Link, Stack, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react-native';
import { T, cx } from '@/components/ui';
import { getMe } from '@/api/auth';
import { setUserMode } from '@/api/authStore';

type Mode = 'shop' | 'sell';

export default function Switch() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const current: Mode = from === 'shop' ? 'shop' : 'sell';
  const [sel, setSel] = useState<Mode>(current === 'shop' ? 'sell' : 'shop');
  const insets = useSafeAreaInsets();

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });

  const user = me?.user;
  const sellerStore = me?.store;

  const buyerName = user?.name || 'Customer';
  const buyerInitials = user?.name ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'FS';

  const sellerName = sellerStore?.store_name || sellerStore?.name || 'My Store';
  const sellerInitial = (sellerName || 'S')[0].toUpperCase();
  const sellerColor = sellerStore?.primary_color || sellerStore?.store_color || '#0B6E4F';

  const accounts = [
    { id: 'shop' as Mode, kind: 'Shopping', name: buyerName, sub: 'Buyer Mode', ini: buyerInitials, av: '#0E1A15', radius: 24 },
    { id: 'sell' as Mode, kind: 'Selling', name: sellerName, sub: 'Seller Mode', ini: sellerInitial, av: sellerColor, radius: 14 },
  ];

  const close = () => (router.canGoBack() ? router.back() : router.replace(current === 'shop' ? '/shop' : '/home'));

  const go = async () => {
    await setUserMode(sel === 'shop' ? 'buyer' : 'seller');
    if (sel === current) return close();
    router.dismissTo(sel === 'shop' ? '/shop' : '/home');
  };

  const goLabel = sel === 'shop'
    ? (current === 'shop' ? 'Stay in shopping' : 'Switch to shopping')
    : (current === 'sell' ? 'Stay in selling' : 'Switch to selling');

  return (
    <View className="flex-1 justify-end bg-transparent">
      <Stack.Screen options={{ contentStyle: { backgroundColor: 'transparent' } }} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={close}
        style={{ backgroundColor: 'rgba(14,26,21,0.5)' }}
        className="absolute inset-0"
      />
      <View
        accessibilityViewIsModal
        accessibilityLabel="Switch account"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }}
        className="gap-3 rounded-t-[28px] bg-surface px-4 pt-3"
      >
        <View className="h-[5px] w-10 self-center rounded-full bg-line-2" />
        <T accessibilityRole="header" className="font-display-x text-[22px]">Switch account</T>

        {accounts.map((a) => {
          const on = a.id === sel;
          return (
            <Pressable
              key={a.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${a.kind}, ${a.name}, ${a.sub}`}
              onPress={() => setSel(a.id)}
              className={cx('flex-row items-center gap-3 rounded-[18px] p-3.5', on ? 'border-2 border-ink bg-surface-2' : 'border border-line bg-surface')}
            >
              <View style={{ backgroundColor: a.av, borderRadius: a.radius }} className="h-12 w-12 items-center justify-center">
                <T className="font-display-x text-base text-white">{a.ini}</T>
              </View>
              <View className="flex-1">
                <T className="font-sans-bold text-xs uppercase tracking-[0.7px] text-muted">{a.kind}</T>
                <T className="font-sans-bold text-base">{a.name}</T>
                <T className="text-[13px] text-muted">{a.sub}</T>
              </View>
              <View className={cx('h-[22px] w-[22px] rounded-full', on ? 'border-[7px] border-green' : 'border-[1.5px] border-[#B9B1A0]')} />
            </Pressable>
          );
        })}

        <Link href="/store-name" asChild>
          <Pressable accessibilityRole="button" className="flex-row items-center gap-3 rounded-[18px] border-[1.5px] border-dashed border-[#B9B1A0] p-3.5">
            <View className="h-12 w-12 items-center justify-center rounded-[14px] bg-cream">
              <Plus size={22} color="#0E1A15" strokeWidth={2} />
            </View>
            <T className="font-sans-bold text-base">Open another store</T>
          </Pressable>
        </Link>

        <Pressable accessibilityRole="button" onPress={go} className="h-[54px] items-center justify-center rounded-full bg-deep">
          <T className="font-sans-bold text-base text-white">{goLabel}</T>
        </Pressable>
      </View>
    </View>
  );
}
