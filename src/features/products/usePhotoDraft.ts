import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { createAiProductDraft, getAiProductDraftStatus, uploadProductImage } from '@/api/products';
import type { AiProductDraftResult } from '@/api/types';

export type PhotoStage = 'empty' | 'reading' | 'filled';
export type Photo = { uri: string; url: string };

const MAX_PHOTOS = 3;
const POLL_MS = 1000;
// The backend queue worker runs once a minute, so allow for that wait.
const GIVE_UP_MS = 90000;

/**
 * Photo-first product drafting: pick from camera or gallery, upload, ask the
 * AI draft job to read the photos, then hand the result to `onDraft`.
 * If the AI can't read them (failed or slow), the form opens empty instead.
 */
export function usePhotoDraft(onDraft: (draft: AiProductDraftResult) => void) {
  const [stage, setStage] = useState<PhotoStage>('empty');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);
  const onDraftRef = useRef(onDraft);
  onDraftRef.current = onDraft;

  const stopPolling = () => {
    if (poll.current) clearInterval(poll.current);
    poll.current = null;
  };
  useEffect(() => stopPolling, []);

  const readPhotos = async (urls: string[]) => {
    stopPolling();
    setStage('reading');
    try {
      const { job_id } = await createAiProductDraft(urls);
      const startedAt = Date.now();
      poll.current = setInterval(async () => {
        try {
          const result = await getAiProductDraftStatus(job_id);
          if (result.status === 'completed') {
            stopPolling();
            onDraftRef.current(result);
            setStage('filled');
          } else if (result.status === 'failed' || Date.now() - startedAt > GIVE_UP_MS) {
            stopPolling();
            setError('Nina couldn’t read these photos. Fill in the details yourself.');
            setStage('filled');
          }
        } catch {
          // Network blip: keep polling until the give-up time.
          if (Date.now() - startedAt > GIVE_UP_MS) {
            stopPolling();
            setError('Nina couldn’t read these photos. Fill in the details yourself.');
            setStage('filled');
          }
        }
      }, POLL_MS);
    } catch (e: any) {
      setError(e.message || 'Nina couldn’t read these photos. Fill in the details yourself.');
      setStage('filled');
    }
  };

  const addFrom = async (source: 'camera' | 'library') => {
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0 || uploading) return;
    setError(null);

    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setError('Allow camera access in Settings to take product photos.');
        return;
      }
    }

    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 };
    const res = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync({ ...options, allowsMultipleSelection: true, selectionLimit: room });
    if (res.canceled || !res.assets?.length) return;

    setUploading(true);
    const uris = res.assets.slice(0, room).map((a) => a.uri);
    const results = await Promise.allSettled(uris.map((uri) => uploadProductImage(uri)));
    setUploading(false);

    const added: Photo[] = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value?.url) added.push({ uri: uris[i], url: r.value.url });
    });
    if (added.length < uris.length) {
      setError(added.length ? 'Some photos didn’t upload. Try those again.' : 'Photos didn’t upload. Check your connection and try again.');
    }
    if (!added.length) return;

    const next = [...photos, ...added];
    setPhotos(next);
    // Only the first batch is read by AI; later photos just get added.
    if (stage === 'empty') readPhotos(next.map((p) => p.url));
  };

  /** Ask camera or gallery, like the share sheet in the designs. */
  const pick = () => {
    Alert.alert('Add product photos', undefined, [
      { text: 'Take a photo', onPress: () => addFrom('camera') },
      { text: 'Choose from gallery', onPress: () => addFrom('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const remove = (uri: string) => setPhotos((ps) => ps.filter((p) => p.uri !== uri));

  /** Re-run the AI on the current photos. */
  const reread = () => photos.length && readPhotos(photos.map((p) => p.url));

  /** Skip the AI and fill the form by hand. */
  const skip = () => {
    stopPolling();
    setStage('filled');
  };

  return {
    stage, photos, uploading, error, pick, remove, reread, skip,
    canAddMore: photos.length < MAX_PHOTOS,
    imageUrls: photos.map((p) => p.url),
  };
}
