import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock } from 'lucide-react-native';
import { Button, Screen, T } from '@/components/ui';
import { AccountHeader, BottomSheet, DashedAdd } from '@/features/buyer/account';
import { getSavedCards, deleteSavedCard, setDefaultSavedCard, initializeCardTokenization } from '@/api/buyer';
import { SavedCard } from '@/api/types';

export default function BuyerCards() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tokenizing, setTokenizing] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const { data: liveCards = [] } = useQuery({ queryKey: ['buyer-cards'], queryFn: getSavedCards });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSavedCard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-cards'] });
    },
  });

  const defaultMutation = useMutation({
    mutationFn: (id: number) => setDefaultSavedCard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-cards'] });
    },
  });

  const list: SavedCard[] = liveCards;

  const toSecurePage = async () => {
    setTokenizing(true);
    setTokenError(null);
    try {
      const res = await initializeCardTokenization();
      const authUrl = res?.authorization_url || (res as any)?.data?.authorization_url;
      if (authUrl) {
        await Linking.openURL(authUrl);
      }
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['buyer-cards'] });
    } catch (err: any) {
      setTokenError(err.message || 'Could not initialize Paystack card verification.');
    } finally {
      setTokenizing(false);
    }
  };

  return (
    <Screen>
      <AccountHeader title="Payment cards" />
      <ScrollView contentContainerClassName="gap-3 px-4 pt-2" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {list.map((c) => {
          const isDef = c.is_default;
          const bg = c.brand.toLowerCase() === 'visa' ? '#0E1A15' : '#0B6E4F';
          return (
            <View key={c.id} className="gap-2">
              <View
                accessible
                accessibilityLabel={`${c.brand} ending ${c.last4}, expires ${c.exp_month}/${c.exp_year}${isDef ? ', default' : ''}`}
                style={{ backgroundColor: bg }}
                className="h-[180px] justify-between rounded-[20px] p-[18px]"
              >
                <View className="flex-row items-center justify-between">
                  <T className="font-display text-lg text-bg">{c.brand}</T>
                  {isDef ? (
                    <View className="rounded-full bg-gold px-[9px] py-[3px]">
                      <T className="font-display-x text-[11px] text-[#2A1B05]">Default</T>
                    </View>
                  ) : null}
                </View>
                <T numberOfLines={1} className="font-display text-lg tracking-[1.44px] text-bg">•••• •••• •••• {c.last4}</T>
                <View className="flex-row justify-between">
                  <T className="text-xs text-on-dark">CARDHOLDER</T>
                  <T className="text-xs text-on-dark">Exp {c.exp_month}/{c.exp_year}</T>
                </View>
              </View>
              <View className="flex-row gap-4 px-1">
                {!isDef ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={`Make ${c.brand} ${c.last4} default`} hitSlop={12} onPress={() => defaultMutation.mutate(typeof c.id === 'number' ? c.id : Number(c.id))}>
                    <T className="font-sans-bold text-sm text-green">Make default</T>
                  </Pressable>
                ) : null}
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${c.brand} ${c.last4}`} hitSlop={12} onPress={() => deleteMutation.mutate(typeof c.id === 'number' ? c.id : Number(c.id))}>
                  <T className="font-sans-bold text-sm text-danger">Remove</T>
                </Pressable>
              </View>
            </View>
          );
        })}
        <DashedAdd label="+ Add a card" onPress={() => setOpen(true)} />
        <View className="flex-row items-start gap-2.5 rounded-2xl bg-mint px-4 py-3.5">
          <View className="pt-0.5">
            <Lock size={16} color="#0B6E4F" strokeWidth={2} />
          </View>
          <T className="flex-1 text-sm leading-[21px] text-deep">
            Cards are saved by Paystack. Frontstore never sees or stores your full card number. You approve every payment with your bank.
          </T>
        </View>
      </ScrollView>

      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <T className="font-display text-xl">Add a card</T>
        <T className="text-[15px] leading-[22px] text-muted-2">
          You’ll enter your card on Paystack’s secure page. We’ll charge ₦50 to check it and refund it straight away.
        </T>
        {tokenError ? (
          <View className="rounded-xl bg-danger/10 p-2.5">
            <T className="text-xs font-bold text-danger">{tokenError}</T>
          </View>
        ) : null}
        {tokenizing ? (
          <View className="h-[54px] items-center justify-center rounded-full bg-deep">
            <ActivityIndicator color="#fff" />
          </View>
        ) : (
          <Button title="Continue to secure page" className="h-[54px]" textClassName="text-base" onPress={toSecurePage} />
        )}
        <Pressable accessibilityRole="button" onPress={() => setOpen(false)} className="h-11 items-center justify-center">
          <T className="font-sans-bold text-[15px] text-muted">Not now</T>
        </Pressable>
      </BottomSheet>
    </Screen>
  );
}
