import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { Landmark } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, T, cx } from '@/components/ui';
import { BackHeader, Grip, Tag } from '@/features/seller/parts';
import { getWalletBalance, getPayoutHistory, requestWithdrawal, sendWithdrawalOtp } from '@/api/orders';
import { formatNaira } from '@/lib/format';

const payoutStyle: Record<string, [string, string, string]> = {
  paid: ['Paid', '#CFE8DC', '#07261C'],
  processing: ['Processing', '#F3E3C7', '#6B4210'],
  failed: ['Failed - retrying', '#FBE7E2', '#A8321E'],
};

export default function Payouts() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [otpModal, setOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: getWalletBalance,
  });

  const { data: history } = useQuery({
    queryKey: ['payout-history'],
    queryFn: getPayoutHistory,
  });

  const withdrawMutation = useMutation({
    mutationFn: () => requestWithdrawal(availKobo, otpCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['payout-history'] });
      setOtpModal(false);
      setOtpCode('');
      setSubmitting(false);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Withdrawal failed. Please check OTP.');
      setSubmitting(false);
    },
  });

  const handlePayOutNow = async () => {
    try {
      await sendWithdrawalOtp();
    } catch {
      // Proceed to modal anyway
    }
    setOtpModal(true);
  };

  const confirmWithdrawal = () => {
    if (submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    withdrawMutation.mutate();
  };

  const availKobo = wallet?.available_balance_kobo ?? 0;
  const pendingKobo = wallet?.pending_balance_kobo ?? 0;
  const bankName = wallet?.bank_name || 'Bank account';
  const accNo = wallet?.account_number ? `••••${wallet.account_number.slice(-4)}` : 'Not linked';
  const accHolder = wallet?.account_name || 'Payout Account';

  return (
    <Screen>
      <BackHeader title="Payouts" fallback="/home" />
      <ScrollView contentContainerClassName="gap-3.5 px-4 pb-8 pt-2">
        <View className="gap-2 rounded-[24px] bg-ink p-[22px]">
          <T className="text-[13px] text-on-dark-2">Available to pay out</T>
          <T className="font-display-x text-[38px] tracking-[-0.8px] text-bg">{formatNaira(availKobo / 100)}</T>
          <T className="text-[13px] text-on-dark">Pending {formatNaira(pendingKobo / 100)} · Auto payout next 10:00am</T>
          <Pressable accessibilityRole="button" onPress={handlePayOutNow} className="mt-2 h-12 items-center justify-center rounded-full bg-gold">
            <T className="font-sans-bold text-base text-[#2A1B05]">Pay out now</T>
          </Pressable>
        </View>

        <View className="flex-row items-center gap-3 rounded-[20px] border border-line bg-surface px-4 py-3.5">
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-mint">
            <Landmark size={20} color="#0B6E4F" strokeWidth={2} />
          </View>
          <View className="flex-1">
            <T className="font-sans-bold text-[15px]">{accHolder}</T>
            <T className="text-[13px] text-muted-2">{bankName} · {accNo}</T>
          </View>
          <Link href="/payout" asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="Change payout account" hitSlop={4} className="h-10 justify-center rounded-full border border-line-2 px-3">
              <T className="font-sans-bold text-[13px]">Change</T>
            </Pressable>
          </Link>
        </View>

        <View className="flex-row items-baseline justify-between pt-1">
          <T className="font-sans-bold text-[17px]">History</T>
          <T className="text-[13px] text-muted">Paystack transfer fees apply</T>
        </View>
        <View className="rounded-[20px] border border-line bg-surface">
          {history && history.length > 0 ? (
            history.map((r, i) => {
              const [label, bg, fg] = payoutStyle[r.status] || payoutStyle.paid;
              return (
                <View key={i} className={cx('flex-row items-center justify-between px-4 py-3.5', i < history.length - 1 && 'border-b border-[#F0ECE3]')}>
                  <View className="gap-0.5">
                    <T className="font-sans-bold text-[15px]">{formatNaira(r.amount_kobo / 100)}</T>
                    <T className="text-xs text-muted">{r.date} · {r.orders_count} orders</T>
                  </View>
                  <Tag label={label} bg={bg} fg={fg} />
                </View>
              );
            })
          ) : (
            <View className="p-4 items-center">
              <T className="text-sm text-muted">No payout history yet.</T>
            </View>
          )}
        </View>
      </ScrollView>

      {/* OTP Confirmation Modal */}
      <Modal visible={otpModal} transparent animationType="fade" onRequestClose={() => setOtpModal(false)}>
        <View className="flex-1 justify-end">
          <Pressable onPress={() => setOtpModal(false)} className="absolute inset-0 bg-[rgba(14,26,21,0.5)]" />
          <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }} className="gap-4 rounded-t-[28px] bg-surface px-5 pt-3">
            <Grip />
            <T className="font-display-x text-[22px]">Confirm payout</T>
            <T className="text-sm text-muted-2">Enter the OTP sent to your WhatsApp or email to authorize withdrawal of {formatNaira(availKobo / 100)}.</T>

            {errorMsg ? (
              <View className="rounded-xl bg-red-100 p-3 border border-red-200">
                <T className="text-xs font-sans-medium text-red-800">{errorMsg}</T>
              </View>
            ) : null}

            <View className="gap-1.5">
              <T className="font-sans-bold text-sm">6-digit OTP code</T>
              <TextInput
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="123456"
                className="h-12 rounded-xl border border-line-2 bg-surface px-3 font-sans-bold text-lg tracking-widest text-center"
              />
            </View>

            <Pressable accessibilityRole="button" onPress={confirmWithdrawal} disabled={submitting || otpCode.length < 6} className="h-[54px] flex-row items-center justify-center gap-2 rounded-full bg-gold">
              {submitting ? <ActivityIndicator color="#2A1B05" size="small" /> : null}
              <T className="font-sans-bold text-base text-[#2A1B05]">{submitting ? 'Processing...' : 'Authorize Payout'}</T>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
