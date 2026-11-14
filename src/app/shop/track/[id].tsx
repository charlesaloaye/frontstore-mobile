import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';
import { Screen, T, cx } from '@/components/ui';
import { naira } from '@/lib/format';
import { trackOrder, confirmOrderDelivery } from '@/api/buyer';

export default function BuyerTrack() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: liveOrder } = useQuery({
    queryKey: ['order-track', id],
    queryFn: () => trackOrder(id!),
    enabled: !!id,
  });

  const confirmMutation = useMutation({
    mutationFn: () => confirmOrderDelivery(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-track', id] });
      queryClient.invalidateQueries({ queryKey: ['buyer-orders'] });
    },
  });

  const isDelivered = liveOrder?.order_status === 'delivered';
  const [got, setGot] = useState(isDelivered);

  const storeName = liveOrder?.store?.name || 'Store';
  const courierName = liveOrder?.courier_name || 'Assigned Courier';
  const trackingNumber = liveOrder?.tracking_number || `TRK-${id}`;
  const courierInitial = courierName[0] || 'R';
  const totalAmount = liveOrder ? liveOrder.total_amount : 0;

  const doneStep = (liveOrder?.order_status === 'delivered' || got) ? 4 : liveOrder?.order_status === 'shipped' ? 3 : 2;

  const steps: [string, string][] = [
    ['Paid', 'Confirmed'],
    [`Packed by ${storeName}`, 'Ready'],
    ['Out for delivery', `${courierName}`],
    ['Delivered', (got || liveOrder?.order_status === 'delivered') ? 'Delivered' : 'Pending'],
  ];

  const handleConfirm = () => {
    setGot(true);
    if (id && liveOrder) {
      confirmMutation.mutate();
    }
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace('/shop/orders'));

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-2 pb-1">
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={back} className="h-11 w-11 items-center justify-center">
          <ChevronLeft size={24} color="#0E1A15" strokeWidth={2} />
        </Pressable>
        <View className="items-center">
          <T className="font-sans-bold text-base">#{id || 'ORDER'}</T>
          <T className="text-xs text-muted">{storeName}</T>
        </View>
        <View className="w-11" />
      </View>

      <ScrollView contentContainerClassName="gap-3 px-4 pb-6 pt-2">
        <View className="gap-1.5 rounded-[22px] bg-ink p-5">
          <T className="text-[13px] text-on-dark-2">{got ? 'Delivered' : 'Arriving'}</T>
          <T className="font-display text-[26px] text-bg">{got ? 'Enjoy your order!' : 'Estimated today'}</T>
          <T className="text-sm text-on-dark">{got ? 'Thanks for confirming.' : (liveOrder?.shipping_address ? `${liveOrder.shipping_address.street}, ${liveOrder.shipping_address.city}` : 'Delivery address on record')}</T>
        </View>

        <View className="rounded-[20px] border border-line bg-surface p-[18px]" accessibilityRole="list">
          {steps.map(([title, sub], i) => {
            const on = i < doneStep;
            const last = i === steps.length - 1;
            return (
              <View key={title} className="flex-row gap-3.5" accessibilityLabel={`${title}, ${sub}${on ? ', done' : ''}`}>
                <View className="items-center">
                  <View className={cx('h-[22px] w-[22px] rounded-full', on ? 'bg-green' : 'border-2 border-[#B9B1A0] bg-surface')} />
                  <View
                    className={cx('min-h-6 w-0.5 flex-1', last ? 'bg-transparent' : i < doneStep - 1 ? 'bg-green' : 'bg-line')}
                  />
                </View>
                <View className={cx('flex-1 gap-0.5', !last && 'pb-4')}>
                  <T className={cx('font-sans-bold text-[15px]', on ? 'text-ink' : 'text-[#8A918D]')}>{title}</T>
                  <T className="text-[13px] text-muted">{sub}</T>
                </View>
              </View>
            );
          })}
        </View>

        <View className="flex-row items-center gap-3 rounded-[20px] border border-line bg-surface px-4 py-3.5">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-cream">
            <T className="font-sans-bold text-base">{courierInitial}</T>
          </View>
          <View className="flex-1">
            <T className="font-sans-bold text-sm">{courierName}</T>
            <T className="text-xs text-muted">{trackingNumber}</T>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Call rider" className="h-10 justify-center rounded-full border border-line-2 px-3.5">
            <T className="font-sans-bold text-[13px]">Call</T>
          </Pressable>
        </View>

        <View className="gap-2 rounded-[20px] border border-line bg-surface px-4 py-3.5">
          {liveOrder?.items && liveOrder.items.length > 0 ? (
            liveOrder.items.map((i) => (
              <View key={i.id} className="flex-row justify-between">
                <T className="text-sm">{i.product_name || i.product?.name || 'Item'} (x{i.quantity})</T>
                <T className="font-sans-bold text-sm">{naira((i.price || (i.unit_price_kobo ? i.unit_price_kobo / 100 : 0)) * i.quantity)}</T>
              </View>
            ))
          ) : (
            <T className="py-2 text-sm text-muted">No line item details available.</T>
          )}
          <View className="flex-row justify-between border-t border-dashed border-line-2 pt-2">
            <T className="font-sans-bold text-sm">Total Paid</T>
            <T className="font-sans-bold text-sm">{naira(totalAmount)}</T>
          </View>
        </View>
      </ScrollView>

      <View style={{ paddingBottom: Math.max(insets.bottom, 12) }} className="flex-row gap-2.5 border-t border-line bg-bg px-4 pt-3">
        <Pressable accessibilityRole="button" className="h-[54px] justify-center rounded-full border border-line-2 px-[18px]">
          <T className="font-sans-bold text-[15px]">Get help</T>
        </Pressable>
        {got ? (
          <Pressable accessibilityRole="button" className="h-[54px] flex-1 items-center justify-center rounded-full bg-ink">
            <T className="font-sans-bold text-base text-white">Rate your order</T>
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" onPress={handleConfirm} className="h-[54px] flex-1 items-center justify-center rounded-full bg-deep">
            <T className="font-sans-bold text-base text-white">I've received it</T>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}
