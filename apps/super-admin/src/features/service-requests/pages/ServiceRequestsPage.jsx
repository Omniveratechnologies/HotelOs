import { useOutletContext } from "react-router";
import { LifeBuoy } from "lucide-react";
import Topbar from "../../../components/layout/Topbar.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import { TableSkeleton, EmptyState } from "../../../components/ui/States.jsx";
import {
  useSuperAdminServiceRequests,
  useUpdateSuperAdminServiceRequestStatus,
} from "../hooks/useSuperAdminServiceRequests.js";

const STATUS_OPTIONS = ["open", "in_progress", "resolved"];

export default function ServiceRequestsPage() {
  const { onMenuClick } = useOutletContext();
  const { serviceRequests: requests = [], isLoading: loading } =
    useSuperAdminServiceRequests();
  const updateStatusMut = useUpdateSuperAdminServiceRequestStatus();

  async function handleStatusChange(id, status) {
    await updateStatusMut.mutateAsync({ requestId: id, status });
  }

  const reqList = Array.isArray(requests) ? requests : [];
  const openCount = reqList.filter((r) => r.status !== "resolved").length;

  return (
    <>
      <Topbar
        title="Service Requests"
        subtitle={`${openCount} request${openCount === 1 ? "" : "s"} need attention`}
        onMenuClick={onMenuClick}
      />

      <main className="flex-1 px-5 pb-10 lg:px-8">
        {loading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={LifeBuoy}
            title="No service requests"
            description="Hotel requests will show up here as they come in."
          />
        ) : (
          <div className="border-surface-200 overflow-hidden rounded-2xl border bg-white shadow-xs">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-surface-200 text-brand-700/60 border-b text-xs font-semibold tracking-wide uppercase">
                  <th className="px-5 py-3.5 font-semibold">Hotel</th>
                  <th className="px-5 py-3.5 font-semibold">Request</th>
                  <th className="px-5 py-3.5 font-semibold">Priority</th>
                  <th className="px-5 py-3.5 font-semibold">Submitted</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-surface-200 divide-y">
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-background-50/60 transition-colors"
                  >
                    <td className="text-brand-900 px-5 py-4 font-semibold">
                      {req.hotelName}
                    </td>
                    <td className="text-brand-900 px-5 py-4">{req.subject}</td>
                    <td className="px-5 py-4">
                      <Badge status={req.priority} />
                    </td>
                    <td className="text-brand-700/60 px-5 py-4 font-mono text-xs">
                      {req.createdAt}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={req.status}
                        onChange={(e) =>
                          handleStatusChange(req.id, e.target.value)
                        }
                        className="border-surface-200 text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
