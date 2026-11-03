import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Screen, T } from '@/components/ui';
import { BottomBar, Heading, Progress, StepHeader } from '@/features/setup/parts';
import { AiProductFlow, useAiProduct } from '@/features/setup/AiProductFlow';
import { useDraft, toSlug } from '@/features/setup/draft';
import { completeStoreSetup } from '@/api/store';
import { createProduct } from '@/api/products';

export default function FirstProduct() {
  const draft = useDraft();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const storeCreated = useRef(false);

  /**
   * Create the store once. Runs when the seller adds their first photo (the
   * photo upload and the AI need the login that store setup gives), or at
   * Finish / Skip.
   */
  const ensureStore = async (): Promise<boolean> => {
    if (storeCreated.current) return true;
    setErrorMsg(null);
    try {
      await completeStoreSetup({
        setup_token: draft.setup_token,
        name: draft.owner_name || draft.name || 'Frontstore Merchant',
        store_name: draft.name || 'My Store',
        username: toSlug(draft.name || 'mystore'),
        store_color: draft.color || '#0B6E4F',
        primary_color: draft.color || '#0B6E4F',
        category: draft.category || 'Fashion',
        country_code: draft.country_code || 'NG',
        currency_code: draft.currency_code || 'NGN',
        location: draft.city || draft.country_name || 'Nigeria',
        bank_code: draft.payout?.bankCode,
        bank_name: draft.payout?.bank,
        account_number: draft.payout?.account,
        account_name: draft.payout?.accountName,
      });
      storeCreated.current = true;
      return true;
    } catch (err: any) {
      console.warn('Store setup API error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Could not complete store setup. Please check details and try again.');
      return false;
    }
  };

  const flow = useAiProduct(ensureStore);
  const filled = flow.stage === 'filled';
  const price = Number(flow.product.price.replace(/[^\d.]/g, ''));
  const ready = filled && flow.product.name.trim().length > 0 && price > 0;

  const handleFinish = async (withProduct = false) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (!(await ensureStore())) return;
      if (withProduct && ready) {
        try {
          await createProduct({
            name: flow.product.name.trim(),
            price_kobo: Math.round(price * 100),
            stock_count: parseInt(flow.product.stock, 10) || 10,
            status: 'live',
            category: flow.product.category || draft.category || undefined,
            description: flow.product.description || '',
            images: flow.draft.imageUrls,
            colors: flow.product.colours,
          });
        } catch (prodErr: any) {
          // The store exists: let them in, and say the product didn't save.
          setErrorMsg(prodErr?.message || 'Your store is ready, but the product didn’t save. Add it again from Products.');
          router.replace('/live');
          return;
        }
      }
      router.replace('/live');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <StepHeader fallback="/payout" label="Step 5 of 5" right={{ title: 'Skip', onPress: () => handleFinish(false) }} />
        <Progress pct={100} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-3.5 px-5 pt-5 pb-6">
          <Heading title="Add your first product" sub="Snap a photo. Nina AI writes the name, price and description. You just check it." />
          {errorMsg ? (
            <View className="rounded-xl bg-red-100 p-3.5 border border-red-200">
              <T className="text-sm font-sans-medium text-red-800">{errorMsg}</T>
            </View>
          ) : null}
          <AiProductFlow flow={flow} />
        </ScrollView>
        <BottomBar className="border-t border-line bg-bg">
          {ready ? (
            <Button
              title={submitting ? 'Creating store...' : 'Add product and finish'}
              disabled={submitting}
              onPress={() => handleFinish(true)}
              left={submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : undefined}
            />
          ) : (
            <View
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              accessibilityLabel="Add product and finish"
              accessibilityHint={filled ? 'Add a name and price first' : 'Add a photo first'}
              className="h-14 items-center justify-center rounded-full bg-[#BFD3C8]"
            >
              <T className="font-sans-bold text-[17px] text-white">Add product and finish</T>
            </View>
          )}
        </BottomBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
