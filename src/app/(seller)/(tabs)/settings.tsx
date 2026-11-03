import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Truck, X } from 'lucide-react-native';
import { Button, Screen, T, cx } from '@/components/ui';
import { BottomSheet, SheetField } from '@/features/buyer/account';
import { PrivacyRows } from '@/features/account/PrivacyRows';
import { naira } from '@/lib/format';
import { getMe } from '@/api/auth';
import { getStore } from '@/api/store';
import { getWalletBalance } from '@/api/orders';
import { apiGet } from '@/api/client';
import { planName, signOut, updateStore } from '@/api/account';

type Row = { label: string; value?: string; href?: Href; onPress?: () => void };

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

function Rows({ rows }: { rows: Row[] }) {
  return (
    <View className="rounded-[22px] border border-line bg-surface">
      {rows.map((r, i) => (
        <Pressable
          key={r.label}
          accessibilityRole="button"
          accessibilityLabel={r.value ? `${r.label}, ${r.value}` : r.label}
          disabled={!r.href && !r.onPress}
          onPress={() => (r.href ? router.push(r.href) : r.onPress?.())}
          className={cx('min-h-[52px] flex-row items-center gap-3.5 px-4', i < rows.length - 1 && 'border-b border-[#F0ECE3]')}
        >
          <T className="flex-1 font-sans-semibold text-[15px]">{r.label}</T>
          {r.value ? <T className="text-sm text-muted">{r.value}</T> : null}
          {r.href || r.onPress ? <ChevronRight size={16} color="#8A918D" strokeWidth={2} /> : null}
        </Pressable>
      ))}
    </View>
  );
}

export default function Settings() {
  const qc = useQueryClient();
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [flatFee, setFlatFee] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const { data: store } = useQuery({ queryKey: ['seller-store'], queryFn: getStore });
  const { data: wallet } = useQuery({ queryKey: ['seller-wallet'], queryFn: getWalletBalance });
  const { data: platform } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => apiGet<{ support_email?: string; support_whatsapp?: string }>('/public/settings'),
    staleTime: 1000 * 60 * 60,
  });

  const s: any = store ?? me?.store ?? (me?.user as any)?.store ?? {};
  const user: any = me?.user ?? {};
  const storeName = s.store_name || s.name || 'My Store';
  const storeSlug = s.username || s.slug || '';
  const storeColor = s.primary_color || '#0F172A';
  const savedFee = s.shipping_flat_fee != null ? String(Math.round(Number(s.shipping_flat_fee))) : '';

  useEffect(() => {
    setFlatFee(savedFee);
  }, [savedFee]);

  // Real plan from the server. No in-app purchases: plans are managed in the seller's Frontstore account.
  const plan = planName(user.plan);
  const planLine =
    user.plan_source === 'trial' && user.plan_expires_at
      ? `Free trial until ${fmtDate(user.plan_expires_at)}`
      : user.plan_expires_at
        ? `Paid until ${fmtDate(user.plan_expires_at)}`
        : plan === 'Free'
          ? 'No monthly fee'
          : 'Renews automatically';

  const supportWa = (platform?.support_whatsapp || '').replace(/\D/g, '');
  const supportEmail = platform?.support_email || 'hello@frontstore.ng';

  const saveFee = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await updateStore({ shipping_flat_fee: flatFee.trim() === '' ? null : Number(flatFee) });
      await qc.invalidateQueries({ queryKey: ['seller-store'] });
      setDeliveryOpen(false);
    } catch (e: any) {
      setSaveError(e?.message || 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const storeRows: Row[] = [
    { label: 'Payouts', value: wallet ? naira(wallet.balance) : undefined, href: '/payouts' },
    { label: 'Delivery fee', value: savedFee ? naira(Number(savedFee)) : 'Not set', onPress: () => setDeliveryOpen(true) },
    { label: 'Store look', href: '/store-style' },
    { label: 'Share store and QR code', href: '/share' },
  ];
  const accountRows: Row[] = [
    { label: 'Switch to buyer view', href: '/switch' },
    { label: 'WhatsApp number', value: s.whatsapp_phone || user.phone_number || 'Not set' },
    { label: 'Email', value: user.email || 'Not set' },
  ];

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-4 px-5 pb-8 pt-3">
        <T className="font-display text-[32px] tracking-[-0.6px]">Store</T>

        <View className="flex-row items-center gap-3.5 rounded-[22px] border border-line bg-surface p-4">
          <View style={{ backgroundColor: storeColor }} className="h-14 w-14 items-center justify-center rounded-2xl">
            <T className="font-display text-[22px] text-white">{storeName[0] || 'S'}</T>
          </View>
          <View className="flex-1 gap-0.5">
            <T className="font-sans-bold text-[17px]">{storeName}</T>
            {storeSlug ? <T className="text-[13px] text-muted">frontstore.app/{storeSlug}</T> : null}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Edit store" hitSlop={4} onPress={() => router.push('/store-style')} className="h-10 justify-center rounded-full border border-line-2 px-3.5">
            <T className="font-sans-bold text-[13px]">Edit</T>
          </Pressable>
        </View>

        <View className="gap-0.5 rounded-[22px] bg-deep p-4">
          <T className="font-sans-bold text-bg">{plan} plan</T>
          <T className="text-[13px] text-on-dark">{planLine}</T>
        </View>

        <T className="font-sans-bold text-xs uppercase tracking-wider text-muted">Your store</T>
        <Rows rows={storeRows} />

        <T className="font-sans-bold text-xs uppercase tracking-wider text-muted">Account</T>
        <Rows rows={accountRows} />

        <T className="font-sans-bold text-xs uppercase tracking-wider text-muted">Privacy</T>
        <View className="overflow-hidden rounded-[22px] border border-line bg-surface">
          <PrivacyRows kind="seller" />
        </View>

        <View className="rounded-[22px] border border-line bg-surface">
          <Pressable
            accessibilityRole="link"
            onPress={() => Linking.openURL(supportWa ? `https://wa.me/${supportWa}` : `mailto:${supportEmail}`)}
            className="min-h-[52px] flex-row items-center justify-between border-b border-[#F0ECE3] px-4"
          >
            <T className="font-sans-semibold text-[15px]">{supportWa ? 'Help on WhatsApp' : 'Email support'}</T>
            <ChevronRight size={16} color="#8A918D" strokeWidth={2} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={loggingOut}
            onPress={async () => {
              setLoggingOut(true);
              await signOut();
            }}
            className="min-h-[52px] justify-center px-4"
          >
            <T className="font-sans-bold text-[15px] text-danger">{loggingOut ? 'Logging out…' : 'Log out'}</T>
          </Pressable>
        </View>
      </ScrollView>

      <BottomSheet visible={deliveryOpen} onClose={() => !saving && setDeliveryOpen(false)}>
        <View className="gap-3 py-1">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Truck size={20} color="#0B6E4F" />
              <T className="font-display text-xl">Delivery fee</T>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} onPress={() => setDeliveryOpen(false)}>
              <X size={20} color="#0E1A15" />
            </Pressable>
          </View>
          <T className="text-sm text-muted-2">One flat fee added to every delivery order at checkout. Leave it empty for no fee. Set fees by area on the web dashboard.</T>
          <SheetField label="Flat delivery fee (₦)" keyboardType="numeric" value={flatFee} onChangeText={(v) => setFlatFee(v.replace(/[^\d]/g, ''))} placeholder="e.g. 2500" />
          {saveError ? <T className="text-[13px] text-danger">{saveError}</T> : null}
          <Button title={saving ? 'Saving…' : 'Save delivery fee'} className="h-[50px]" disabled={saving || flatFee === savedFee} onPress={saveFee} />
        </View>
      </BottomSheet>
    </Screen>
  );
}
