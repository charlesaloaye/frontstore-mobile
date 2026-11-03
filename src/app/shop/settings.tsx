import { useState, useEffect } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/ui';
import { AccountHeader, Group, SwitchRow } from '@/features/buyer/account';
import { PrivacyRows } from '@/features/account/PrivacyRows';
import { getNotificationPreferences, updateNotificationPreferences } from '@/api/buyer';

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
        orderWa: prefs.order_whatsapp ?? true,
        orderEmail: prefs.order_email ?? true,
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
        order_whatsapp: current.orderWa,
        order_email: current.orderEmail,
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
          {NOTES.map(([k, label, sub]) => (
            <SwitchRow key={k} label={label} sub={sub || undefined} value={notes[k]} onChange={(v) => handleToggle(k, v)} />
          ))}
        </Group>

        <Group title="Privacy">
          <PrivacyRows kind="buyer" />
        </Group>
      </ScrollView>
    </Screen>
  );
}
