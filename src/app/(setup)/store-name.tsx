import { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, ChevronDown, Globe, X } from 'lucide-react-native';
import { Button, Screen, T } from '@/components/ui';
import { BottomBar, Heading, Labelled, Progress, RingInput, StepHeader } from '@/features/setup/parts';
import { toSlug, updateDraft, useDraft } from '@/features/setup/draft';
import { checkSubdomainAvailable, getCountries, detectLocation } from '@/api/store';
import { Country } from '@/api/types';
import { SearchableSelectModal, SelectItem } from '@/components/SearchableSelectModal';

function getCountryFlag(code?: string): string {
  if (!code || code.length !== 2) return '🌍';
  try {
    const upper = code.toUpperCase();
    const codePoints = [...upper].map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌍';
  }
}

export default function StoreName() {
  const draft = useDraft();
  const { name, country_code, country_name, currency_code } = draft;
  const { setup_token } = useLocalSearchParams<{ setup_token?: string }>();
  const activeToken = setup_token || draft.setup_token;

  const handleBack = () => {
    router.replace({
      pathname: '/choose-mode',
      params: {
        setup_token: activeToken || '',
        initial_mode: 'sell',
      },
    });
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [activeToken]);

  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  // Capture setup token from route params if provided
  useEffect(() => {
    if (setup_token) {
      updateDraft({ setup_token });
    }
  }, [setup_token]);

  // Load countries and detect location
  useEffect(() => {
    setLoadingCountries(true);
    getCountries()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCountries(data);
          // If no country chosen yet, attempt to detect or default to detected/Nigeria
          if (!country_code) {
            detectLocation()
              .then((loc) => {
                const match = data.find((c) => c.code.toUpperCase() === loc.country_code?.toUpperCase());
                if (match) {
                  updateDraft({
                    country_code: match.code,
                    country_name: match.name,
                    currency_code: match.default_currency,
                    city: match.name,
                  });
                }
              })
              .catch(() => {
                const defaultCountry = data.find((c) => c.code === 'NG') || data[0];
                if (defaultCountry) {
                  updateDraft({
                    country_code: defaultCountry.code,
                    country_name: defaultCountry.name,
                    currency_code: defaultCountry.default_currency,
                    city: defaultCountry.name,
                  });
                }
              });
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to load countries:', err);
      })
      .finally(() => {
        setLoadingCountries(false);
      });
  }, []);

  const slug = toSlug(name);
  const ok = name.trim().length > 0 && available !== false;

  useEffect(() => {
    if (!slug || slug.length < 3) {
      setAvailable(null);
      setChecking(false);
      return;
    }

    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const isAvail = await checkSubdomainAvailable(slug);
        setAvailable(isAvail);
      } catch {
        setAvailable(true); // fallback
      } finally {
        setChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [slug]);

  const selectItems: SelectItem[] = useMemo(() => {
    return countries.map((c) => ({
      id: c.code,
      title: c.name,
      subtitle: `Default Currency: ${c.default_currency}`,
      badge: c.default_currency,
      icon: (
        <T className="text-xl">{getCountryFlag(c.code)}</T>
      ),
      metadata: c,
    }));
  }, [countries]);

  const selectedDisplay = country_name || countries.find((c) => c.code === country_code)?.name || 'Select country';
  const selectedFlag = getCountryFlag(country_code);

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <StepHeader onBack={handleBack} fallback="/choose-mode" label="Step 2 of 5" />
        <Progress pct={40} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5 pt-7 pb-6">
          <Heading title="Name your store" sub="This is what customers see. You can change it later." />
          <Labelled label="Store name">
            <RingInput
              autoFocus
              value={name}
              onChangeText={(v) => updateDraft({ name: v })}
              accessibilityLabel="Store name"
              autoCapitalize="words"
              maxLength={60}
            />
          </Labelled>
          <Labelled label="Store link">
            <View
              accessible
              accessibilityLabel={`Store link: frontstore.app/${slug || 'yourstore'}`}
              className="h-[54px] flex-row items-center rounded-[14px] border border-line-2 bg-surface pl-4 pr-3.5"
            >
              <T numberOfLines={1} className="shrink text-base">
                <T className="text-base text-muted">frontstore.app/</T>
                <T className="font-sans-bold text-base">{slug || 'yourstore'}</T>
              </T>
            </View>
            {checking ? (
              <View className="flex-row items-center gap-1.5">
                <ActivityIndicator size="small" color="#0B6E4F" />
                <T className="font-sans-medium text-[13px] text-muted">Checking availability...</T>
              </View>
            ) : available === true && slug.length >= 3 ? (
              <View className="flex-row items-center gap-1.5">
                <Check size={14} color="#0B6E4F" strokeWidth={3} />
                <T className="font-sans-bold text-[13px] text-green">Available</T>
              </View>
            ) : available === false ? (
              <View className="flex-row items-center gap-1.5">
                <X size={14} color="#DC2626" strokeWidth={3} />
                <T className="font-sans-bold text-[13px] text-red-600">Already taken</T>
              </View>
            ) : null}
          </Labelled>

          <View className="gap-2.5">
            <T className="font-sans-bold text-sm">Where is your business based?</T>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Country: ${selectedDisplay}`}
              onPress={() => setModalOpen(true)}
              className="h-[54px] flex-row items-center justify-between rounded-[14px] border border-line-2 bg-surface px-4"
            >
              <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                <T className="text-xl">{selectedFlag}</T>
                <T className="text-base font-sans-medium text-ink flex-1" numberOfLines={1}>
                  {selectedDisplay}
                </T>
                {currency_code ? (
                  <View className="rounded-full bg-mint/50 px-2 py-0.5">
                    <T className="text-xs font-sans-bold text-green">{currency_code}</T>
                  </View>
                ) : null}
              </View>
              <ChevronDown size={18} color="#5B6660" strokeWidth={2} />
            </Pressable>
          </View>
        </ScrollView>

        <SearchableSelectModal
          visible={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Select Country"
          subtitle="Choose where your business is registered and operates"
          placeholder="Search country or currency..."
          items={selectItems}
          selectedId={country_code}
          loading={loadingCountries}
          onSelect={(item) => {
            const country = item.metadata as Country;
            updateDraft({
              country_code: country.code,
              country_name: country.name,
              currency_code: country.default_currency,
              city: country.name,
            });
          }}
        />

        <BottomBar>
          <Button title="Continue" href="/store-style" disabled={!ok || checking} />
        </BottomBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
