import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { LifeBuoy } from "lucide-react";
import Topbar from "../components/layout/Topbar.jsx";
import Badge from "../components/ui/Badge.jsx";
import { TableSkeleton, EmptyState } from "../components/ui/States.jsx";
import { fetchServiceRequests, updateServiceRequestStatus } from "../api/client.js";

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
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
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
          <EmptyState icon={LifeBuoy} title="No service requests" description="Hotel requests will show up here as they come in." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3.5 font-semibold">Hotel</th>
                  <th className="px-5 py-3.5 font-semibold">Request</th>
                  <th className="px-5 py-3.5 font-semibold">Priority</th>
                  <th className="px-5 py-3.5 font-semibold">Submitted</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-canvas/60">
                    <td className="px-5 py-4 font-semibold text-ink-body">{req.hotelName}</td>
                    <td className="px-5 py-4 text-ink-body">{req.subject}</td>
                    <td className="px-5 py-4">
                      <Badge status={req.priority} />
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-ink-muted">{req.createdAt}</td>
                    <td className="px-5 py-4">
                      <select
                        value={req.status}
                        onChange={(e) => handleStatusChange(req.id, e.target.value)}
                        className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-body outline-none focus:border-signal-500 focus:ring-2 focus:ring-signal-500/15"
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
