import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, router, type Href } from 'expo-router';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { ChevronLeft } from 'lucide-react-native';
import { T, cx } from '@/components/ui';

/** router.back() with a fallback when there is no history (deep link / reload). */
export function goBack(fallback: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

/** Back chevron + centred step label + optional right action (Skip / Later). */
export function StepHeader({
  fallback, label, right, hideBack, onBack,
}: { fallback?: Href; label?: string; right?: { title: string; href?: Href; onPress?: () => void }; hideBack?: boolean; onBack?: () => void }) {
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (fallback) goBack(fallback);
  };

  return (
    <View className="flex-row items-center justify-between px-3 pt-1">
      {!hideBack && (fallback || onBack) ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={handleBack}
          className="h-11 w-11 items-center justify-center"
        >
          <ChevronLeft size={22} color="#0E1A15" strokeWidth={2} />
        </Pressable>
      ) : (
        <View className="h-11 w-11" />
      )}
      {label ? <T className="font-sans-bold text-[13px] text-muted">{label}</T> : null}
      {right ? (
        right.onPress ? (
          <Pressable accessibilityRole="button" onPress={right.onPress} className="h-11 justify-center px-2.5">
            <T className="font-sans-semibold text-[15px] text-muted-2">{right.title}</T>
          </Pressable>
        ) : (
          <Link href={right.href!} asChild>
            <Pressable accessibilityRole="link" className="h-11 justify-center px-2.5">
              <T className="font-sans-semibold text-[15px] text-muted-2">{right.title}</T>
            </Pressable>
          </Link>
        )
      ) : (
        <View className="w-11" />
      )}
    </View>
  );
}

/** Thin green progress bar under the step header. */
export function Progress({ pct }: { pct: number }) {
  return (
    <View className="px-5 pt-2.5">
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: pct }}
        className="h-1.5 rounded-full bg-line"
      >
        <View style={{ width: `${pct}%` }} className="h-1.5 rounded-full bg-green" />
      </View>
    </View>
  );
}

/** Screen title + optional sub copy (30px Jakarta 800). */
export function Heading({ title, sub, size = 30 }: { title: string; sub?: React.ReactNode; size?: number }) {
  return (
    <View className="gap-2">
      <T
        accessibilityRole="header"
        style={{ fontSize: size, lineHeight: size * 1.1, letterSpacing: -size * 0.03 }}
        className="font-display-x"
      >
        {title}
      </T>
      {typeof sub === 'string' ? <T className="text-[15px] leading-[22px] text-muted-2">{sub}</T> : sub ?? null}
    </View>
  );
}

/** Pinned bottom area (replaces the design's absolute bottom CTA block). */
export function BottomBar({ children, className }: { children: React.ReactNode; className?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingBottom: Math.max(insets.bottom + 8, 24) }} className={cx('gap-3 px-5 pt-3', className)}>
      {children}
    </View>
  );
}

/**
 * Text input box that shows the design's focus ring (green border + mint outline) while focused.
 * `left` renders an icon or prefix inside the box.
 */
export const RingInput = forwardRef<TextInput, TextInputProps & { left?: React.ReactNode; boxClassName?: string; inputClassName?: string }>(
  function RingInput({ left, boxClassName, inputClassName, onFocus, onBlur, ...rest }, ref) {
    const [focused, setFocused] = useState(false);
    const innerRef = useRef<TextInput>(null);
    useImperativeHandle(ref, () => innerRef.current!);

    return (
      <View className={cx('rounded-[17px] border-[3px]', focused ? 'border-mint-2' : 'border-transparent')} style={{ margin: -3 }}>
        <Pressable
          onPress={() => innerRef.current?.focus()}
          className={cx(
            'h-[54px] flex-row items-center gap-2.5 rounded-[14px] bg-surface px-4',
            focused ? 'border-[1.5px] border-green' : 'border border-line-2',
            left ? 'pl-3.5' : null,
            boxClassName,
          )}
        >
          {left}
          <TextInput
            ref={innerRef}
            placeholderTextColor="#8A928E"
            onFocus={(e) => { setFocused(true); onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); onBlur?.(e); }}
            className={cx('h-full flex-1 text-ink', inputClassName ?? 'font-sans text-base')}
            {...rest}
          />
        </Pressable>
      </View>
    );
  },
);

/** Bold 14px field label + control, matching the designs' <label> blocks. */
export function Labelled({ label, children, className }: { label: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <View className={cx('gap-1.5', className)}>
      {typeof label === 'string' ? <T className="font-sans-bold text-sm">{label}</T> : label}
      {children}
    </View>
  );
}

type IconProps ={ size?: number; color?: string; strokeWidth?: number };

/** Chat bubble used for WhatsApp in the designs. */
export function WhatsAppIcon({ size = 20, color = '#0E1A15', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z" />
    </Svg>
  );
}

export function InstagramIcon({ size = 22, color = '#0E1A15', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={3} width={18} height={18} rx={5} />
      <Circle cx={12} cy={12} r={4} />
    </Svg>
  );
}

export function TikTokIcon({ size = 22, color = '#0E1A15', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14 3v11a4 4 0 1 1-4-4M14 3c0 3 2 5 5 5" />
    </Svg>
  );
}

/** Four-point sparkle used for Nina AI. */
export function SparkleIcon({ size = 16, color = '#6FD3A4' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l2.2 6.5L21 11l-6.8 2.5L12 20l-2.2-6.5L3 11l6.8-2.5z" />
    </Svg>
  );
}
