import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, Lock } from 'lucide-react-native';
import { Screen, T, cx } from '@/components/ui';
import { Sparkle, goBack } from '@/features/seller/parts';
import { createProduct } from '@/api/products';
import { formatNaira } from '@/lib/format';
import { usePhotoDraft, parseNaira } from '@/features/products/usePhotoDraft';
import { ColourEditor, PhotoPicker, ReadingCard } from '@/features/products/PhotoDraftParts';
import { SearchableSelectModal } from '@/components/SearchableSelectModal';
import { STORE_CATEGORIES } from '@/data/categories';

const ghost = ['Product name', 'Price', 'Category', 'Description'];

function AiBadge({ label = 'AI' }: { label?: string }) {
  return (
    <View className="rounded-md bg-mint px-[7px] py-0.5">
      <T className="font-sans-bold text-[11px] text-green">{label}</T>
    </View>
  );
}

function Label({ text, badge }: { text: string; badge?: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <T className="font-sans-bold text-sm">{text}</T>
      <AiBadge label={badge} />
    </View>
  );
}

function DashedChip({ label, className, onPress }: { label: string; className?: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className={cx('min-h-[40px] justify-center rounded-xl border border-dashed border-[#C9A56A] bg-surface px-3', className)}>
      <T className="font-sans-bold text-sm text-[#3D2608]">{label}</T>
    </Pressable>
  );
}

export default function AddProduct() {
  const insets = useSafeAreaInsets();
  // Fields start empty: they're filled by the AI from the seller's own photos, or typed in.
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [stock, setStock] = useState('10');
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const draft = usePhotoDraft({
    onResult: (r) => {
      if (r.name) setName(r.name);
      if (r.priceNaira) setPrice(r.priceNaira);
      if (r.category) setCategory(r.category);
      if (r.description) setDesc(r.description);
      if (r.colours?.length) setColors(r.colours);
      setPriceRange(r.priceRange ?? null);
    },
  });

  const onPublish = async () => {
    if (!filled || submitting) return;
    const amount = parseNaira(price);
    if (!name.trim()) return setErrorMsg('Add a product name.');
    if (!amount) return setErrorMsg('Add a price.');
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await createProduct({
        name: name.trim(),
        price_kobo: Math.round(amount * 100),
        category: category || undefined,
        description: desc,
        stock_count: parseInt(stock, 10) || 0,
        status: 'live',
        images: draft.imageUrls,
        ...(colors.length ? { colors } : {}),
      } as any);
      router.dismissTo('/products');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not publish product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filled = draft.formOpen;
  const reading = draft.busy;

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-3 pb-2 pt-1">
        <Pressable accessibilityRole="button" onPress={() => goBack('/products')} className="h-11 justify-center px-2">
          <T className="font-sans-semibold text-base text-muted">Cancel</T>
        </Pressable>
        <T className="font-sans-bold text-[17px]">New product</T>
        <View className="w-[60px]" />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-3.5 px-5 pb-6 pt-3">
        <View className="flex-row items-center justify-between gap-2">
          <T className="flex-1 text-sm text-muted-2">Start with a photo. AI does the typing.</T>
        </View>

        {errorMsg ? (
          <View className="rounded-xl bg-red-100 p-3.5 border border-red-200">
            <T className="text-sm font-sans-medium text-red-800">{errorMsg}</T>
          </View>
        ) : null}

        <PhotoPicker photos={draft.photos} busy={draft.busy} onPick={draft.pick} onRemove={draft.removePhoto} />
        {draft.message ? <T className="text-[13px] text-danger">{draft.message}</T> : null}
        {draft.status === 'idle' && draft.photos.length === 0 ? (
          <Pressable accessibilityRole="button" onPress={draft.skip} className="self-center py-1">
            <T className="font-sans-semibold text-sm text-green">No photo yet? Fill it in yourself</T>
          </Pressable>
        ) : null}

        {reading ? <ReadingCard status={draft.status} onSkip={draft.skip} /> : null}

        {!filled ? (
          <View className="gap-2.5">
            {ghost.map((g) => (
              <View key={g} className="gap-2 rounded-[14px] border border-sand bg-surface px-3.5 py-3">
                <T className="font-sans-bold text-[11px] uppercase tracking-[0.9px] text-[#A7ADA9]">{g}</T>
                <View style={{ backgroundColor: reading ? '#DCE9E2' : '#ECE8DF' }} className="h-[9px] w-[55%] rounded-full" />
              </View>
            ))}
            <View className="flex-row items-center justify-center gap-2">
              <Lock size={15} color="#0B6E4F" strokeWidth={2} />
              <T className="font-sans-semibold text-sm text-muted">{reading ? 'Filling in from your photos…' : 'Add a photo to start'}</T>
            </View>
          </View>
        ) : (
          <View className="gap-3.5">
            {draft.status === 'done' ? (
              <View className="flex-row items-center justify-between gap-2 rounded-[14px] bg-mint px-3 py-2.5">
                <View className="flex-1 flex-row items-center gap-2">
                  <Sparkle size={15} />
                  <T className="font-sans-semibold text-[13px] text-deep">Filled in by Nina AI. Check it.</T>
                </View>
                <Pressable accessibilityRole="button" onPress={draft.analyse} hitSlop={6} className="h-8 justify-center rounded-full border border-[#9CC7B2] bg-surface px-3">
                  <T className="font-sans-bold text-xs text-green">Read again</T>
                </Pressable>
              </View>
            ) : null}

            <View className="gap-1.5">
              <Label text="Product name" />
              <TextInput value={name} onChangeText={setName} placeholder="e.g. Ankara wrap dress" placeholderTextColor="#8A928E" accessibilityLabel="Product name" className="h-[50px] rounded-[14px] border border-line-2 bg-surface px-3.5 font-sans text-base text-ink" />
            </View>

            <View className="flex-row gap-2.5">
              <View className="flex-1 gap-1.5">
                <Label text="Price" badge="Suggested" />
                <View className="h-[50px] flex-row items-center gap-1.5 rounded-[14px] border border-line-2 bg-surface px-3.5">
                  <T className="font-sans-bold">₦</T>
                  <TextInput value={price} onChangeText={setPrice} keyboardType="number-pad" accessibilityLabel="Price" className="h-full min-w-0 flex-1 font-sans-semibold text-base text-ink" />
                </View>
              </View>
              <View className="w-[140px] gap-1.5">
                <Label text="Category" />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Category, ${category}`}
                  onPress={() => setCategoryModalOpen(true)}
                  className="h-[50px] flex-row items-center justify-between rounded-[14px] border border-line-2 bg-surface px-3"
                >
                  <T className="text-[15px]" numberOfLines={1}>{category || 'Select'}</T>
                  <ChevronDown size={16} color="#5B6660" strokeWidth={2} />
                </Pressable>
              </View>
            </View>
            {priceRange ? <T className="-mt-1.5 text-xs text-muted">Nina's price range for this item: {formatNaira(priceRange[0])} – {formatNaira(priceRange[1])}</T> : null}

            <View className="gap-1.5">
              <Label text="Description" />
              <TextInput
                value={desc}
                onChangeText={setDesc}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                accessibilityLabel="Description"
                className="min-h-[88px] rounded-[14px] border border-line-2 bg-surface px-3.5 py-2.5 font-sans text-[15px] leading-[22px] text-ink"
              />
            </View>

            <View className="gap-2">
              <Label text="Colour" />
              <ColourEditor colours={colors} onChange={setColors} />
            </View>

            <View className="gap-2.5 rounded-2xl bg-peach p-3.5">
              <T className="font-sans-bold text-sm text-[#3D2608]">Stock quantity</T>
              <TextInput value={stock} onChangeText={setStock} keyboardType="number-pad" className="h-[44px] rounded-xl border border-line-2 bg-surface px-3 font-sans-semibold text-base" />
            </View>
          </View>
        )}
      </ScrollView>

      <SearchableSelectModal
        visible={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Select Category"
        subtitle="Choose category for this product"
        placeholder="Search category..."
        items={STORE_CATEGORIES.map((cat) => ({
          id: cat.id,
          title: cat.name,
          subtitle: cat.description,
          badge: cat.id,
        }))}
        selectedId={category}
        onSelect={(item) => setCategory(item.id)}
      />

      <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }} className="border-t border-line bg-bg px-5 pt-3">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !filled || submitting }}
          disabled={!filled || submitting}
          onPress={onPublish}
          className={cx('h-[54px] flex-row items-center justify-center gap-2 rounded-full', filled ? 'bg-green' : 'bg-[#BFD3C8]')}
        >
          {submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
          <T className="font-sans-bold text-[17px] text-white">{submitting ? 'Publishing...' : 'Save and publish'}</T>
        </Pressable>
      </View>
    </Screen>
  );
}
