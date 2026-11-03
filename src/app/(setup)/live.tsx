import { useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check } from 'lucide-react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Clipboard from 'expo-clipboard';
import { Button, Screen, T } from '@/components/ui';
import { BottomBar, InstagramIcon, TikTokIcon, WhatsAppIcon } from '@/features/setup/parts';
import { initialOf, toSlug, useDraft } from '@/features/setup/draft';

function QrIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={3} width={7} height={7} rx={1} />
      <Rect x={14} y={3} width={7} height={7} rx={1} />
      <Rect x={3} y={14} width={7} height={7} rx={1} />
      <Path d="M14 14h3v3h-3zM20 20h1" />
    </Svg>
  );
}

export default function Live() {
  const { name } = useDraft();
  const [copied, setCopied] = useState(false);
  const slug = toSlug(name) || 'mamav';
  const link = `frontstore.app/${slug}`;
  const fullUrl = `https://${link}`;

  const copyLink = async () => {
    await Clipboard.setStringAsync(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => Share.share({ message: `Shop ${name.trim()} on Frontstore: ${fullUrl}` }).catch(() => {});

  const targets = [
    { label: 'Status', Icon: WhatsAppIcon, onPress: shareLink },
    { label: 'Instagram', Icon: InstagramIcon, onPress: shareLink },
    { label: 'TikTok', Icon: TikTokIcon, onPress: shareLink },
    { label: 'QR code', Icon: QrIcon, onPress: () => router.push('/share') },
  ];

  return (
    <Screen className="bg-deep">
      <StatusBar style="light" />
      <ScrollView contentContainerClassName="gap-6 px-5 pt-8 pb-4">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-leaf">
          <Check size={30} color="#07261C" strokeWidth={2.6} />
        </View>
        <View className="gap-2.5">
          <T accessibilityRole="header" className="font-display-x text-[36px] leading-[38px] tracking-[-1px] text-bg">Your store is live.</T>
          <T className="text-base leading-6 text-on-dark">Share your link and start taking orders today.</T>
        </View>

        <View className="gap-2.5 rounded-3xl bg-bg p-4">
          <View className="h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-bg bg-ink">
            <T className="font-sans-bold text-[22px] text-white">{initialOf(name)}</T>
          </View>
          <View>
            <T numberOfLines={1} className="font-display-x text-[18px]">{name.trim() || 'Your store'}</T>
            <T numberOfLines={1} className="text-sm text-muted-2">{link}</T>
          </View>
          <View className="flex-row gap-2">
            <Pressable accessibilityRole="button" onPress={copyLink} className="h-11 flex-1 items-center justify-center rounded-full bg-ink">
              <T className="font-sans-bold text-sm text-white">{copied ? 'Copied!' : 'Copy link'}</T>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/shop/store/[slug]', params: { slug } })}
              className="h-11 flex-1 items-center justify-center rounded-full border border-line-2 bg-surface"
            >
              <T className="font-sans-bold text-sm">Preview</T>
            </Pressable>
          </View>
        </View>

        <View className="gap-2.5">
          <T className="font-sans-bold text-[13px] uppercase tracking-[1px] text-on-dark-2">Share to</T>
          <View className="flex-row gap-2">
            {targets.map(({ label, Icon, onPress }) => (
              <Pressable key={label} accessibilityRole="button" accessibilityLabel={`Share to ${label}`} onPress={onPress} className="flex-1 items-center gap-1.5">
                <View className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-bg/10">
                  <Icon color="#F6F3EC" />
                </View>
                <T className="font-sans-semibold text-xs text-bg">{label}</T>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
      <BottomBar>
        <Button title="Go to my dashboard" kind="gold" onPress={() => router.replace('/home')} />
      </BottomBar>
    </Screen>
  );
}
