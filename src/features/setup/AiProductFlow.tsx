import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { ChevronDown, Lock } from 'lucide-react-native';
import { T, cx } from '@/components/ui';
import { SparkleIcon } from './parts';
import { SearchableSelectModal } from '@/components/SearchableSelectModal';
import { STORE_CATEGORIES } from '@/data/categories';
import { usePhotoDraft } from '@/features/products/usePhotoDraft';
import { ColourEditor, PhotoPicker, ReadingCard } from '@/features/products/PhotoDraftParts';

export type AiStage = 'empty' | 'reading' | 'filled';

const GHOST = ['Product name', 'Price', 'Category', 'Description'];
const SIZES = ['S', 'M', 'L', 'XL'];

export type AiProduct = {
  name: string; price: string; category: string; description: string; colours: string[]; sizes: string[]; stock: string;
};

const EMPTY: AiProduct = { name: '', price: '', category: '', description: '', colours: [], sizes: [], stock: '' };

/**
 * Photo-first product flow: the seller's real photos are uploaded and read
 * by the AI, then they check the result (or fill it in themselves).
 * `prepare` runs before the first upload.
 */
export function useAiProduct(prepare?: () => Promise<boolean>) {
  const [product, setProduct] = useState<AiProduct>(EMPTY);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const draft = usePhotoDraft({
    prepare,
    onResult: (r) => {
      setProduct((p) => ({
        ...p,
        name: r.name || p.name,
        price: r.priceNaira ? Number(r.priceNaira).toLocaleString('en-NG') : p.price,
        category: r.category || p.category,
        description: r.description || p.description,
        colours: r.colours?.length ? r.colours : p.colours,
      }));
      setPriceRange(r.priceRange ?? null);
    },
  });
  const stage: AiStage = draft.formOpen ? 'filled' : draft.busy ? 'reading' : 'empty';
  const update = (patch: Partial<AiProduct>) => setProduct((p) => ({ ...p, ...patch }));
  return { stage, product, update, draft, priceRange };
}

type Flow = ReturnType<typeof useAiProduct>;

function Tag({ label }: { label: string }) {
  return (
    <View className="rounded-md bg-mint px-[7px] py-0.5">
      <T className="font-sans-bold text-[11px] text-green">{label}</T>
    </View>
  );
}

function FieldLabel({ label, tag }: { label: string; tag: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <T className="font-sans-bold text-sm">{label}</T>
      <Tag label={tag} />
    </View>
  );
}

function Ghost({ stage }: { stage: AiStage }) {
  const bar = stage === 'reading' ? '#DCE9E2' : '#ECE8DF';
  return (
    <View className="gap-2.5">
      {GHOST.map((g) => (
        <View key={g} className="gap-2 rounded-[14px] border border-sand bg-surface px-3.5 py-3">
          <T className="font-sans-bold text-[11px] uppercase tracking-[0.9px] text-[#A7ADA9]">{g}</T>
          <View style={{ backgroundColor: bar }} className="h-[9px] w-[55%] rounded-full" />
        </View>
      ))}
      <View className="flex-row items-center justify-center gap-2">
        <Lock size={15} color="#0B6E4F" strokeWidth={2} />
        <T className="font-sans-semibold text-sm text-muted">
          {stage === 'reading' ? 'Filling in from your photos…' : 'Add a photo to start'}
        </T>
      </View>
    </View>
  );
}

const inputBox = 'rounded-[14px] border border-line-2 bg-surface';

function FilledForm({ product: p, update, onRedo, fromAi, priceRange }: { product: AiProduct; update: Flow['update']; onRedo: () => void; fromAi: boolean; priceRange: [number, number] | null }) {
  const [sizesOpen, setSizesOpen] = useState(p.sizes.length > 0);
  const [stockOpen, setStockOpen] = useState(p.stock.length > 0);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const setPrice = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 9);
    update({ price: digits ? Number(digits).toLocaleString('en-NG') : '' });
  };
  const toggleSize = (s: string) =>
    update({ sizes: p.sizes.includes(s) ? p.sizes.filter((x) => x !== s) : [...p.sizes, s] });

  return (
    <View className="gap-3.5">
      {fromAi ? (
        <View className="flex-row items-center justify-between gap-2 rounded-[14px] bg-mint px-3 py-2.5">
          <View className="shrink flex-row items-center gap-2">
            <SparkleIcon size={15} color="#0B6E4F" />
            <T className="shrink font-sans-semibold text-[13px] text-deep">Filled in by Nina AI. Check it.</T>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onRedo}
            hitSlop={{ top: 6, bottom: 6 }}
            className="h-8 justify-center rounded-full border border-[#9CC7B2] bg-surface px-3"
          >
            <T className="font-sans-bold text-xs text-green">Read again</T>
          </Pressable>
        </View>
      ) : null}

      <View className="gap-1.5">
        <FieldLabel label="Product name" tag="AI" />
        <TextInput
          value={p.name}
          onChangeText={(v) => update({ name: v })}
          placeholder="e.g. Ankara wrap dress"
          accessibilityLabel="Product name"
          placeholderTextColor="#8A928E"
          className={cx(inputBox, 'h-[50px] px-3.5 font-sans text-base text-ink')}
        />
      </View>

      <View className="flex-row gap-2.5">
        <View className="flex-1 gap-1.5">
          <FieldLabel label="Price" tag="Suggested" />
          <View className={cx(inputBox, 'h-[50px] flex-row items-center gap-1.5 px-3.5')}>
            <T className="font-sans-bold text-base">₦</T>
            <TextInput
              value={p.price}
              onChangeText={setPrice}
              keyboardType="number-pad"
              accessibilityLabel="Price"
              className="h-full flex-1 font-sans-semibold text-base text-ink"
            />
          </View>
        </View>
        <View className="w-[140px] gap-1.5">
          <FieldLabel label="Category" tag="AI" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Category: ${p.category}`}
            onPress={() => setCategoryModalOpen(true)}
            className={cx(inputBox, 'h-[50px] flex-row items-center justify-between px-3')}
          >
            <T className="text-[15px]" numberOfLines={1}>{p.category || 'Select'}</T>
            <ChevronDown size={16} color="#5B6660" strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <SearchableSelectModal
        visible={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Select Category"
        subtitle="Choose the best category for this item"
        placeholder="Search categories..."
        items={STORE_CATEGORIES.map((cat) => ({
          id: cat.id,
          title: cat.name,
          subtitle: cat.description,
          badge: cat.id,
        }))}
        selectedId={p.category}
        onSelect={(item) => update({ category: item.id })}
      />
      {priceRange ? <T className="-mt-1.5 text-xs text-muted">Nina's price range for this item: ₦{priceRange[0].toLocaleString('en-NG')} – ₦{priceRange[1].toLocaleString('en-NG')}</T> : null}

      <View className="gap-1.5">
        <FieldLabel label="Description" tag="AI" />
        <TextInput
          value={p.description}
          onChangeText={(v) => update({ description: v })}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          accessibilityLabel="Description"
          className={cx(inputBox, 'min-h-[88px] px-3.5 py-2.5 font-sans text-[15px] leading-[22px] text-ink')}
        />
      </View>

      <View className="gap-2">
        <FieldLabel label="Colour" tag="AI" />
        <ColourEditor colours={p.colours} onChange={(colours) => update({ colours })} />
      </View>

      <View className="gap-2.5 rounded-2xl bg-peach p-3.5">
        <T className="font-sans-bold text-sm text-[#3D2608]">Add what a photo can't show</T>
        <View className="flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: sizesOpen }}
            onPress={() => setSizesOpen(!sizesOpen)}
            className="rounded-xl border border-dashed border-[#C9A56A] bg-surface px-3 py-[9px]"
          >
            <T className="font-sans-bold text-sm text-[#3D2608]">{p.sizes.length ? `Sizes: ${p.sizes.join(', ')}` : '+ Sizes'}</T>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: stockOpen }}
            onPress={() => setStockOpen(!stockOpen)}
            className="flex-1 rounded-xl border border-dashed border-[#C9A56A] bg-surface px-3 py-[9px]"
          >
            <T className="font-sans-bold text-sm text-[#3D2608]">{p.stock ? `${p.stock} in stock` : '+ How many in stock'}</T>
          </Pressable>
        </View>
        {sizesOpen ? (
          <View className="flex-row gap-2">
            {SIZES.map((s) => {
              const on = p.sizes.includes(s);
              return (
                <Pressable
                  key={s}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() => toggleSize(s)}
                  className={cx('h-11 min-w-[44px] items-center justify-center rounded-xl px-3', on ? 'bg-ink' : 'border border-[#C9A56A] bg-surface')}
                >
                  <T className={cx('font-sans-bold text-sm', on ? 'text-bg' : 'text-[#3D2608]')}>{s}</T>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        {stockOpen ? (
          <TextInput
            value={p.stock}
            onChangeText={(v) => update({ stock: v.replace(/\D/g, '').slice(0, 5) })}
            keyboardType="number-pad"
            placeholder="How many in stock"
            placeholderTextColor="#8A928E"
            accessibilityLabel="How many in stock"
            className="h-11 rounded-xl border border-[#C9A56A] bg-surface px-3 font-sans text-base text-ink"
          />
        ) : null}
      </View>
    </View>
  );
}

/** The photo picker + AI states. Render inside a ScrollView. */
export function AiProductFlow({ flow }: { flow: Flow }) {
  const { stage, product, update, draft, priceRange } = flow;
  return (
    <>
      <PhotoPicker photos={draft.photos} busy={draft.busy} onPick={draft.pick} onRemove={draft.removePhoto} />
      {draft.message ? <T className="text-[13px] text-danger">{draft.message}</T> : null}
      {stage === 'empty' && draft.photos.length === 0 ? (
        <Pressable accessibilityRole="button" onPress={draft.skip} className="self-center py-1">
          <T className="font-sans-semibold text-sm text-green">No photo yet? Fill it in yourself</T>
        </Pressable>
      ) : null}
      {stage === 'reading' ? <ReadingCard status={draft.status} onSkip={draft.skip} /> : null}
      {stage === 'filled'
        ? <FilledForm product={product} update={update} onRedo={draft.analyse} fromAi={draft.status === 'done'} priceRange={priceRange} />
        : <Ghost stage={stage} />}
    </>
  );
}
