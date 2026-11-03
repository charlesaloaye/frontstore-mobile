import { useState } from 'react';
import { ActivityIndicator, Share, View } from 'react-native';
import { Button, T } from '@/components/ui';
import { BottomSheet, LinkRow, SheetField } from '@/features/buyer/account';
import { deleteAccount, deletionBlockers, exportAccountData, type AccountKind } from '@/api/account';

/**
 * "Download my data" and "Delete my account". Apple and Google both require
 * that people can delete their account from inside the app.
 */
export function PrivacyRows({ kind }: { kind: AccountKind }) {
  const [exporting, setExporting] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [checking, setChecking] = useState(false);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const download = async () => {
    setExporting(true);
    try {
      const data = await exportAccountData(kind);
      await Share.share({ title: 'My Frontstore data', message: JSON.stringify(data, null, 2) });
    } catch (e: any) {
      setError(e?.message || 'Could not prepare your data. Please try again.');
      setSheet(false);
    } finally {
      setExporting(false);
    }
  };

  const openDelete = async () => {
    setTyped('');
    setError('');
    setBlockers([]);
    setSheet(true);
    if (kind === 'seller') {
      setChecking(true);
      setBlockers(await deletionBlockers());
      setChecking(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await deleteAccount(kind);
    } catch (e: any) {
      setError(e?.message || 'Could not delete your account. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <>
      <LinkRow label="Download my data" value={exporting ? 'Preparing…' : undefined} onPress={exporting ? undefined : download} />
      <LinkRow label="Delete my account" danger onPress={openDelete} />
      {error && !sheet ? <T className="px-[18px] py-3 text-[13px] text-danger">{error}</T> : null}

      <BottomSheet visible={sheet} onClose={() => !deleting && setSheet(false)}>
        <View className="gap-3 py-1">
          <T className="font-display text-xl">Delete your account?</T>
          {checking ? (
            <ActivityIndicator />
          ) : blockers.length > 0 ? (
            <>
              <T className="text-[15px] leading-[22px] text-muted-2">You can’t delete your account yet:</T>
              {blockers.map((b) => <T key={b} className="text-[15px] leading-[22px] text-ink">• {b}</T>)}
              <Button title="OK" className="h-12" onPress={() => setSheet(false)} />
            </>
          ) : (
            <>
              <T className="text-[15px] leading-[22px] text-muted-2">
                {kind === 'seller'
                  ? 'This permanently deletes your account and your store. Records of paid orders are kept, as the law requires.'
                  : 'This permanently deletes your shopper account. Stores keep the records of orders you placed with them.'}
              </T>
              <SheetField label="Type DELETE to confirm" autoCapitalize="characters" autoCorrect={false} value={typed} onChangeText={setTyped} placeholder="DELETE" />
              {error ? <T className="text-[13px] text-danger">{error}</T> : null}
              <Button
                title={deleting ? 'Deleting…' : 'Delete my account'}
                kind="danger"
                className="h-12"
                disabled={typed.trim() !== 'DELETE' || deleting}
                onPress={confirmDelete}
              />
              <Button title="Cancel" kind="ghost" className="h-12" disabled={deleting} onPress={() => setSheet(false)} />
            </>
          )}
        </View>
      </BottomSheet>
    </>
  );
}
