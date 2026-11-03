import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, TextInput, View } from 'react-native';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';
import { T, cx } from '@/components/ui';
import { MAX_PHOTOS, type DraftStatus } from './usePhotoDraft';

type PhotoProps = {
  photos: { uri: string }[];
  busy: boolean;
  onPick: (source: 'camera' | 'library') => void;
  onRemove: (i: number) => void;
};

/** Empty: two big choices. With photos: thumbnails (first = cover) + add more. */
export function PhotoPicker({ photos, busy, onPick, onRemove }: PhotoProps) {
  if (photos.length === 0) {
    return (
      <View className="gap-2.5 rounded-[22px] border-2 border-dashed border-[#B9B1A0] bg-surface p-5">
        <View className="items-center gap-1">
          <T className="font-sans-bold text-base text-[#33403A]">Add a photo of your product</T>
          <T className="text-[13px] text-muted">Up to {MAX_PHOTOS} photos · Nina AI fills in the rest</T>
        </View>
        <View className="flex-row gap-2.5">
          <Choice icon={<Camera size={22} color="#0B6E4F" strokeWidth={2} />} label="Take photo" disabled={busy} onPress={() => onPick('camera')} />
          <Choice icon={<ImageIcon size={22} color="#0B6E4F" strokeWidth={2} />} label="Choose from gallery" disabled={busy} onPress={() => onPick('library')} />
        </View>
      </View>
    );
  }
  return (
    <View className="flex-row gap-2">
      {photos.map((p, i) => (
        <View key={p.uri} accessibilityLabel={i === 0 ? 'Cover photo' : `Photo ${i + 1}`} className="h-[92px] w-[92px] overflow-hidden rounded-2xl bg-sand">
          <Image source={{ uri: p.uri }} className="h-full w-full" resizeMode="cover" />
          {i === 0 ? (
            <View className="absolute bottom-1.5 left-1.5 rounded-full bg-surface px-[7px] py-0.5">
              <T className="font-sans-bold text-[10px]">Cover</T>
            </View>
          ) : null}
          {!busy ? (
            <Pressable accessibilityRole="button" accessibilityLabel={`Remove photo ${i + 1}`} hitSlop={6} onPress={() => onRemove(i)} className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-ink/70">
              <X size={14} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>
          ) : null}
        </View>
      ))}
      {photos.length < MAX_PHOTOS ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add another photo"
          disabled={busy}
          onPress={() => onPick('library')}
          className={cx('h-[92px] flex-1 items-center justify-center rounded-2xl border-[1.5px] border-dashed border-[#B9B1A0] bg-surface', busy && 'opacity-40')}
        >
          <T className="text-[22px] text-muted">+</T>
        </Pressable>
      ) : null}
    </View>
  );
}

function Choice({ icon, label, onPress, disabled }: { icon: React.ReactNode; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} className={cx('h-[110px] flex-1 items-center justify-center gap-2 rounded-2xl bg-mint', disabled && 'opacity-40')}>
      {icon}
      <T className="text-center font-sans-bold text-[14px] text-deep">{label}</T>
    </Pressable>
  );
}

/** Honest progress while uploading / reading: no invented findings. */
export function ReadingCard({ status, onSkip }: { status: DraftStatus; onSkip: () => void }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: false }));
    a.start();
    return () => a.stop();
  }, [pulse]);
  const left = pulse.interpolate({ inputRange: [0, 1], outputRange: ['-30%', '100%'] });

  return (
    <View className="gap-2.5 rounded-[20px] bg-ink p-4" accessibilityLiveRegion="polite">
      <T className="font-sans-bold text-[15px] text-bg">{status === 'uploading' ? 'Uploading your photos…' : 'Nina AI is reading your photos…'}</T>
      <View className="h-1.5 overflow-hidden rounded-full bg-[#33504A]">
        <Animated.View style={{ left, width: '30%' }} className="absolute h-1.5 rounded-full bg-leaf" />
      </View>
      <T className="text-sm text-on-dark">Name, price, category and description, usually in under a minute.</T>
      {status === 'reading' ? (
        <Pressable accessibilityRole="button" onPress={onSkip} hitSlop={{ top: 4, bottom: 4 }} className="h-[38px] justify-center self-start rounded-full border border-bg/30 px-3.5">
          <T className="font-sans-semibold text-[13px] text-bg">Skip, I'll fill it in</T>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Colour chips you can add to and remove from. */
export function ColourEditor({ colours, onChange }: { colours: string[]; onChange: (c: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const add = () => {
    const c = text.trim();
    if (c && !colours.some((x) => x.toLowerCase() === c.toLowerCase()) && colours.length < 8) onChange([...colours, c]);
    setText('');
    setAdding(false);
  };
  return (
    <View className="flex-row flex-wrap gap-2">
      {colours.map((c) => (
        <Pressable key={c} accessibilityRole="button" accessibilityLabel={`Remove colour ${c}`} onPress={() => onChange(colours.filter((x) => x !== c))} className="flex-row items-center gap-1.5 rounded-xl bg-ink px-3.5 py-[9px]">
          <T className="font-sans-bold text-sm text-bg">{c}</T>
          <X size={12} color="#F6F3EC" strokeWidth={2.5} />
        </Pressable>
      ))}
      {adding ? (
        <TextInput
          autoFocus
          value={text}
          onChangeText={setText}
          onSubmitEditing={add}
          onBlur={add}
          returnKeyType="done"
          placeholder="e.g. Navy"
          placeholderTextColor="#8A928E"
          accessibilityLabel="New colour"
          className="h-[40px] min-w-[110px] rounded-xl border border-line-2 bg-surface px-3 font-sans text-sm text-ink"
        />
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel="Add colour" onPress={() => setAdding(true)} className="rounded-xl border border-dashed border-[#B9B1A0] px-3.5 py-[9px]">
          <T className="font-sans-bold text-sm text-muted">+ Add</T>
        </Pressable>
      )}
    </View>
  );
}
