import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { api } from "@hotelos/api";
import { Icon } from "../legacy/components/icons.jsx";
import AIInsightPanel from "../legacy/components/AIInsightPanel.jsx";
import DownloadMenu from "../legacy/components/DownloadMenu.jsx";
import KpiGrid from "../legacy/components/KpiGrid.jsx";
import RangeTabs from "../legacy/components/RangeTabs.jsx";
import { DASHBOARDS } from "../legacy/lib/intelligence-data.js";
import { DASHBOARD_COMPONENTS } from "../legacy/components/dashboards/index.jsx";
import { POS_DASHBOARDS } from "../legacy/lib/pos/intelligence-data.js";
import { POS_DASHBOARD_COMPONENTS } from "../legacy/components/dashboards-pos/index.jsx";
import { BI_DASHBOARDS } from "../legacy/lib/bi/intelligence-data.js";
import { BI_DASHBOARD_COMPONENTS } from "../legacy/components/dashboards-bi/index.jsx";

const getDashboard = (module, id) => {
  if (module === "pms") {
    return {
      meta: DASHBOARDS[id],
      Component: DASHBOARD_COMPONENTS[id],
      label: "PMS Intelligence",
    };
  }
  if (module === "pos") {
    return {
      meta: POS_DASHBOARDS[id],
      Component: POS_DASHBOARD_COMPONENTS[id],
      label: "POS Intelligence",
    };
  }
  if (module === "bi") {
    return {
      meta: BI_DASHBOARDS[id],
      Component: BI_DASHBOARD_COMPONENTS[id],
      label: "Business Intelligence",
    };
  }
  return null;
};

export default function IntelligenceDashboardPage() {
  const { module, dashboard } = useParams();
  const [range, setRange] = useState("30d");
  const [dashboardState, setDashboardState] = useState({
    key: null,
    data: null,
    error: "",
    loading: true,
  });
  const [actionError, setActionError] = useState(null);
  const requestKey = `${module}:${dashboard}:${range}`;
  const currentState =
    dashboardState.key === requestKey ? dashboardState : null;
  const data = currentState?.data ?? null;
  const error =
    currentState?.error ||
    (actionError?.key === requestKey ? actionError.message : "");
  const loading = currentState?.loading ?? true;
  const selected = getDashboard(module, dashboard);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const result = await api.get(
          `/api/v1/intelligence/${module}/${dashboard}`,
          {
            auth: true,
            query: { range },
            signal: controller.signal,
          },
        );
        setDashboardState({
          key: requestKey,
          data: result,
          error: "",
          loading: false,
        });
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setDashboardState({
            key: requestKey,
            data: null,
            error: requestError.message || "Failed to load this dashboard.",
            loading: false,
          });
        }
      }
    }

    load();
    return () => controller.abort();
  }, [module, dashboard, range, requestKey]);

  async function handleRecommendationAction(id, action) {
    try {
      await api.post(
        `/api/v1/intelligence/bi/recommendations/${id}`,
        { action },
        { auth: true },
      );
      return true;
    } catch (requestError) {
      setActionError({
        key: requestKey,
        message: requestError.message || "Could not update the recommendation.",
      });
      return false;
    }
  }

  if (!selected?.meta || !selected.Component) {
    return (
      <main className="intelligence-content">
        <div className="card">
          <div className="card-title">Dashboard unavailable</div>
          <div className="card-subtitle">
            This analytics dashboard could not be found.
          </div>
        </div>
      </main>
    );
  }

  const { meta, Component, label } = selected;

  return (
    <main className="intelligence-content">
      <div className="breadcrumb">
        AI Analytics &nbsp;›&nbsp; {label} &nbsp;›&nbsp; {meta.title}
      </div>

      <div className="page-header">
        <div className="page-title-row">
          <span className="title-icon">
            <Icon name={meta.icon} size={18} />
          </span>
          <div>
            <h1 className="page-title">
              {label} – {meta.title}
            </h1>
            <div className="page-subtitle">{meta.subtitle}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RangeTabs value={range} onChange={setRange} />
          <DownloadMenu id={dashboard} data={data} />
        </div>
      </div>

      {loading && !data && (
        <div className="state-msg" role="status">
          <div className="spinner" />
          Loading {meta.title.toLowerCase()} data…
        </div>
      )}

      {error && (
        <div className="card mb-4 border-red-200 bg-red-50" role="alert">
          <div className="font-semibold text-red-700">
            Couldn&apos;t load this dashboard
          </div>
          <div className="mt-1 text-sm text-red-700">{error}</div>
        </div>
      )}

      {data && (
        <>
          <KpiGrid metrics={data.metrics} />
          <Component data={data} onAction={handleRecommendationAction} />
          {!(module === "bi" && dashboard === "recommendations") && (
            <div className="mt-4">
              <AIInsightPanel insights={data.insights} />
            </div>
          )}
          <div className="mt-3 flex justify-between text-[11px] text-slate-500">
            <span>Source: live hotel data</span>
            {data.generatedAt && (
              <span>
                Generated {new Date(data.generatedAt).toLocaleString()}
              </span>
            )}
          </div>
        </>
      )}
    </main>
  );
}
