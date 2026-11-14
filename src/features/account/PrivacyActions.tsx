import { useState } from 'react';
import { ActivityIndicator, Share, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, T } from '@/components/ui';
import { BottomSheet, LinkRow, SheetField } from '@/features/buyer/account';
import { deleteAccount, exportMyData, getDeleteAccountPreview } from '@/api/auth';

/**
 * "Download my data" and "Delete my account" rows plus the delete sheet.
 * Required by the App Store and Play Store; used on both settings screens.
 */
export function PrivacyActions() {
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [typed, setTyped] = useState('');

  const exportMutation = useMutation({
    mutationFn: exportMyData,
    onSuccess: (data) => Share.share({ title: 'My Frontstore data', message: JSON.stringify(data, null, 2) }),
  });

  const { data: preview, isLoading: previewLoading } = useQuery({
    queryKey: ['delete-account-preview'],
    queryFn: getDeleteAccountPreview,
    enabled: deleteOpen,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      setDeleteOpen(false);
      queryClient.clear();
      router.replace('/welcome');
    },
  });

  const close = () => {
    setDeleteOpen(false);
    setTyped('');
    deleteMutation.reset();
  };

  const storeNames = preview?.stores.map((s) => s.name).join(', ');

  return (
    <>
      <LinkRow
        label="Download my data"
        value={exportMutation.isPending ? 'Preparing…' : exportMutation.isError ? 'Try again' : undefined}
        onPress={() => !exportMutation.isPending && exportMutation.mutate()}
      />
      <LinkRow label="Delete my account" danger onPress={() => setDeleteOpen(true)} />

      <BottomSheet visible={deleteOpen} onClose={close}>
        <View className="gap-3 py-1">
          <T className="font-display text-xl">Delete your account?</T>

          {previewLoading || !preview ? (
            <ActivityIndicator color="#0B6E4F" />
          ) : !preview.can_delete ? (
            <View className="gap-2">
              <T className="text-[15px] leading-[22px] text-muted-2">Before you can delete your account:</T>
              {preview.blockers.map((b) => (
                <T key={b} className="text-[15px] leading-[22px] text-danger">• {b}</T>
              ))}
              <Button title="OK" kind="dark" className="h-12" onPress={close} />
            </View>
          ) : (
            <View className="gap-3">
              <T className="text-[15px] leading-[22px] text-muted-2">
                This signs you out everywhere and can’t be undone.
                {storeNames ? ` Your store ${storeNames} and its products will be removed.` : ''}
                {preview.keeps_orders
                  ? ` Your ${preview.paid_orders} paid ${preview.paid_orders === 1 ? 'order is' : 'orders are'} kept as sales records, without your name or contact details.`
                  : ''}
              </T>
              <SheetField label='Type DELETE to confirm' autoCapitalize="characters" value={typed} onChangeText={setTyped} placeholder="DELETE" />
              {deleteMutation.isError ? (
                <T className="text-sm text-danger">{(deleteMutation.error as Error).message}</T>
              ) : null}
              <Button
                title={deleteMutation.isPending ? 'Deleting…' : 'Delete my account'}
                kind="danger"
                className="h-12"
                disabled={typed.trim() !== 'DELETE' || deleteMutation.isPending}
                onPress={() => deleteMutation.mutate()}
              />
              <Button title="Keep my account" kind="ghost" className="h-12" onPress={close} />
            </View>
          )}
        </View>
      </BottomSheet>
    </>
  );
}
