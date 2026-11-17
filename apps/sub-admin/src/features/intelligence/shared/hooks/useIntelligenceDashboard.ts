import { useEffect, useState } from "react";
import { api } from "@hotelos/api";
import type { DashboardData, DashboardState } from "../types";

export function useIntelligenceDashboard(module: string, dashboard: string) {
  const [range, setRange] = useState("30d");
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    key: null,
    data: null,
    error: "",
    loading: true,
  });
  const [actionError, setActionError] = useState<{
    key: string;
    message: string;
  } | null>(null);

  const requestKey = `${module}:${dashboard}:${range}`;
  const currentState =
    dashboardState.key === requestKey ? dashboardState : null;
  const data = currentState?.data ?? null;
  const error =
    currentState?.error ||
    (actionError?.key === requestKey ? actionError.message : "");
  const loading = currentState?.loading ?? true;

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const result = (await api.get(
          `/api/v1/intelligence/${module}/${dashboard}`,
          {
            auth: true,
            query: { range },
            signal: controller.signal,
          },
        )) as DashboardData;
        setDashboardState({
          key: requestKey,
          data: result,
          error: "",
          loading: false,
        });
      } catch (requestError: unknown) {
        if (!controller.signal.aborted) {
          const err = requestError as { message?: string };
          setDashboardState({
            key: requestKey,
            data: null,
            error: err.message || "Failed to load this dashboard.",
            loading: false,
          });
        }
      }
    }

    load();
    return () => controller.abort();
  }, [module, dashboard, range, requestKey]);

  async function handleRecommendationAction(id: string, action: string) {
    try {
      await api.post(
        `/api/v1/intelligence/bi/recommendations/${id}`,
        { action },
        { auth: true },
      );
      return true;
    } catch (requestError: unknown) {
      const err = requestError as { message?: string };
      setActionError({
        key: requestKey,
        message: err.message || "Could not update the recommendation.",
      });
      return false;
    }
  }

  return {
    range,
    setRange,
    data,
    loading,
    error,
    handleRecommendationAction,
  };
}
