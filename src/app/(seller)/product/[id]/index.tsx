import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ban, Copy, EyeOff, Pencil, Share, Trash2, type LucideIcon } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { T, cx } from '@/components/ui';
import { formatNaira } from '@/lib/format';
import { Grip, goBack } from '@/features/seller/parts';
import { getProduct, updateProduct } from '@/api/products';

function Row({ Icon, label, onPress, danger, className }: { Icon: LucideIcon; label: string; onPress: () => void; danger?: boolean; className?: string }) {
  const color = danger ? '#A8321E' : '#0E1A15';
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className={cx('h-[52px] flex-row items-center gap-3.5 px-2', className)}>
      <Icon size={20} color={color} strokeWidth={2} />
      <T style={{ color }} className={cx('text-base', danger ? 'font-sans-bold' : 'font-sans-semibold')}>{label}</T>
    </Pressable>
  );
}

export default function ProductActions() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (patch: any) => updateProduct(id!, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
    },
  });

  const close = () => goBack('/products');

  const name = product?.name || '';
  const priceKobo = product?.price_kobo ?? 0;
  const isHidden = product?.status === 'hidden';
  const isOut = (product?.stock_count ?? 10) === 0;

  const toggleSoldOut = () => {
    updateMutation.mutate({ stock_count: isOut ? 10 : 0 });
  };

  const toggleHide = () => {
    updateMutation.mutate({ status: isHidden ? 'live' : 'hidden' });
  };

  return (
    <View className="flex-1 justify-end">
      <Stack.Screen options={{ contentStyle: { backgroundColor: 'transparent' } }} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close menu"
        onPress={close}
        className="absolute inset-0 bg-[rgba(14,26,21,0.5)]"
      />
      <View
        accessibilityViewIsModal
        accessibilityLabel="Product options"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }}
        className="gap-1.5 rounded-t-[28px] bg-surface px-4 pt-2.5"
      >
        <Grip className="mb-2" />
        <View className="flex-row items-center gap-3 border-b border-[#F0ECE3] px-1 pb-3.5 pt-1">
          <View className="h-[52px] w-[52px] items-center justify-center rounded-xl bg-[#E9A23B]">
            <T className="font-sans-bold text-white text-lg">{name[0]}</T>
          </View>
          <View className="flex-1 gap-0.5">
            <T className="font-sans-bold text-base">{name}</T>
            <T className="font-sans-bold text-sm text-green">{formatNaira(priceKobo / 100)} · {isHidden ? 'Hidden' : isOut ? 'Sold out' : 'In stock'}</T>
          </View>
        </View>
        <Row Icon={Pencil} label="Edit product" onPress={() => router.replace(`/product/${id}/edit`)} />
        <Row Icon={Share} label="Share product" onPress={() => router.replace('/share')} />
        <Row Icon={Ban} label={isOut ? 'Mark as in stock' : 'Mark as sold out'} onPress={toggleSoldOut} />
        <Row Icon={EyeOff} label={isHidden ? 'Show on store' : 'Hide from store'} onPress={toggleHide} />
        <Row Icon={Trash2} label="Delete product" danger className="border-t border-[#F0ECE3]" onPress={() => router.replace(`/product/${id}/delete`)} />
        <Pressable accessibilityRole="button" onPress={close} className="mt-1.5 h-[52px] items-center justify-center rounded-full bg-cream">
          <T className="font-sans-bold text-base">Cancel</T>
        </Pressable>
      </View>
    </View>
  );
}
