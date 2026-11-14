import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { T } from './ui';
type Item = { name: string; label: string; Icon: React.ComponentType<any> };

/**
 * White bottom tab bar from the designs (green active label, grey inactive).
 * If `centerHref` is set, a dark square "+" button sits in the middle (seller mode).
 */
export function makeTabBar(items: Item[], centerHref?: string) {
  return function TabBar({ state, navigation }: { state: any; navigation: any }) {
    const insets = useSafeAreaInsets();
    const nodes = items.map((it) => {
      const index = state.routes.findIndex((r: any) => r.name === it.name);
      const active = state.index === index;
      const color = active ? '#07261C' : '#5B6660';
      return (
        <Pressable
          key={it.name}
          accessibilityRole="tab"
          accessibilityState={{ selected: active }}
          onPress={() => navigation.navigate(it.name)}
          className="w-16 items-center gap-1"
        >
          <it.Icon size={24} color={color} strokeWidth={2} />
          <T style={{ color }} className={active ? 'font-sans-bold text-[11px]' : 'font-sans-semibold text-[11px]'}>{it.label}</T>
        </Pressable>
      );
    });
    if (centerHref) {
      nodes.splice(
        Math.floor(nodes.length / 2),
        0,
        <Pressable key="add" accessibilityLabel="Add product" onPress={() => router.push(centerHref as never)} className="h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-deep">
          <Plus size={24} color="#F6F3EC" strokeWidth={2.4} />
        </Pressable>,
      );
    }
    return (
      <View style={{ paddingBottom: Math.max(insets.bottom, 12) }} className="flex-row items-start justify-around border-t border-line bg-surface pt-2">
        {nodes}
      </View>
    );
  };
}
