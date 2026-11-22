import { Link } from "react-router";
import { DASHBOARD_IDS, DASHBOARDS } from "../legacy/lib/intelligence-data.js";
import {
  POS_DASHBOARD_IDS,
  POS_DASHBOARDS,
} from "../legacy/lib/pos/intelligence-data.js";
import {
  BI_DASHBOARD_IDS,
  BI_DASHBOARDS,
} from "../legacy/lib/bi/intelligence-data.js";

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
    <main className="intelligence-content">
      <div className="breadcrumb">AI Analytics &nbsp;›&nbsp; Reports</div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics Reports</h1>
          <p className="page-subtitle">
            Explore live PMS, POS, and combined business dashboards.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {groups.map((group) => (
          <section className="card" key={group.module}>
            <div className="card-title">{group.label}</div>
            <div className="card-subtitle">
              {group.ids.length} dashboards available for your hotel
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.ids.map((id) => (
                <Link
                  className="hover:border-primary-400 rounded-xl border border-slate-200 p-4 no-underline transition hover:bg-slate-50"
                  key={id}
                  to={`/intelligence/${group.module}/${id}`}
                >
                  <div className="font-semibold text-slate-900">
                    {group.dashboards[id].title}
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {group.dashboards[id].subtitle}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
