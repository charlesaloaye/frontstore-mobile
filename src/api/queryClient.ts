import { QueryClient } from '@tanstack/react-query';

/** Shared so logging out or deleting an account can clear every cached screen. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});
