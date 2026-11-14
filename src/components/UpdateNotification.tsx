import { useEffect, useState, useRef } from 'react';
import { View, Pressable, AppState, AppStateStatus, Animated, Easing, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Download, Sparkles, X } from 'lucide-react-native';
import * as Updates from 'expo-updates';
import { T } from './ui';

/**
 * Over-the-air updates, in stages the seller can see:
 *   downloading → ready (Restart / Later) → full-screen "Updating" while it restarts.
 * expo-updates doesn't report download bytes, so the bars show the stage, not a percentage.
 */
type Phase = 'idle' | 'downloading' | 'ready' | 'applying' | 'failed';

export function UpdateNotification() {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('idle');
  const [dismissed, setDismissed] = useState(false);
  const busy = useRef(false);
  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;

  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current; // looping bar while downloading
  const fill = useRef(new Animated.Value(0)).current; // 0..1 bar on the updating screen

  const checkUpdates = async () => {
    if (__DEV__ || busy.current || phaseRef.current !== 'idle') return;
    busy.current = true;
    try {
      const check = await Updates.checkForUpdateAsync();
      if (check.isAvailable) {
        setDismissed(false);
        setPhase('downloading');
        await Updates.fetchUpdateAsync();
        setPhase('ready');
      }
    } catch {
      // Offline or the update server didn't answer: try again later.
      if ((phaseRef.current as Phase) === 'downloading') setPhase('idle');
    } finally {
      busy.current = false;
    }
  };

  useEffect(() => {
    if (__DEV__) return;
    checkUpdates();
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') checkUpdates();
    });
    const interval = setInterval(checkUpdates, 10 * 60 * 1000);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showBanner = (phase === 'downloading' || phase === 'ready') && !dismissed;

  useEffect(() => {
    if (!showBanner) return;
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 70, friction: 9 }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [showBanner, translateY, opacity]);

  useEffect(() => {
    if (phase !== 'downloading') return;
    sweep.setValue(0);
    const loop = Animated.loop(
      Animated.timing(sweep, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [phase, sweep]);

  const restart = () => {
    if (phase !== 'ready') return;
    setPhase('applying');
    fill.setValue(0);
    // Let the seller see the update being applied, then restart into it.
    Animated.timing(fill, { toValue: 0.9, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(async () => {
      try {
        await Updates.reloadAsync();
      } catch {
        setPhase('failed');
      }
    });
  };

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -80, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setDismissed(true));
  };

  const ready = phase === 'ready';
  const steps: { label: string; done: boolean; active: boolean }[] = [
    { label: 'Downloaded', done: true, active: false },
    { label: 'Applying update', done: false, active: phase === 'applying' },
    { label: 'Restarting Frontstore', done: false, active: false },
  ];

  return (
    <>
      {showBanner ? (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.container, { top: Math.max(insets.top + 8, 16), transform: [{ translateY }], opacity }]}
        >
          <View pointerEvents="auto" accessibilityLiveRegion="polite" className="overflow-hidden rounded-2xl border border-white/10 bg-ink" style={styles.toast}>
            <View className="flex-row items-center p-3">
              <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl border border-leaf/30 bg-deep">
                {ready ? <Sparkles size={18} color="#6FD3A4" /> : <Download size={18} color="#6FD3A4" />}
              </View>
              <View className="mr-2 flex-1">
                <T className="font-sans-bold text-xs text-white">{ready ? 'Update ready' : 'Downloading update…'}</T>
                <T className="font-sans text-[11px] text-on-dark" numberOfLines={2}>
                  {ready ? 'Takes a few seconds. Save anything you’re typing first.' : 'Keep using the app. We’ll tell you when it’s ready.'}
                </T>
              </View>
              {ready ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Restart to update"
                  onPress={restart}
                  className="h-8 min-w-[68px] items-center justify-center rounded-full bg-leaf px-3 active:opacity-80"
                >
                  <T className="font-sans-bold text-xs text-ink">Restart</T>
                </Pressable>
              ) : null}
              <Pressable accessibilityRole="button" accessibilityLabel={ready ? 'Later' : 'Hide'} onPress={dismiss} hitSlop={10} className="ml-2 h-7 w-7 items-center justify-center rounded-full active:opacity-60">
                <X size={16} color="#9FB3A9" />
              </Pressable>
            </View>
            {phase === 'downloading' ? (
              <View className="h-1 overflow-hidden bg-[#33504A]">
                <Animated.View
                  style={{
                    width: '40%',
                    height: '100%',
                    backgroundColor: '#6FD3A4',
                    transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-160, 400] }) }],
                  }}
                />
              </View>
            ) : (
              <View className="h-1 bg-leaf" />
            )}
          </View>
        </Animated.View>
      ) : null}

      <Modal visible={phase === 'applying' || phase === 'failed'} transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
        <View className="flex-1 items-center justify-center bg-[rgba(14,26,21,0.92)] px-8">
          <View accessibilityLiveRegion="polite" className="w-full max-w-[340px] gap-5 rounded-[24px] bg-ink p-6">
            <View className="h-12 w-12 items-center justify-center rounded-2xl border border-leaf/30 bg-deep">
              <Sparkles size={22} color="#6FD3A4" />
            </View>
            {phase === 'failed' ? (
              <>
                <View className="gap-1.5">
                  <T className="font-display text-[22px] text-white">Couldn’t restart</T>
                  <T className="text-sm text-on-dark">The update is downloaded. Close Frontstore and open it again to finish.</T>
                </View>
                <Pressable accessibilityRole="button" onPress={() => setPhase('ready')} className="h-12 items-center justify-center rounded-full bg-leaf">
                  <T className="font-sans-bold text-[15px] text-ink">OK</T>
                </Pressable>
              </>
            ) : (
              <>
                <View className="gap-1.5">
                  <T className="font-display text-[22px] text-white">Updating Frontstore</T>
                  <T className="text-sm text-on-dark">This takes a few seconds. Don’t close the app.</T>
                </View>
                <View className="h-2 overflow-hidden rounded-full bg-[#33504A]">
                  <Animated.View
                    style={{
                      height: '100%',
                      borderRadius: 999,
                      backgroundColor: '#6FD3A4',
                      width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                    }}
                  />
                </View>
                <View className="gap-2.5">
                  {steps.map((s) => (
                    <View key={s.label} className="flex-row items-center gap-2.5">
                      <View className={s.done ? 'h-5 w-5 items-center justify-center rounded-full bg-leaf' : s.active ? 'h-5 w-5 rounded-full border-2 border-leaf' : 'h-5 w-5 rounded-full border-2 border-[#33504A]'}>
                        {s.done ? <Check size={12} color="#0E1A15" strokeWidth={3} /> : null}
                      </View>
                      <T className={s.done || s.active ? 'font-sans-semibold text-sm text-white' : 'text-sm text-on-dark-2'}>{s.label}</T>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
  },
  toast: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
});
