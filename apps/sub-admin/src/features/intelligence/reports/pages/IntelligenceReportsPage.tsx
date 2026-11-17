import { Link } from "react-router";
import { Header } from "@hotelos/ui/components/Header";
import { DASHBOARD_IDS, DASHBOARDS } from "../../pms/data/pmsData";
import { POS_DASHBOARD_IDS, POS_DASHBOARDS } from "../../pos/data/posData";
import { BI_DASHBOARD_IDS, BI_DASHBOARDS } from "../../bi/data/biData";

const groups = [
  {
    label: "PMS Intelligence",
    module: "pms",
    ids: DASHBOARD_IDS,
    dashboards: DASHBOARDS,
  },
  {
    label: "POS Intelligence",
    module: "pos",
    ids: POS_DASHBOARD_IDS,
    dashboards: POS_DASHBOARDS,
  },
  {
    label: "Business Intelligence",
    module: "bi",
    ids: BI_DASHBOARD_IDS,
    dashboards: BI_DASHBOARDS,
  },
];

export default function IntelligenceReportsPage() {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <Header
        pageTitle="Analytics Reports"
        pageDescription="Explore live PMS, POS, and combined business dashboards."
      />

      <main className="bg-background-50 min-h-screen px-6 py-8 lg:px-10">
        <div className="grid gap-6">
          {groups.map((group) => (
            <section
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-2xs"
              key={group.module}
            >
              <h2 className="text-brand-900 text-base font-semibold">
                {group.label}
              </h2>
              <p className="mb-4 text-xs text-gray-500">
                {group.ids.length} dashboards available for your hotel
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.ids.map((id) => (
                  <Link
                    className="hover:border-brand-400 rounded-xl border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                    key={id}
                    to={`/intelligence/${group.module}/${id}`}
                  >
                    <div className="text-brand-900 font-semibold">
                      {
                        (
                          group.dashboards as Record<
                            string,
                            { title: string; subtitle: string }
                          >
                        )[id]?.title
                      }
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-gray-500">
                      {
                        (
                          group.dashboards as Record<
                            string,
                            { title: string; subtitle: string }
                          >
                        )[id]?.subtitle
                      }
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
