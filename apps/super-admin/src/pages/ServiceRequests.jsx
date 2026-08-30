import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { LifeBuoy } from "lucide-react";
import Topbar from "../components/layout/Topbar.jsx";
import Badge from "../components/ui/Badge.jsx";
import { TableSkeleton, EmptyState } from "../components/ui/States.jsx";
import {
  fetchServiceRequests,
  updateServiceRequestStatus,
} from "../services/serviceRequests.service.js";

const STATUS_OPTIONS = ["open", "in_progress", "resolved"];

export default function ServiceRequests() {
  const { onMenuClick } = useOutletContext();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await fetchServiceRequests();
      setRequests(data);
      setLoading(false);
    })();
  }, []);

  async function handleStatusChange(id, status) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r)),
    );
    await updateServiceRequestStatus(id, status);
  }

  const openCount = requests.filter((r) => r.status !== "resolved").length;

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
          <div className="border-line overflow-hidden rounded-2xl border bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-line text-ink-muted border-b text-xs font-semibold tracking-wide uppercase">
                  <th className="px-5 py-3.5 font-semibold">Hotel</th>
                  <th className="px-5 py-3.5 font-semibold">Request</th>
                  <th className="px-5 py-3.5 font-semibold">Priority</th>
                  <th className="px-5 py-3.5 font-semibold">Submitted</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-line divide-y">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-canvas/60">
                    <td className="text-ink-body px-5 py-4 font-semibold">
                      {req.hotelName}
                    </td>
                    <td className="text-ink-body px-5 py-4">{req.subject}</td>
                    <td className="px-5 py-4">
                      <Badge status={req.priority} />
                    </td>
                    <td className="text-ink-muted px-5 py-4 font-mono text-xs">
                      {req.createdAt}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={req.status}
                        onChange={(e) =>
                          handleStatusChange(req.id, e.target.value)
                        }
                        className="border-line text-ink-body focus:border-signal-500 focus:ring-signal-500/15 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2"
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
