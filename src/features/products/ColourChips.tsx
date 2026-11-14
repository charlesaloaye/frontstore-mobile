import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { T, cx } from '@/components/ui';

const QUICK = ['Black', 'White', 'Red', 'Blue', 'Navy', 'Green', 'Brown', 'Pink', 'Gold', 'Grey'];
const MAX = 8;

/**
 * Product colours: tap a chip to remove it, "+ Add" for quick picks or a
 * typed name. Each colour becomes a variant (with sizes, one per size).
 */
export function ColourChips({ value, onChange }: { value: string[]; onChange: (colours: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [typed, setTyped] = useState('');

  const add = (c: string) => {
    const name = c.trim().replace(/\s+/g, ' ').slice(0, 50);
    if (name && !value.some((v) => v.toLowerCase() === name.toLowerCase()) && value.length < MAX) onChange([...value, name]);
    setTyped('');
  };

  return (
    <View className="gap-2">
      <View className="flex-row flex-wrap gap-2">
        {value.map((c) => (
          <Pressable
            key={c}
            accessibilityRole="button"
            accessibilityLabel={`${c}, remove colour`}
            onPress={() => onChange(value.filter((v) => v !== c))}
            className="flex-row items-center gap-1.5 rounded-xl bg-ink px-3.5 py-[9px]"
          >
            <T className="font-sans-bold text-sm text-bg">{c}</T>
            <T className="text-sm text-bg/60">×</T>
          </Pressable>
        ))}
        {value.length < MAX ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add colour"
            accessibilityState={{ expanded: adding }}
            onPress={() => setAdding(!adding)}
            className="rounded-xl border border-dashed border-[#B9B1A0] px-3.5 py-[9px]"
          >
            <T className="font-sans-bold text-sm text-muted">{adding ? 'Done' : '+ Add'}</T>
          </Pressable>
        ) : null}
      </View>

      {adding ? (
        <View className="gap-2">
          <View className="flex-row flex-wrap gap-1.5">
            {QUICK.filter((q) => !value.includes(q)).map((q) => (
              <Pressable key={q} accessibilityRole="button" onPress={() => add(q)} className="rounded-full border border-line-2 bg-surface px-3 py-1.5">
                <T className="text-[13px]">{q}</T>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={typed}
            onChangeText={setTyped}
            onSubmitEditing={() => add(typed)}
            returnKeyType="done"
            placeholder="Other colour, e.g. Saffron"
            placeholderTextColor="#8A928E"
            accessibilityLabel="Colour name"
            className={cx('h-11 rounded-xl border border-line-2 bg-surface px-3 font-sans text-base text-ink')}
          />
        </View>
      ) : null}
    </View>
  );
}
