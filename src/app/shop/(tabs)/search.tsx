import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Pressable, TextInput, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Check, Search, ShieldCheck, Star } from 'lucide-react-native';
import { Screen, T, cx } from '@/components/ui';
import { Avatar, ChipRow } from '@/features/buyer/parts';
import { getMarketplaceStoresPaginated } from '@/api/buyer';
import { Store } from '@/api/types';

const FILTERS = ['All', 'Stores', 'Fashion', 'Food', 'Beauty', 'Gadgets', 'Lagos', 'Under ₦20k'];

export default function BuyerSearch() {
  const params = useLocalSearchParams<{ filter?: string; q?: string }>();
  const [q, setQ] = useState(params.q || '');
  const [focused, setFocused] = useState(false);
  const [filter, setFilter] = useState(params.filter || 'All');
  const input = useRef<TextInput>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['marketplace-search-infinite', q, filter],
    queryFn: ({ pageParam = 1 }) =>
      getMarketplaceStoresPaginated({
        search: q.trim() || undefined,
        filter: filter === 'All' || filter === 'Stores' ? undefined : filter,
        category:
          filter !== 'All' && filter !== 'Stores' && filter !== 'Under ₦20k' && filter !== 'Lagos'
            ? filter
            : undefined,
        page: pageParam,
        per_page: 15,
      }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.currentPage + 1 : undefined),
    initialPageParam: 1,
  });

  const stores = useMemo(() => {
    return data?.pages.flatMap((page) => page.stores) ?? [];
  }, [data]);

  const totalCount = data?.pages?.[0]?.total ?? stores.length;

  const cancel = () => {
    setQ('');
    input.current?.blur();
    Keyboard.dismiss();
  };

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderStoreItem = ({ item: s }: { item: Store }) => {
    const displayName = s.name || s.store_name || 'Store';
    const displaySlug = s.slug || s.username || String(s.id);
    const displayInitial = displayName[0] || 'S';
    const displayColor = s.primary_color || s.store_color || '#0B6E4F';
    const itemsCount = (s as any).items_count ?? (s as any).items ?? 0;
    const rating = (s as any).reviews_avg_rating ?? (s as any).rating;
    const isVerified = (s as any).is_verified;

    return (
      <Link key={displaySlug} href={`/shop/store/${displaySlug}`} asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`${displayName}, ${s.location || 'Nigeria'}`}
          className="flex-row items-center gap-3.5 rounded-[20px] border border-line bg-surface p-3.5 active:bg-sand/40"
        >
          <Avatar initial={displayInitial} color={displayColor} size={50} radius={16} fontSize={18} />
          <View className="flex-1 gap-0.5">
            <View className="flex-row items-center gap-1.5">
              <T className="font-sans-bold text-[15px] text-ink" numberOfLines={1}>
                {displayName}
              </T>
              {isVerified ? (
                <View className="h-4 w-4 items-center justify-center rounded-full bg-leaf">
                  <Check size={10} color="#FFFFFF" strokeWidth={3} />
                </View>
              ) : null}
            </View>

            {s.store_bio ? (
              <T className="text-xs text-muted-2" numberOfLines={1}>
                {s.store_bio}
              </T>
            ) : null}

            <View className="flex-row items-center gap-2 pt-0.5">
              <T className="text-[12px] text-muted">{s.location || 'Nigeria'}</T>
              {itemsCount > 0 ? (
                <>
                  <T className="text-[12px] text-muted">·</T>
                  <T className="text-[12px] text-muted">{itemsCount} items</T>
                </>
              ) : null}
              {rating ? (
                <>
                  <T className="text-[12px] text-muted">·</T>
                  <View className="flex-row items-center gap-0.5">
                    <Star size={11} color="#E9A23B" fill="#E9A23B" />
                    <T className="font-sans-bold text-[12px] text-ink">{Number(rating).toFixed(1)}</T>
                  </View>
                </>
              ) : null}
            </View>
          </View>
        </Pressable>
      </Link>
    );
  };

  return (
    <Screen>
      <View className="gap-3.5 px-4 pt-3 pb-2">
        <View className={cx('h-[50px] flex-row items-center gap-2.5 rounded-[14px] border-[1.5px] bg-surface pl-3.5 pr-3', focused || q ? 'border-green' : 'border-line')}>
          <Search size={18} color="#5B6660" strokeWidth={2} />
          <TextInput
            ref={input}
            value={q}
            onChangeText={setQ}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search stores, categories or location"
            placeholderTextColor="#8A928E"
            accessibilityLabel="Search"
            returnKeyType="search"
            autoCorrect={false}
            className="h-full min-w-0 flex-1 font-sans text-base text-ink"
          />
          {focused || q ? (
            <Pressable accessibilityRole="button" onPress={cancel} hitSlop={12}>
              <T className="font-sans-bold text-sm text-green">Cancel</T>
            </Pressable>
          ) : null}
        </View>
        <ChipRow options={FILTERS} value={filter} onChange={setFilter} px={12} />
      </View>

      <FlatList
        data={stores}
        keyExtractor={(item) => item.slug || item.username || String(item.id)}
        renderItem={renderStoreItem}
        contentContainerClassName="gap-3 px-4 pb-8 pt-2"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListHeaderComponent={
          stores.length > 0 ? (
            <View className="flex-row items-center justify-between pb-1">
              <T className="font-sans-bold text-xs text-muted-2">
                STORES ({totalCount})
              </T>
              {hasNextPage ? (
                <T className="text-xs text-muted">Scroll for more</T>
              ) : null}
            </View>
          ) : null
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="items-center py-4">
              <ActivityIndicator size="small" color="#0B6E4F" />
              <T className="mt-1 text-xs text-muted">Loading more stores...</T>
            </View>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator size="large" color="#0B6E4F" />
              <T className="mt-2 text-sm text-muted">Loading stores...</T>
            </View>
          ) : (
            <View className="items-center gap-1.5 pt-16 px-6">
              <T className="font-display text-lg text-center">
                No stores found{q ? ` for “${q.trim()}”` : ''}
              </T>
              <T className="text-center text-sm text-muted">
                Try adjusting your search terms or selecting a different filter.
              </T>
            </View>
          )
        }
      />
    </Screen>
  );
}
