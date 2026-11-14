import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, ChevronDown, Lock } from 'lucide-react-native';
import { Screen, T, cx } from '@/components/ui';
import { Sparkle, goBack } from '@/features/seller/parts';
import { createProduct } from '@/api/products';
import { usePhotoDraft } from '@/features/products/usePhotoDraft';
import { ColourChips } from '@/features/products/ColourChips';
import { formatNaira } from '@/lib/format';
import { SearchableSelectModal } from '@/components/SearchableSelectModal';
import { useCategories } from '@/features/products/useCategories';

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

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [stock, setStock] = useState('');

  const categories = useCategories();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const photoDraft = usePhotoDraft((d) => {
    if (d.title) setName(d.title);
    if (d.suggested_price_kobo) setPrice(String(Math.round(d.suggested_price_kobo / 100)));
    if (d.category_id) setCategory(d.category_id);
    if (d.description) setDesc(d.description);
    if (d.colors?.length) setColors(d.colors);
  });
  const { stage, pick: pickImages } = photoDraft;
  const photos = photoDraft.photos.map((p) => p.uri);

  const onPublish = async () => {
    if (stage !== 'filled' || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const numericPriceKobo = Math.round(parseFloat(price.replace(/,/g, '')) * 100);
      if (!name.trim() || !numericPriceKobo) {
        setErrorMsg('Add a name and price first.');
        return;
      }
      await createProduct({
        name,
        price_kobo: numericPriceKobo,
        category_id: category || null,
        description: desc,
        stock_count: parseInt(stock, 10) || 1,
        status: 'live',
        images: photoDraft.imageUrls,
        sizes,
        colors,
      });
      router.dismissTo('/products');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not publish product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filled = stage === 'filled';
  const reading = stage === 'reading';

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

        {photoDraft.error && !filled ? <T className="text-sm text-danger">{photoDraft.error}</T> : null}

        {errorMsg ? (
          <View className="rounded-xl bg-red-100 p-3.5 border border-red-200">
            <T className="text-sm font-sans-medium text-red-800">{errorMsg}</T>
          </View>
        ) : null}

        {stage === 'empty' ? (
          <Pressable
            accessibilityRole="button"
            onPress={pickImages}
            className="h-[210px] items-center justify-center gap-2.5 rounded-[22px] border-2 border-dashed border-[#B9B1A0] bg-surface"
          >
            <View className="h-14 w-14 items-center justify-center rounded-full bg-mint">
              <Camera size={26} color="#0B6E4F" strokeWidth={2} />
            </View>
            <T className="font-sans-bold text-base text-[#33403A]">Take a photo or choose from gallery</T>
            <T className="text-[13px] text-muted">Up to 3 photos · Nina AI fills in the rest</T>
          </Pressable>
        ) : (
          <View className="flex-row gap-2">
            {photos.map((uri, idx) => (
              <View key={idx} className="h-[92px] w-[92px] overflow-hidden rounded-2xl bg-saffron">
                <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
                {idx === 0 ? (
                  <View className="absolute bottom-1.5 left-1.5 rounded-full bg-surface px-[7px] py-0.5">
                    <T className="font-sans-bold text-[10px]">Cover</T>
                  </View>
                ) : null}
              </View>
            ))}
            {photos.length < 3 ? (
              <Pressable accessibilityRole="button" onPress={pickImages} className="h-[92px] flex-1 items-center justify-center rounded-2xl border-[1.5px] border-dashed border-[#B9B1A0] bg-surface">
                <T className="text-[22px] text-muted">+</T>
              </Pressable>
            ) : null}
          </View>
        )}

        {reading ? (
          <View accessibilityLiveRegion="polite" className="gap-2.5 rounded-[20px] bg-ink p-4">
            <View className="flex-row items-center gap-2">
              <Sparkle size={16} color="#6FD3A4" />
              <T className="font-sans-bold text-[15px] text-bg">Nina AI is reading your photos…</T>
            </View>
            <View className="h-1.5 overflow-hidden rounded-full bg-[#33504A]">
              <View className="h-1.5 w-[64%] rounded-full bg-leaf" />
            </View>
            <T className="text-sm text-on-dark">Looking at the item, brand and colour</T>
            <T className="text-sm text-on-dark-2">… Checking prices in Nigeria</T>
            <Pressable accessibilityRole="button" onPress={photoDraft.skip} className="h-[38px] justify-center self-start rounded-full border border-[rgba(246,243,236,0.3)] px-3.5">
              <T className="font-sans-semibold text-[13px] text-bg">Skip - fill in myself</T>
            </Pressable>
          </View>
        ) : null}

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
              <T className="font-sans-semibold text-sm text-muted">{reading ? 'Filling in from your photos…' : 'Add a photo to unlock the form'}</T>
            </View>
          </View>
        ) : (
          <View className="gap-3.5">
            <View className="flex-row items-center justify-between gap-2 rounded-[14px] bg-mint px-3 py-2.5">
              <View className="flex-1 flex-row items-center gap-2">
                <Sparkle size={15} />
                <T className="flex-1 font-sans-semibold text-[13px] text-deep">{photoDraft.error ?? (name ? 'Filled in by Nina AI. Check it.' : 'Fill in the details.')}</T>
              </View>
              <Pressable accessibilityRole="button" onPress={photoDraft.reread} hitSlop={6} className="h-8 justify-center rounded-full border border-[#9CC7B2] bg-surface px-3">
                <T className="font-sans-bold text-xs text-green">Read again</T>
              </Pressable>
            </View>

            <View className="gap-1.5">
              <Label text="Product name" />
              <TextInput value={name} onChangeText={setName} accessibilityLabel="Product name" className="h-[50px] rounded-[14px] border border-line-2 bg-surface px-3.5 font-sans text-base text-ink" />
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
                  accessibilityLabel={`Category, ${categories.nameOf(category) || 'not set'}`}
                  onPress={() => setCategoryModalOpen(true)}
                  className="h-[50px] flex-row items-center justify-between rounded-[14px] border border-line-2 bg-surface px-3"
                >
                  <T className="text-[15px]" numberOfLines={1}>{categories.nameOf(category) || 'Select'}</T>
                  <ChevronDown size={16} color="#5B6660" strokeWidth={2} />
                </Pressable>
              </View>
            </View>

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
              <ColourChips value={colors} onChange={setColors} />
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
        items={categories.items}
        selectedId={category}
        onSelect={(item) => setCategory(item.id)}
      />

      <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }} className="border-t border-line bg-bg px-5 pt-3">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !filled || submitting }}
          disabled={!filled || submitting}
          onPress={onPublish}
          className={cx('h-[54px] flex-row items-center justify-center gap-2 rounded-full', filled ? 'bg-deep' : 'bg-[#BFD3C8]')}
        >
          {submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
          <T className="font-sans-bold text-[17px] text-white">{submitting ? 'Publishing...' : 'Save and publish'}</T>
        </Pressable>
      </View>
    </Screen>
  );
}
