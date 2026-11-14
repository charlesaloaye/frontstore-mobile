import { useSyncExternalStore } from 'react';

export type PayoutDraft = {
  bank: string;
  bankCode: string;
  account: string;
  accountName: string;
};

/** In-memory store-setup draft shared by the (setup) screens. */
export type SetupDraft = {
  name: string;
  city: string;
  country_code?: string;
  country_name?: string;
  currency_code?: string;
  color: string;
  category: string;
  payout?: PayoutDraft;
  setup_token?: string;
  owner_name?: string;
  email?: string;
  phone_number?: string;
  /** Local logo image; uploaded once setup has created the store. */
  logo_uri?: string;
};

let draft: SetupDraft = {
  name: '',
  city: 'Nigeria',
  country_code: 'NG',
  country_name: 'Nigeria',
  currency_code: 'NGN',
  color: '#0B6E4F',
  category: 'Fashion',
};
const listeners = new Set<() => void>();

export function updateDraft(patch: Partial<SetupDraft>) {
  draft = { ...draft, ...patch };
  listeners.forEach((l) => l());
}

export function useDraft(): SetupDraft {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    () => draft,
  );
}

/** "Mama V" -> "mamav" (strip accents, keep a-z0-9, max 30). */
export function toSlug(name: string) {
  return (
    name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30) || 'yourstore'
  );
}

/** First letter for the logo tile, keeping accents ("Mama V" -> "M"). */
export function initialOf(name: string) {
  const first = Array.from(name.trim().normalize('NFC'))[0];
  return (first ?? 'F').toUpperCase();
}
