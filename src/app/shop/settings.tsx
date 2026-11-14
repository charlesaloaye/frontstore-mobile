import { useState, useEffect } from 'react';
import { Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/ui';
import { AccountHeader, Group, LinkRow, SwitchRow } from '@/features/buyer/account';
import { getNotificationPreferences, updateNotificationPreferences } from '@/api/buyer';
import { PrivacyActions } from '@/features/account/PrivacyActions';

type NoteKey = 'orderWa' | 'orderEmail' | 'push' | 'drops' | 'prices';

const NOTES: [NoteKey, string, string][] = [
  ['orderWa', 'Order updates on WhatsApp', 'Paid, shipped, out for delivery'],
  ['orderEmail', 'Order emails and receipts', 'Sent to registered email'],
  ['push', 'App notifications', 'On this phone'],
  ['drops', 'New drops from stores I follow', 'At most one a week per store'],
  ['prices', 'Price drops on saved items', ''],
];

export default function BuyerSettings() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: prefs } = useQuery({ queryKey: ['notification-preferences'], queryFn: getNotificationPreferences });

  const [notes, setNotes] = useState<Record<NoteKey, boolean>>({
    orderWa: true,
    orderEmail: true,
    push: true,
    drops: false,
    prices: true,
  });

  useEffect(() => {
    if (prefs) {
      setNotes({
        orderWa: prefs.whatsapp_order_updates ?? true,
        orderEmail: prefs.email_notifications ?? true,
        push: prefs.push_notifications ?? true,
        drops: prefs.new_drops ?? false,
        prices: prefs.price_drops ?? true,
      });
    }
  }, [prefs]);

  const updateMutation = useMutation({
    mutationFn: (updated: Partial<Record<NoteKey, boolean>>) => {
      const current = { ...notes, ...updated };
      return updateNotificationPreferences({
        whatsapp_order_updates: current.orderWa,
        email_notifications: current.orderEmail,
        push_notifications: current.push,
        new_drops: current.drops,
        price_drops: current.prices,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });

  const handleToggle = (k: NoteKey, val: boolean) => {
    setNotes((n) => ({ ...n, [k]: val }));
    updateMutation.mutate({ [k]: val });
  };

  return (
    <Screen>
      <AccountHeader title="Settings" />
      <ScrollView contentContainerClassName="gap-4 px-4 pt-2" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <Group title="Notifications">
          {/* No push on Android (no Firebase), so no app-notification switch there. */}
          {NOTES.filter(([k]) => k !== 'push' || Platform.OS === 'ios').map(([k, label, sub]) => (
            <SwitchRow key={k} label={label} sub={sub || undefined} value={notes[k]} onChange={(v) => handleToggle(k, v)} />
          ))}
        </Group>

        <Group title="Login & security">
          <LinkRow label="Login codes" value="Email or WhatsApp" />
        </Group>

        <Group title="Privacy">
          <PrivacyActions />
        </Group>
      </ScrollView>
    </Screen>
  );
}
