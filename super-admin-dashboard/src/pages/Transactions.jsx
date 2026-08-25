import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Search, Wallet, ArrowDownUp } from "lucide-react";
import Topbar from "../components/layout/Topbar.jsx";
import { TableSkeleton, EmptyState } from "../components/ui/States.jsx";
import { fetchTransactionSummary } from "../api/client.js";

function formatCurrency(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function Transactions() {
  const { onMenuClick } = useOutletContext();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await fetchTransactionSummary();
      setRows(data);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = rows.filter((r) => r.hotelName.toLowerCase().includes(query.toLowerCase()));
    list = [...list].sort((a, b) => (sortDesc ? b.amount - a.amount : a.amount - b.amount));
    return list;
  }, [rows, query, sortDesc]);

  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  return (
    <>
      <Topbar
        title="Food Transactions"
        subtitle={`${formatCurrency(total)} received across all hotels`}
        onMenuClick={onMenuClick}
      />

      <main className="flex-1 px-5 pb-10 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by hotel name…"
              className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink-body outline-none placeholder:text-ink-muted/70 focus:border-signal-500 focus:ring-2 focus:ring-signal-500/15"
            />
          </div>
          <button
            onClick={() => setSortDesc((s) => !s)}
            className="flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm font-medium text-ink-body hover:bg-canvas"
          >
            <ArrowDownUp size={15} className="text-ink-muted" />
            {sortDesc ? "Highest first" : "Lowest first"}
          </button>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Wallet} title="No transactions found" description="Try a different hotel name." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3.5 font-semibold">Hotel</th>
                  <th className="px-5 py-3.5 font-semibold">Amount received</th>
                  <th className="px-5 py-3.5 font-semibold">Transactions</th>
                  <th className="px-5 py-3.5 font-semibold">Last activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-canvas/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-sm font-bold text-amber-500">
                          {row.hotelName.charAt(0)}
                        </div>
                        <span className="font-semibold text-ink-body">{row.hotelName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-sm font-semibold text-ink-body">
                      {formatCurrency(row.amount)}
                    </td>
                    <td className="px-5 py-4 text-ink-muted">{row.transactions}</td>
                    <td className="px-5 py-4 font-mono text-xs text-ink-muted">{row.lastTransactionAt}</td>
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
