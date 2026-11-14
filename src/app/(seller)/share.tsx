import { useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { Download, Ellipsis, MessageCircle } from 'lucide-react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@tanstack/react-query';
import { Screen, T, cx } from '@/components/ui';
import { BackHeader, Chip } from '@/features/seller/parts';
import { getMe } from '@/api/auth';

type Mode = 'status' | 'qr' | 'product';
const modes: Array<[Mode, string]> = [
  ['status', 'Status card'],
  ['qr', 'QR code'],
  ['product', 'One product'],
];

function InstagramGlyph() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2}>
      <Rect x={3} y={3} width={18} height={18} rx={5} />
      <Circle cx={12} cy={12} r={4} />
    </Svg>
  );
}

function Action({ label, bg, border, onPress, children }: { label: string; bg: string; border?: boolean; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} className="flex-1 items-center gap-1.5">
      <View style={{ backgroundColor: bg }} className={cx('h-14 w-14 items-center justify-center rounded-[18px]', border && 'border border-line')}>
        {children}
      </View>
      <T className="text-center font-sans-semibold text-xs">{label}</T>
    </Pressable>
  );
}

export default function ShareStore() {
  const [mode, setMode] = useState<Mode>('status');
  const [copied, setCopied] = useState(false);

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const store = me?.store;
  const storeName = store?.store_name || store?.name || 'My Store';
  const username = store?.username || store?.slug || 'mystore';
  const displayLink = `frontstore.app/${username}`;
  const url = `https://${displayLink}`;
  const message = `Shop ${storeName} - now taking orders: ${url}`;

  const share = () => {
    Share.share({ message, url, title: storeName }).catch(() => {});
  };

  const copy = async () => {
    await Clipboard.setStringAsync(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Screen>
      <BackHeader title="Share your store" fallback="/home" />
      <ScrollView contentContainerClassName="gap-[18px] px-5 pb-8 pt-2">
        <View className="flex-row gap-2">
          {modes.map(([id, label]) => (
            <Chip key={id} label={label} on={mode === id} onPress={() => setMode(id)} />
          ))}
        </View>

        <View
          style={{ shadowColor: '#0E1A15', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 24 }, elevation: 12 }}
          className="h-[400px] w-[230px] gap-3.5 self-center rounded-[26px] bg-deep p-[22px]"
        >
          <T className="font-sans-bold text-[11px] uppercase tracking-[1.3px] text-saffron">Now taking orders</T>
          <T className="font-display text-[30px] leading-[30px] tracking-[-0.6px] text-bg">{storeName}</T>
          <View className="flex-1 gap-2">
            <View className="flex-1 flex-row gap-2">
              <View className="flex-1 rounded-xl bg-saffron" />
              <View className="flex-1 rounded-xl bg-[#2F5D8A]" />
            </View>
            <View className="flex-1 flex-row gap-2">
              <View className="flex-1 rounded-xl bg-[#7A9E7E]" />
              <View className="flex-1 rounded-xl bg-[#B5838D]" />
            </View>
          </View>
          <View className="rounded-xl bg-bg px-3 py-2.5">
            <T className="text-center font-sans-bold text-xs">{displayLink}</T>
          </View>
        </View>

        <View className="h-[52px] flex-row items-center justify-between rounded-[14px] border border-line bg-surface pl-4 pr-1.5">
          <T className="font-sans-semibold">{displayLink}</T>
          <Pressable accessibilityRole="button" accessibilityLabel="Copy store link" onPress={copy} className="h-10 justify-center rounded-[10px] bg-ink px-3.5">
            <T className="font-sans-bold text-sm text-bg">{copied ? 'Copied' : 'Copy'}</T>
          </Pressable>
        </View>

        <View className="flex-row gap-2.5">
          <Action label="WhatsApp Status" bg="#0B6E4F" onPress={share}>
            <MessageCircle size={24} color="#FFFFFF" strokeWidth={2} />
          </Action>
          <Action label="Instagram Story" bg="#8E4A5E" onPress={share}>
            <InstagramGlyph />
          </Action>
          <Action label="Save image" bg="#FFFFFF" border onPress={share}>
            <Download size={24} color="#0E1A15" strokeWidth={2} />
          </Action>
          <Action label="More" bg="#FFFFFF" border onPress={share}>
            <Ellipsis size={24} color="#0E1A15" strokeWidth={2.6} />
          </Action>
        </View>
      </ScrollView>
    </Screen>
  );
}
