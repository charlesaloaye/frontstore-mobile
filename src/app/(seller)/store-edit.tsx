import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Button, Screen, T, cx } from '@/components/ui';
import { BackHeader, goBack } from '@/features/seller/parts';
import { getStore, updateStore, uploadStoreLogo } from '@/api/store';
import { initialOf } from '@/features/setup/draft';

// Same brand colours as store setup.
const SWATCHES: Array<[string, string]> = [
  ['Terracotta', '#C8553D'], ['Forest', '#0B6E4F'], ['Indigo', '#2F5D8A'], ['Plum', '#7B3F61'], ['Ochre', '#8A5A12'], ['Ink', '#0E1A15'],
];

const inputBox = 'rounded-[14px] border border-line-2 bg-surface px-3.5 font-sans text-base text-ink';

/** Edit an existing store: logo (uploads right away), name, bio, brand colour. */
export default function StoreEdit() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: store, isLoading } = useQuery({ queryKey: ['seller-store'], queryFn: getStore });

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [color, setColor] = useState('#0B6E4F');
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    if (!store) return;
    setName(store.store_name ?? store.name ?? '');
    setBio(store.store_bio ?? '');
    setColor(store.primary_color || store.store_color || '#0B6E4F');
    setLogo(store.logo_url ?? null);
  }, [store]);

  const logoMutation = useMutation({
    mutationFn: uploadStoreLogo,
    onSuccess: (res) => {
      setLogo(res.url);
      queryClient.invalidateQueries({ queryKey: ['seller-store'] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => updateStore({ store_name: name.trim(), store_bio: bio.trim() || null, primary_color: color }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-store'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      goBack('/settings');
    },
  });

  const pickLogo = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!res.canceled && res.assets?.[0]) {
      setLogo(res.assets[0].uri); // preview while it uploads
      logoMutation.mutate(res.assets[0].uri);
    }
  };

  const error = (saveMutation.error || logoMutation.error) as Error | null;
  const canSave = name.trim().length > 0 && !saveMutation.isPending && !logoMutation.isPending;

  return (
    <Screen>
      <BackHeader title="Edit store" fallback="/settings" />
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0B6E4F" />
        </View>
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5 pb-6 pt-3">
          <View className="flex-row items-center gap-4">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={logo ? 'Change logo' : 'Add logo'}
              onPress={pickLogo}
              disabled={logoMutation.isPending}
              style={{ backgroundColor: color }}
              className="h-20 w-20 items-center justify-center overflow-hidden rounded-[22px]"
            >
              {logo ? (
                <Image source={{ uri: logo }} className="h-full w-full" resizeMode="cover" />
              ) : (
                <T className="font-sans-bold text-3xl text-white">{initialOf(name)}</T>
              )}
              {logoMutation.isPending ? (
                <View className="absolute inset-0 items-center justify-center bg-[rgba(14,26,21,0.45)]">
                  <ActivityIndicator color="#FFFFFF" />
                </View>
              ) : null}
            </Pressable>
            <View className="shrink gap-0.5">
              <T className="font-sans-bold text-[15px]">Logo</T>
              <T className="text-[13px] text-muted">{logoMutation.isPending ? 'Uploading…' : 'Tap to choose a square image'}</T>
            </View>
          </View>

          <View className="gap-1.5">
            <T className="font-sans-bold text-sm">Store name</T>
            <TextInput value={name} onChangeText={setName} maxLength={100} accessibilityLabel="Store name" className={cx(inputBox, 'h-[50px]')} />
          </View>

          <View className="gap-1.5">
            <T className="font-sans-bold text-sm">About your store</T>
            <TextInput
              value={bio}
              onChangeText={setBio}
              maxLength={306}
              multiline
              textAlignVertical="top"
              placeholder="What you sell and what makes it special"
              placeholderTextColor="#8A928E"
              accessibilityLabel="About your store"
              className={cx(inputBox, 'min-h-[96px] py-2.5 leading-[22px]')}
            />
          </View>

          <View className="gap-2.5">
            <T className="font-sans-bold text-sm">Brand colour</T>
            <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-3">
              {SWATCHES.map(([label, hex]) => {
                const on = hex.toLowerCase() === color.toLowerCase();
                return (
                  <Pressable
                    key={hex}
                    accessibilityRole="radio"
                    accessibilityLabel={label}
                    accessibilityState={{ checked: on }}
                    onPress={() => setColor(hex)}
                    style={{ borderColor: on ? '#0E1A15' : '#D8D2C4', borderWidth: on ? 2 : 1, margin: on ? -2 : -1 }}
                    className="rounded-full"
                  >
                    <View style={{ backgroundColor: hex }} className="h-11 w-11 rounded-full border-[3px] border-bg" />
                  </Pressable>
                );
              })}
            </View>
          </View>

          {error ? <T accessibilityLiveRegion="polite" className="text-sm text-danger">{error.message}</T> : null}
        </ScrollView>
      )}

      <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 6 }} className="border-t border-line bg-bg px-5 pt-3">
        <Button
          title={saveMutation.isPending ? 'Saving…' : 'Save changes'}
          disabled={!canSave}
          onPress={() => saveMutation.mutate()}
          left={saveMutation.isPending ? <ActivityIndicator color="#FFFFFF" size="small" /> : undefined}
        />
      </View>
    </Screen>
  );
}
