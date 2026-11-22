import React from "react";
import { Header } from "@hotelos/ui/components/Header";
import { KpiTile, KpiTileRow } from "@hotelos/ui/components";
import { getIcon } from "../utils/iconMap";
import { RangeTabs } from "./RangeTabs";
import { DownloadMenu } from "./DownloadMenu";
import { AiInsightPanel } from "./AiInsightPanel";
import type { DashboardMeta } from "../../pms/data/pmsData";
import type { DashboardData, DashboardMetric } from "../types";

export interface IntelligenceDashboardLayoutProps {
  meta: DashboardMeta;
  module: "pms" | "pos" | "bi";
  dashboardId: string;
  range: string;
  setRange: (range: string) => void;
  data: DashboardData | null;
  loading: boolean;
  error: string;
  children: React.ReactNode;
}

export function IntelligenceDashboardLayout({
  meta,
  module,
  dashboardId,
  range,
  setRange,
  data,
  loading,
  error,
  children,
}: IntelligenceDashboardLayoutProps) {
  const metrics = data?.metrics || [];

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <Header pageTitle={meta.title} pageDescription={meta.subtitle} />

      <main className="bg-background-50 min-h-screen px-6 py-8 lg:px-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <RangeTabs value={range} onChange={setRange} />
          <DownloadMenu id={dashboardId} data={data} />
        </div>

        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="text-brand-900 h-8 w-8 animate-spin"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                className="opacity-20"
              />
              <path
                d="M22 12a10 10 0 00-10-10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <span className="mt-3 text-sm">
              Loading {meta.title.toLowerCase()} data…
            </span>
          </div>
        )}

        {error && (
          <div
            className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
            role="alert"
          >
            <div className="font-semibold">
              Couldn&apos;t load this dashboard
            </div>
            <div className="mt-1">{error}</div>
          </div>
        )}

        {data && (
          <div className="intelligence-content">
            {metrics.length > 0 && (
              <KpiTileRow className="mb-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                {metrics.map((m: DashboardMetric) => {
                  const n = parseFloat(String(m.change || ""));
                  const deltaTone =
                    Number.isFinite(n) && n > 0
                      ? "up"
                      : Number.isFinite(n) && n < 0
                        ? "down"
                        : "neutral";
                  const delta =
                    !m.change || m.change === "—"
                      ? undefined
                      : m.change === "forecast"
                        ? "AI forecast"
                        : `${m.change} vs previous`;
                  const IconCmp = getIcon(m.icon);

                  return (
                    <KpiTile
                      key={m.label}
                      icon={IconCmp}
                      value={m.value}
                      label={m.label}
                      delta={delta}
                      deltaTone={deltaTone}
                    />
                  );
                })}
              </KpiTileRow>
            )}

            {children}

            {!(module === "bi" && dashboardId === "recommendations") && (
              <div className="mt-6">
                <AiInsightPanel insights={data.insights} />
              </div>
            )}

            <div className="mt-6 flex justify-between text-xs text-gray-500">
              <span>Source: live hotel data</span>
              {data.generatedAt && (
                <span>
                  Generated {new Date(data.generatedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default IntelligenceDashboardLayout;
