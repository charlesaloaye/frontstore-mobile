import { Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { T, cx } from '@/components/ui';

/** Go back, or to `fallback` when there is no history (deep link / web refresh). */
export function goBack(fallback: Href = '/home') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

/** Header with a back chevron, centred title and an optional right slot. */
export function BackHeader({ title, sub, right, fallback }: { title: string; sub?: string; right?: React.ReactNode; fallback?: Href }) {
  return (
    <View className="flex-row items-center justify-between px-2 pb-1 pt-1">
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => goBack(fallback)} className="h-11 w-11 items-center justify-center">
        <ChevronLeft size={22} color="#0E1A15" strokeWidth={2} />
      </Pressable>
      <View className="items-center">
        <T className="font-sans-bold text-[17px]">{title}</T>
        {sub ? <T className="text-xs text-muted">{sub}</T> : null}
      </View>
      {right ?? <View className="w-11" />}
    </View>
  );
}

/** Pill filter chip (dark when selected, outlined otherwise). */
export function Chip({ label, on, onPress, className }: { label: string; on: boolean; onPress?: () => void; className?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      className={cx('min-h-[38px] justify-center rounded-full px-3.5', on ? 'bg-ink' : 'border border-line-2', className)}
    >
      <T className={cx('font-sans-semibold text-sm', on ? 'text-bg' : 'text-ink')}>{label}</T>
    </Pressable>
  );
}

/** iOS-style switch drawn like the designs (50x30 green track). */
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      hitSlop={8}
      className={cx('h-[30px] w-[50px] justify-center rounded-full px-[3px]', value ? 'items-end bg-green' : 'items-start bg-line-2')}
    >
      <View className="h-6 w-6 rounded-full bg-surface" />
    </Pressable>
  );
}

/** Four-point sparkle used for the Nina AI badges. */
export function Sparkle({ size = 12, color = '#07261C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l2.2 6.5L21 11l-6.8 2.5L12 20l-2.2-6.5L3 11l6.8-2.5z" />
    </Svg>
  );
}

/** Small grab handle at the top of bottom sheets. */
export function Grip({ className }: { className?: string }) {
  return <View className={cx('h-[5px] w-10 self-center rounded-full bg-line-2', className)} />;
}

/** Status pill with explicit colours. */
export function Tag({ label, bg, fg, small }: { label: string; bg: string; fg: string; small?: boolean }) {
  return (
    <View style={{ backgroundColor: bg }} className={cx('rounded-full', small ? 'px-2 py-[3px]' : 'px-2.5 py-[5px]')}>
      <T style={{ color: fg }} className={cx('font-sans-bold', small ? 'text-[11px]' : 'text-xs')}>{label}</T>
    </View>
  );
}
