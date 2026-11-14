import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/api/products';

/** Product categories for the pickers, as SearchableSelectModal items. */
export function useCategories() {
  const { data = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories, staleTime: 60 * 60 * 1000 });
  return {
    items: data.map((c) => ({ id: c.id, title: c.name })),
    nameOf: (id?: string | null) => data.find((c) => c.id === id)?.name ?? '',
  };
}
