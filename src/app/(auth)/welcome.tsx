import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, Check } from 'lucide-react-native';
import { Button, LogoMark, Screen, T } from '@/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setHasSeenOnboarding } from '@/api/authStore';

const slides = [
  { step: 'Step 1 · Build', title: 'Your shop, ready in minutes.', body: 'Snap a photo, add a price and sizes. Your store goes live the moment you save.', bg: '#E7DCC8' },
  { step: 'Step 2 · Share', title: 'One link. Everywhere you sell.', body: 'Put your store link and QR code on Instagram, WhatsApp Status, TikTok and your packaging.', bg: '#CFE8DC' },
  { step: 'Step 3 · Get paid', title: 'Customers pay online. You just deliver.', body: 'Card, bank transfer or USSD - money lands in your account and the order shows up here.', bg: '#F3C77A' },
];

const QR = '1110111101010111101111000010001010100101111011110';

const shadow = (o: number, r: number, y: number): ViewStyle => ({
  shadowColor: '#07261C', shadowOpacity: o, shadowRadius: r, shadowOffset: { width: 0, height: y }, elevation: Math.round(y / 2),
});

function BuildArt() {
  return (
    <>
      <View style={[{ position: 'absolute', left: 28, top: 36, width: 200, transform: [{ rotate: '-4deg' }] }, shadow(0.25, 20, 20)]} className="gap-2 rounded-[22px] bg-surface px-3.5 pb-3.5 pt-4">
        <View className="h-10 w-10 items-center justify-center rounded-xl border-[3px] border-surface bg-ink">
          <T className="font-sans-bold text-white">M</T>
        </View>
        <T className="font-display-x text-[15px]">Mama V</T>
        <View className="flex-row flex-wrap gap-1.5">
          {['#E9A23B', '#2F5D8A', '#7A9E7E', '#B5838D'].map((c) => (
            <View key={c} style={{ backgroundColor: c, width: 83 }} className="h-[70px] rounded-[10px]" />
          ))}
        </View>
      </View>
      <View style={[{ position: 'absolute', right: 22, top: 150, width: 170, transform: [{ rotate: '3deg' }] }, shadow(0.22, 16, 16)]} className="gap-2 rounded-[18px] bg-surface p-3">
        <View className="h-[90px] rounded-xl bg-[#7A9E7E]" />
        <T className="font-sans-bold text-[13px]">Bubu gown</T>
        <T className="font-sans-bold text-[13px] text-green">₦22,000</T>
      </View>
      <View style={{ position: 'absolute', right: 26, bottom: 26 }} className="flex-row items-center gap-2 rounded-full bg-ink px-3.5 py-2.5">
        <Check size={14} color="#6FD3A4" strokeWidth={3} />
        <T className="font-sans-bold text-[13px] text-white">Product added</T>
      </View>
    </>
  );
}

function ShareArt() {
  const cell = (170 - 40 - 6 * 4) / 7;
  return (
    <>
      <View className="absolute left-0 right-0 top-7 items-center">
        <View style={[{ width: 170, height: 170, padding: 20, gap: 4 }, shadow(0.25, 20, 20)]} className="rounded-[26px] bg-surface">
          {Array.from({ length: 7 }, (_, r) => (
            <View key={r} style={{ gap: 4 }} className="flex-row">
              {QR.slice(r * 7, r * 7 + 7).split('').map((c, k) => (
                <View key={k} style={{ width: cell, height: cell, borderRadius: 3, backgroundColor: c === '1' ? '#0E1A15' : 'transparent' }} />
              ))}
            </View>
          ))}
        </View>
      </View>
      <View style={[{ position: 'absolute', left: 24, right: 24, top: 214 }, shadow(0.18, 12, 12)]} className="h-[52px] flex-row items-center justify-between rounded-full bg-surface pl-[18px] pr-1.5">
        <T className="font-sans-bold text-sm">
          mamav<T className="font-sans-medium text-sm text-muted">.frontstore.app</T>
        </T>
        <View className="h-10 justify-center rounded-full bg-green px-3.5">
          <T className="font-sans-bold text-[13px] text-white">Copy</T>
        </View>
      </View>
      <View className="absolute bottom-[22px] left-0 right-0 flex-row justify-center gap-2">
        {['Instagram', 'WhatsApp', 'TikTok'].map((l) => (
          <View key={l} className="rounded-full bg-white/90 px-3 py-2">
            <T className="font-sans-bold text-xs">{l}</T>
          </View>
        ))}
      </View>
    </>
  );
}

function PaidArt() {
  return (
    <>
      <View className="absolute left-[22px] right-[22px] top-10 gap-3">
        <View style={shadow(0.25, 16, 16)} className="flex-row items-center gap-3 rounded-[20px] bg-surface p-4">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-green">
            <Check size={20} color="#FFFFFF" strokeWidth={2.6} />
          </View>
          <View className="flex-1 gap-0.5">
            <T className="text-[13px] text-muted">Payment received · Card</T>
            <T className="font-display-x text-2xl">₦40,000</T>
          </View>
          <T className="text-xs text-muted">now</T>
        </View>
        <View className="mx-3 flex-row items-center justify-between rounded-[18px] bg-white/85 p-3.5">
          <T className="text-sm"><T className="font-sans-bold text-sm">₦18,500</T> · Transfer</T>
          <T className="text-sm text-muted">2m</T>
        </View>
        <View className="mx-6 flex-row items-center justify-between rounded-2xl bg-white/60 p-3">
          <T className="text-[13px]"><T className="font-sans-bold text-[13px]">₦9,500</T> · USSD</T>
          <T className="text-[13px] text-muted">1h</T>
        </View>
      </View>
      <View className="absolute bottom-7 left-[22px] right-[22px] flex-row items-center justify-between rounded-[20px] bg-ink px-[18px] py-4">
        <View className="gap-0.5">
          <T className="text-xs text-on-dark-2">Today</T>
          <T className="font-display-x text-[22px] text-white">₦68,000</T>
        </View>
        <View className="h-9 flex-row items-end gap-[5px]">
          {(['30%', '55%', '45%', '100%'] as const).map((h, k) => (
            <View key={k} style={{ height: h, backgroundColor: k === 3 ? '#6FD3A4' : '#33504A' }} className="w-2 rounded-[3px]" />
          ))}
        </View>
      </View>
    </>
  );
}

const arts = [BuildArt, ShareArt, PaidArt];

export default function Welcome() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const scroller = useRef<ScrollView>(null);

  useEffect(() => {
    setHasSeenOnboarding(true);
  }, []);

  const go = (k: number) => {
    setI(k);
    scroller.current?.scrollTo({ x: k * width, animated: true });
  };
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const k = Math.round(e.nativeEvent.contentOffset.x / width);
    if (k !== i) setI(Math.max(0, Math.min(k, slides.length - 1)));
  };
  const isLast = i === slides.length - 1;

  const handleSkip = async () => {
    await setHasSeenOnboarding(true);
    router.replace('/login');
  };

  const handleLogin = async () => {
    await setHasSeenOnboarding(true);
    router.replace('/login');
  };

  const handleSignup = async () => {
    await setHasSeenOnboarding(true);
    router.replace('/signup');
  };

  return (
    <Screen>
      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-1">
        <View className="flex-row items-center gap-2">
          <LogoMark size={32} />
          <T className="font-display-x text-[20px] tracking-[-0.4px]">frontstore</T>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          onPress={handleSkip}
          className="h-11 justify-center px-3.5"
        >
          <T className="font-sans-semibold text-[15px] text-muted-2">Skip</T>
        </Pressable>
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        className="flex-1"
      >
        {slides.map((s, k) => {
          const Art = arts[k];
          return (
            <View key={s.step} style={{ width }} accessibilityLabel={`Slide ${k + 1} of ${slides.length}`}>
              <View style={{ backgroundColor: s.bg }} className="mx-5 mt-4 h-[340px] overflow-hidden rounded-[32px]">
                <Art />
              </View>
              <View className="gap-2.5 px-6 pt-6">
                <T className="font-sans-bold text-[13px] uppercase tracking-[1px] text-green">{s.step}</T>
                <T accessibilityRole="header" className="font-display-x text-[30px] leading-[32px] tracking-[-0.9px]">{s.title}</T>
                <T className="text-[15px] leading-[22px] text-muted-2">{s.body}</T>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={{ paddingBottom: Math.max(insets.bottom + 8, 24) }} className="gap-4 px-6 pt-3">
        <View className="flex-row justify-center">
          {slides.map((_, k) => (
            <Pressable
              key={k}
              accessibilityRole="button"
              accessibilityLabel={`Go to slide ${k + 1}`}
              accessibilityState={{ selected: k === i }}
              onPress={() => go(k)}
              hitSlop={{ top: 18, bottom: 18 }}
              className="px-[3px]"
            >
              <View style={{ width: k === i ? 28 : 8, backgroundColor: k === i ? '#0E1A15' : '#D8D2C4' }} className="h-2 rounded-[9px]" />
            </Pressable>
          ))}
        </View>
        {isLast ? (
          <View className="gap-2">
            <Button title="Create my free store" onPress={handleSignup} />
            <Pressable
              accessibilityRole="button"
              onPress={handleLogin}
              className="h-11 items-center justify-center"
            >
              <T className="font-sans-semibold text-[15px] text-muted-2">
                I already have a store · <T className="font-sans-bold text-[15px] text-green">Log in</T>
              </T>
            </Pressable>
          </View>
        ) : (
          <View className="flex-row gap-2.5">
            <Pressable
              accessibilityRole="button"
              onPress={handleLogin}
              className="h-14 justify-center rounded-full border border-line-2 px-[22px]"
            >
              <T className="font-sans-bold text-base">Log in</T>
            </Pressable>
            <Button
              title="Next"
              kind="dark"
              className="flex-1"
              onPress={() => go(i + 1)}
              right={<ArrowRight size={18} color="#FFFFFF" strokeWidth={2.2} />}
            />
          </View>
        )}
      </View>
    </Screen>
  );
}

