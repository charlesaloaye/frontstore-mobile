import { useEffect, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { createAiProductDraft, getAiProductDraftStatus, uploadProductImage } from '@/api/products';

export const MAX_PHOTOS = 3;
const POLL_MS = 2000;
const POLL_LIMIT = 30; // about a minute

export type PhotoDraftResult = {
  name?: string;
  priceNaira?: string;
  category?: string;
  description?: string;
  colours?: string[];
  priceRange?: [number, number] | null;
};

export type DraftStatus = 'idle' | 'uploading' | 'reading' | 'done' | 'failed' | 'manual';

type Photo = { uri: string; url?: string };

/**
 * Real photo-to-product flow: pick photos (camera or gallery), upload them,
 * ask the AI to read them, and hand the result back. Nothing is made up: if a
 * step fails the seller fills the form in themselves.
 *
 * `prepare` runs before the first upload (onboarding uses it to create the
 * store, which is what gives the app a login to upload with).
 */
export function usePhotoDraft({ prepare, onResult }: { prepare?: () => Promise<boolean>; onResult: (r: PhotoDraftResult) => void }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [status, setStatus] = useState<DraftStatus>('idle');
  const [message, setMessage] = useState('');
  const cancelled = useRef(false);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; cancelled.current = true; }, []);

  const pick = async (source: 'camera' | 'library') => {
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) return;
    setMessage('');
    try {
      const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setMessage(source === 'camera' ? 'Allow camera access in your phone settings to take a photo.' : 'Allow photo access in your phone settings to choose a photo.');
        return;
      }
      const res = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: room > 1, selectionLimit: room, quality: 0.8 });
      if (res.canceled || !res.assets?.length) return;

      const added = res.assets.slice(0, room).map((a) => ({ uri: a.uri }));
      const isFirst = photos.length === 0;
      const next = [...photos, ...added];
      setPhotos(next);
      const uploaded = await upload(next);
      if (uploaded && isFirst) await analyse(uploaded);
    } catch (e: any) {
      setMessage(e?.message || 'Could not open your photos. Please try again.');
    }
  };

  /** Upload any photo not uploaded yet. Returns the full list, or null if nothing could be uploaded. */
  const upload = async (list: Photo[]): Promise<Photo[] | null> => {
    if (prepare && !list.some((p) => p.url)) {
      setStatus('uploading');
      const ok = await prepare();
      if (!ok) {
        setStatus('failed');
        return null;
      }
    }
    setStatus((s) => (s === 'idle' || s === 'failed' ? 'uploading' : s));
    const out = await Promise.all(
      list.map(async (p) => {
        if (p.url) return p;
        try {
          const r: any = await uploadProductImage(p.uri);
          const url = r?.url || r?.data?.url;
          return url ? { ...p, url } : p;
        } catch {
          return p;
        }
      }),
    );
    if (!alive.current) return null;
    const good = out.filter((p) => p.url);
    setPhotos(good);
    if (good.length < out.length) {
      setMessage(good.length ? 'Some photos could not be uploaded. Try adding them again.' : 'Your photo could not be uploaded. Check your connection and try again.');
    }
    if (!good.length) {
      setStatus('idle');
      return null;
    }
    setStatus((s) => (s === 'uploading' ? 'manual' : s));
    return good;
  };

  /** Ask the AI to read the uploaded photos, polling until it finishes. */
  const analyse = async (list: Photo[] = photos) => {
    const urls = list.map((p) => p.url).filter(Boolean) as string[];
    if (!urls.length) return;
    cancelled.current = false;
    setStatus('reading');
    setMessage('');
    try {
      const { job_id } = await createAiProductDraft(urls);
      for (let i = 0; i < POLL_LIMIT; i++) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        if (cancelled.current || !alive.current) return;
        const d = await getAiProductDraftStatus(job_id);
        if (d.status === 'completed') {
          onResult({
            name: d.title || '',
            priceNaira: d.suggested_price_kobo ? String(Math.round(d.suggested_price_kobo / 100)) : '',
            category: d.category || '',
            description: d.description || '',
            colours: d.colors || [],
            priceRange: d.price_min_kobo && d.price_max_kobo ? [Math.round(d.price_min_kobo / 100), Math.round(d.price_max_kobo / 100)] : null,
          });
          setStatus('done');
          return;
        }
        if (d.status === 'failed') break;
      }
      if (!cancelled.current) {
        setStatus('failed');
        setMessage('Nina couldn’t read this photo. Fill in the details yourself.');
      }
    } catch (e: any) {
      if (!alive.current) return;
      setStatus('failed');
      // e.g. the plan's AI limit is used up: the server says so.
      setMessage(e?.message || 'Nina couldn’t read this photo. Fill in the details yourself.');
    }
  };

  /** Stop waiting for the AI and fill the form in by hand. */
  const skip = () => {
    cancelled.current = true;
    setStatus('manual');
  };

  const removePhoto = (i: number) => setPhotos((p) => p.filter((_, j) => j !== i));

  return {
    photos,
    status,
    message,
    pick,
    analyse: () => analyse(),
    skip,
    removePhoto,
    imageUrls: photos.map((p) => p.url).filter(Boolean) as string[],
    busy: status === 'uploading' || status === 'reading',
    formOpen: status === 'done' || status === 'failed' || status === 'manual',
  };
}

/** "18,500" / "₦18,500" -> 18500, or null when it isn't a positive amount. */
export function parseNaira(v: string): number | null {
  const n = Number(String(v).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}
