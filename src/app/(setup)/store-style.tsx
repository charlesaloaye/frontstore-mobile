import { Image, Pressable, ScrollView, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button, Card, Screen, T, cx } from '@/components/ui';
import { BottomBar, Heading, Progress, StepHeader } from '@/features/setup/parts';
import { initialOf, toSlug, updateDraft, useDraft } from '@/features/setup/draft';

const SWATCHES: Array<[string, string]> = [
  ['Terracotta', '#C8553D'], ['Forest', '#0B6E4F'], ['Indigo', '#2F5D8A'], ['Plum', '#7B3F61'], ['Ochre', '#8A5A12'], ['Ink', '#0E1A15'],
];
const CATS = ['Fashion', 'Food', 'Beauty', 'Gadgets', 'Home', 'Other'];

export default function StoreStyle() {
  const { name, color, category, logo_uri } = useDraft();

  const pickLogo = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!res.canceled && res.assets?.[0]) updateDraft({ logo_uri: res.assets[0].uri });
  };

  return (
    <Screen>
      <StepHeader fallback="/store-name" label="Step 3 of 5" right={{ title: 'Skip', href: '/payout' }} />
      <Progress pct={60} />
      <ScrollView contentContainerClassName="gap-[18px] px-5 pt-6 pb-6">
        <Heading title="Make it look like you" />

        <Card className="flex-row items-end gap-3 rounded-[22px] p-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={logo_uri ? 'Change logo' : 'Add logo'}
            onPress={pickLogo}
            style={{ backgroundColor: color }}
            className="h-16 w-16 items-center justify-center overflow-hidden rounded-[18px] border-[3px] border-surface"
          >
            {logo_uri ? (
              <Image source={{ uri: logo_uri }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <T className="font-sans-bold text-2xl text-white">{initialOf(name)}</T>
            )}
          </Pressable>
          <View className="shrink pb-1">
            <T numberOfLines={1} className="font-display-x text-[17px]">{name.trim() || 'Your store'}</T>
            <T numberOfLines={1} className="text-[13px] text-muted">{toSlug(name)}.frontstore.app</T>
          </View>
        </Card>

        <View className="gap-2.5">
          <T className="font-sans-bold text-sm">Brand colour</T>
          <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-3">
            {SWATCHES.map(([label, hex]) => {
              const on = hex === color;
              return (
                <Pressable
                  key={hex}
                  accessibilityRole="radio"
                  accessibilityLabel={label}
                  accessibilityState={{ checked: on }}
                  onPress={() => updateDraft({ color: hex })}
                  style={{ borderColor: on ? '#0E1A15' : '#D8D2C4', borderWidth: on ? 2 : 1, margin: on ? -2 : -1 }}
                  className="rounded-full"
                >
                  <View style={{ backgroundColor: hex }} className="h-11 w-11 rounded-full border-[3px] border-bg" />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2.5">
          <T className="font-sans-bold text-sm">What do you sell?</T>
          <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
            {CATS.map((c) => {
              const on = c === category;
              return (
                <Pressable
                  key={c}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => updateDraft({ category: c })}
                  className={cx('h-11 justify-center rounded-full px-4', on ? 'bg-ink' : 'border border-line-2 bg-surface')}
                >
                  <T className={cx('font-sans-semibold text-[15px]', on ? 'text-white' : 'text-ink')}>{c}</T>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
      <BottomBar>
        <Button title="Continue" href="/payout" />
      </BottomBar>
    </Screen>
  );
}
