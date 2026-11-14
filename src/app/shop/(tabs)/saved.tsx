import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Link } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen, T } from '@/components/ui';
import { naira } from '@/lib/format';
import { Avatar, HeartToggle, Segmented, useTileWidth } from '@/features/buyer/parts';
import { getSavedProducts, getFollowedStores, toggleSaveProduct } from '@/api/buyer';

type Tab = 'prod' | 'stores';
export default function BuyerSaved() {
  const [tab, setTab] = useState<Tab>('prod');
  const tile = useTileWidth();
  const queryClient = useQueryClient();

  const { data: liveSavedProducts = [], isLoading: loadingProducts, isRefetching: refetchingProducts, refetch: refetchProducts } = useQuery({ queryKey: ['saved-products'], queryFn: getSavedProducts });
  const { data: liveFollowedStores = [], isLoading: loadingStores, isRefetching: refetchingStores, refetch: refetchStores } = useQuery({ queryKey: ['followed-stores'], queryFn: getFollowedStores });

  const toggleSaveMutation = useMutation({
    mutationFn: (productId: number | string) => toggleSaveProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-products'] });
    },
  });

  const productsCount = liveSavedProducts.length;
  const storesCount = liveFollowedStores.length;
  const isRefreshing = refetchingProducts || refetchingStores;

  const handleRefresh = () => {
    refetchProducts();
    refetchStores();
  };

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="gap-3.5 px-4 pb-6 pt-3"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#0B6E4F" />}
      >
        <T className="font-display-x text-[30px] tracking-[-0.6px]">Saved</T>
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[{ key: 'prod', label: `Products · ${productsCount}` }, { key: 'stores', label: `Stores · ${storesCount}` }]}
        />

        {tab === 'prod' ? (
          loadingProducts ? (
            <View className="items-center py-12">
              <ActivityIndicator size="small" color="#0B6E4F" />
              <T className="mt-2 text-xs text-muted">Loading saved products...</T>
            </View>
          ) : liveSavedProducts.length === 0 ? (
            <T className="py-8 text-center text-sm text-muted">No saved products yet.</T>
          ) : (
            <View className="flex-row flex-wrap gap-x-3 gap-y-4">
              {liveSavedProducts.map((p) => {
                const storeSlug = p.store?.slug || p.store?.username || '';
                const storeName = p.store?.name || p.store?.store_name || 'Store';
                return (
                  <Link key={p.id} href={`/shop/store/${storeSlug}`} asChild>
                    <Pressable accessibilityRole="link" accessibilityLabel={`${p.name}, ${storeName}, ${naira(p.price)}`} style={{ width: tile }} className="gap-1">
                      <View style={{ backgroundColor: p.primary_color || '#B5838D' }} className="h-[150px] rounded-2xl overflow-hidden relative">
                        {p.image_url || p.images?.[0] ? (
                          <Image source={{ uri: (p.image_url || p.images?.[0])! }} className="h-full w-full" resizeMode="cover" />
                        ) : null}
                        <HeartToggle on={true} label={p.name} onToggle={() => toggleSaveMutation.mutate(p.id)} />
                      </View>
                      <T numberOfLines={1} className="font-sans-bold text-sm">{p.name}</T>
                      <T numberOfLines={1} className="text-[13px] text-muted">{storeName} · {naira(p.price)}</T>
                    </Pressable>
                  </Link>
                );
              })}
            </View>
          )
        ) : (
          loadingStores ? (
            <View className="items-center py-12">
              <ActivityIndicator size="small" color="#0B6E4F" />
              <T className="mt-2 text-xs text-muted">Loading followed stores...</T>
            </View>
          ) : liveFollowedStores.length === 0 ? (
            <T className="py-8 text-center text-sm text-muted">No followed stores yet.</T>
          ) : (
            <View className="gap-2.5">
              {liveFollowedStores.map((s) => {
                const storeName = s.name || s.store_name || 'Store';
                const storeSlug = s.slug || s.username || String(s.id);
                const storeColor = s.primary_color || s.store_color || '#0B6E4F';
                return (
                  <Link key={storeSlug} href={`/shop/store/${storeSlug}`} asChild>
                    <Pressable accessibilityRole="link" accessibilityLabel={storeName} className="flex-row items-center gap-3 rounded-[18px] border border-line bg-surface p-3">
                      <Avatar initial={storeName[0] || 'S'} color={storeColor} />
                      <View className="flex-1">
                        <T className="font-sans-bold text-base">{storeName}</T>
                        <T className="text-[13px] text-muted">{s.location || 'Nigeria'}</T>
                      </View>
                    </Pressable>
                  </Link>
                );
              })}
            </View>
          )
        )}
      </ScrollView>
    </Screen>
  );
}
