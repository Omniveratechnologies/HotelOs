import { useQuery, queryKeys } from "@hotelos/query";
import { transactionsApi } from "@hotelos/api";
import { mockTransactions } from "../../../data/mockData.js";

/**
 * Hook to fetch transactions summary for super-admin dashboard.
 * @returns {object} Query result with transactions array, isLoading, and error.
 */
export function useTransactions() {
  const query = useQuery({
    queryKey: queryKeys.transactions.list(),
    queryFn: async () => {
      const data = await transactionsApi.fetchTransactionSummary();
      if (Array.isArray(data) && data.length > 0) return data;
      return mockTransactions;
    },
  });

  return {
    ...query,
    transactions: query.data || [],
    isLoading: query.isLoading,
    error: query.error
      ? query.error.message || "Failed to load transactions"
      : null,
  };
}
