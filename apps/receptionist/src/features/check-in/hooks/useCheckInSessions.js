import { useCallback, useEffect, useRef, useState } from "react";
import { getCheckInSessions } from "@hotelos/api";

/**
 * Hook for fetching check-in sessions with filters.
 * Handles cancellation and loading state.
 */
export function useCheckInSessions(filters) {
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState(null);
  const cancelledRef = useRef(false);

  // Derived loading state
  const loading = stats === null && sessions.length === 0;

  const fetchData = useCallback(async () => {
    if (cancelledRef.current) return;
    setError(null);
    try {
      const response = await getCheckInSessions({
        dateRange: filters.dateRange,
        source: filters.source,
        roomType: filters.roomType,
        status: filters.status === "all" ? undefined : filters.status,
        search: filters.search,
      });
      if (cancelledRef.current) return;
      setStats(response.stats);
      setSessions(response.sessions);
    } catch (err) {
      if (cancelledRef.current) return;
      setError("Failed to load check-in data");
      console.error(err);
    }
  }, [filters]);

  // Fetch on mount and when filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    cancelledRef.current = false;
    fetchData();
    return () => {
      cancelledRef.current = true;
    };
  }, [fetchData]);

  return {
    stats,
    sessions,
    loading,
    error,
    refetch: fetchData,
  };
}
