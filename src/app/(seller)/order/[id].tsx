import { useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen, T, cx } from '@/components/ui';
import { BackHeader, Grip, Tag } from '@/features/seller/parts';
import { getOrder, updateOrderStatus, refundOrder } from '@/api/orders';
import { OrderStatus } from '@/api/types';
import { formatNaira } from '@/lib/format';
import { SearchableSelectModal } from '@/components/SearchableSelectModal';

const STEPS: OrderStatus[] = ['paid', 'packed', 'shipped', 'delivered'];
const STEP_LABELS = ['Paid', 'Packed', 'Shipped', 'Delivered'];
const NEXT_LABELS: Record<string, string> = {
  paid: 'Mark as packed',
  packed: 'Mark as shipped',
  shipped: 'Mark as delivered',
};
const REASONS = ['Out of stock', 'Customer changed mind', 'Damaged or wrong item'];

function ContactButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="h-11 flex-1 items-center justify-center rounded-full border border-line-2">
      <T className="font-sans-bold text-sm">{label}</T>
    </Pressable>
  );
}

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [refundOpen, setRefundOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipModalOpen, setShipModalOpen] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (args: { status: OrderStatus; courier_name?: string; tracking_number?: string }) =>
      updateOrderStatus(id!, args.status, { courier_name: args.courier_name, tracking_number: args.tracking_number }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
    },
  });

  const refundMutation = useMutation({
    mutationFn: (args: { reason: string }) => refundOrder(id!, args.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      setRefundOpen(false);
    },
  });

  const currentStatus = order?.status || 'paid';
  const isRefunded = currentStatus === 'refunded';
  const stepIdx = STEPS.indexOf(currentStatus as OrderStatus) !== -1 ? STEPS.indexOf(currentStatus as OrderStatus) : 0;

  const advanceStatus = () => {
    if (currentStatus === 'packed') {
      setShipModalOpen(true);
      return;
    }
    const nextIdx = Math.min(stepIdx + 1, STEPS.length - 1);
    const nextStatus = STEPS[nextIdx];
    statusMutation.mutate({ status: nextStatus });
  };

  const confirmShipment = () => {
    setShipModalOpen(false);
    statusMutation.mutate({
      status: 'shipped',
      courier_name: courierName,
      tracking_number: trackingNumber,
    });
  };

  const handleRefund = () => refundMutation.mutate({ reason });

  const customerPhone = order?.customer_phone || '';
  const customerName = order?.customer_name || 'Customer';
  const address: string = order?.delivery_address || order?.shipping_address || '';
  const totalAmountKobo = order?.total_kobo ?? 0;
  const netKobo = order?.merchant_net_amount != null ? Math.round(Number(order.merchant_net_amount) * 100) : totalAmountKobo;
  const isPaid = order?.payment_status === 'paid' || isRefunded;
  const actionError = (statusMutation.error || refundMutation.error) as Error | null;

  if (isLoading || !order) {
    return (
      <Screen>
        <BackHeader title="Order" sub="Order Details" fallback="/orders" />
        <View className="flex-1 items-center justify-center">
          {isLoading ? <ActivityIndicator color="#0B6E4F" /> : <T className="text-muted-2">Order not found.</T>}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <BackHeader
        title={`#${order?.order_number || id}`}
        sub="Order Details"
        fallback="/orders"
        right={
          isRefunded || !isPaid ? (
            <View className="w-11" />
          ) : (
            <Pressable accessibilityRole="button" accessibilityLabel="Refund" onPress={() => setRefundOpen(true)} className="h-11 justify-center px-3">
              <T className="font-sans-bold text-sm text-danger">Refund</T>
            </Pressable>
          )
        }
      />

      <ScrollView contentContainerClassName="gap-3 px-4 pb-6 pt-1">
        <View className="gap-3 rounded-[20px] border border-line bg-surface p-4">
          <View className="flex-row items-center justify-between">
            <Tag
              label={isPaid ? `Paid${order.payment_method ? ` · ${order.payment_method}` : ''}` : 'Awaiting payment'}
              bg={isPaid ? '#CFE8DC' : '#FBEFD9'}
              fg={isPaid ? '#07261C' : '#7A4B06'}
            />
            <Tag label={isRefunded ? 'Refunded' : STEP_LABELS[stepIdx]} bg={isRefunded ? '#FBE7E2' : '#CFE8DC'} fg={isRefunded ? '#A8321E' : '#07261C'} />
          </View>
          <View className="flex-row gap-1.5" accessibilityLabel={`Progress: ${STEP_LABELS[stepIdx]}`}>
            {STEPS.map((label, i) => (
              <View key={label} className="flex-1 gap-1.5">
                <View style={{ backgroundColor: i <= stepIdx ? '#0B6E4F' : '#E3DED2' }} className="h-[5px] rounded-full" />
                <T style={{ color: i <= stepIdx ? '#0E1A15' : '#8A918D' }} className="font-sans-bold text-xs">{STEP_LABELS[i]}</T>
              </View>
            ))}
          </View>
        </View>

        <View className="gap-3 rounded-[20px] border border-line bg-surface px-4 py-3.5">
          <T className="font-sans-bold text-[15px]">{order?.items_summary || 'Order Items'}</T>
          {order?.courier_name ? (
            <View className="rounded-[10px] bg-mint px-2.5 py-2">
              <T className="text-[13px] text-deep">Courier: {order.courier_name} {order.tracking_number ? `· ${order.tracking_number}` : ''}</T>
            </View>
          ) : null}
          <View className="gap-1.5 border-t border-dashed border-line-2 pt-2.5">
            <View className="flex-row justify-between">
              <T className="text-sm text-muted-2">Total Paid</T>
              <T className="text-sm">{formatNaira(totalAmountKobo / 100)}</T>
            </View>
            <View className="flex-row justify-between">
              <T className="font-sans-bold text-sm text-green">You receive</T>
              <T className="font-sans-bold text-sm text-green">{formatNaira(netKobo / 100)}</T>
            </View>
          </View>
        </View>

        <View className="gap-2.5 rounded-[20px] border border-line bg-surface px-4 py-3.5">
          <View className="gap-0.5">
            <T className="font-sans-bold text-[15px]">{customerName}</T>
            {address ? <T className="text-[13px] text-muted-2">{address}</T> : null}
          </View>
          {customerPhone ? <View className="flex-row gap-2">
            <ContactButton label="Call" onPress={() => Linking.openURL(`tel:${customerPhone}`)} />
            <ContactButton label="WhatsApp" onPress={() => Linking.openURL(`https://wa.me/${customerPhone.replace(/\D/g, '')}`)} />
            <ContactButton
              label="Maps"
              onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address || 'Lagos')}`)}
            />
          </View> : null}
        </View>
      </ScrollView>

      <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 6 }} className="gap-2 border-t border-line bg-bg px-4 pt-3">
        {actionError ? <T accessibilityLiveRegion="polite" className="text-center text-sm text-danger">{actionError.message}</T> : null}
        {stepIdx === 3 || isRefunded || currentStatus === 'cancelled' ? (
          <View accessibilityLiveRegion="polite" className="h-14 items-center justify-center rounded-full bg-mint-2">
            <T className="font-sans-bold text-base text-deep">{isRefunded ? `Refunded ${formatNaira(totalAmountKobo / 100)}` : currentStatus === 'cancelled' ? 'Cancelled' : 'Delivered - nice work'}</T>
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={advanceStatus} disabled={statusMutation.isPending} className="h-14 flex-row items-center justify-center gap-2 rounded-full bg-deep">
            {statusMutation.isPending ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
            <T className="font-sans-bold text-[17px] text-white">{NEXT_LABELS[currentStatus] || 'Update Status'}</T>
          </Pressable>
        )}
      </View>

      {/* Courier & Tracking Modal */}
      <Modal visible={shipModalOpen} transparent animationType="fade" onRequestClose={() => setShipModalOpen(false)}>
        <View className="flex-1 justify-end">
          <Pressable onPress={() => setShipModalOpen(false)} className="absolute inset-0 bg-[rgba(14,26,21,0.5)]" />
          <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }} className="gap-4 rounded-t-[28px] bg-surface px-5 pt-3">
            <Grip />
            <T className="font-display-x text-[22px]">Mark order as shipped</T>
            <View className="gap-1.5">
              <T className="font-sans-bold text-sm">Courier Name</T>
              <TextInput value={courierName} onChangeText={setCourierName} placeholder="GIG Logistics, Fez, etc." className="h-12 rounded-xl border border-line-2 bg-surface px-3 font-sans text-base" />
            </View>
            <View className="gap-1.5">
              <T className="font-sans-bold text-sm">Tracking Number (optional)</T>
              <TextInput value={trackingNumber} onChangeText={setTrackingNumber} placeholder="GIG-44810273" className="h-12 rounded-xl border border-line-2 bg-surface px-3 font-sans text-base" />
            </View>
            <Pressable accessibilityRole="button" onPress={confirmShipment} disabled={!courierName.trim()} className={cx('h-[54px] items-center justify-center rounded-full bg-deep', !courierName.trim() && 'opacity-40')}>
              <T className="font-sans-bold text-base text-white">Confirm Shipped</T>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Refund Modal */}
      <Modal visible={refundOpen} transparent animationType="fade" onRequestClose={() => setRefundOpen(false)}>
        <View className="flex-1 justify-end">
          <Pressable accessibilityLabel="Keep order" onPress={() => setRefundOpen(false)} className="absolute inset-0 bg-[rgba(14,26,21,0.5)]" />
          <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }} className="gap-4 rounded-t-[28px] bg-surface px-5 pt-3">
            <Grip />
            <T className="font-display-x text-[22px]">Refund this order?</T>
            <T className="text-sm leading-[21px] text-muted-2">{formatNaira(totalAmountKobo / 100)} goes back to {customerName}'s card/account.</T>
            <View className="gap-1.5">
              <T className="font-sans-bold text-[13px]">Reason</T>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Reason, ${reason}`}
                onPress={() => setReasonOpen(true)}
                className="h-12 flex-row items-center justify-between rounded-xl border border-line-2 bg-surface px-3"
              >
                <T className="text-base">{reason}</T>
                <ChevronDown size={16} color="#5B6660" strokeWidth={2} />
              </Pressable>

              <SearchableSelectModal
                visible={reasonOpen}
                onClose={() => setReasonOpen(false)}
                title="Select Refund Reason"
                placeholder="Search reason..."
                items={REASONS.map((r) => ({ id: r, title: r }))}
                selectedId={reason}
                onSelect={(item) => setReason(item.id)}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={handleRefund}
              disabled={refundMutation.isPending}
              className="h-[54px] flex-row items-center justify-center gap-2 rounded-full bg-danger"
            >
              {refundMutation.isPending ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
              <T className="font-sans-bold text-base text-white">Refund {formatNaira(totalAmountKobo / 100)}</T>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setRefundOpen(false)} className="h-12 items-center justify-center rounded-full bg-cream">
              <T className="font-sans-bold text-base">Keep order</T>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
