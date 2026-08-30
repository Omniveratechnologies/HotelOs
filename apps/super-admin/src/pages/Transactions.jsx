import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Search, Wallet, ArrowDownUp } from "lucide-react";
import Topbar from "../components/layout/Topbar.jsx";
import { TableSkeleton, EmptyState } from "../components/ui/States.jsx";
import { fetchTransactionSummary } from "../api/client.js";

function formatCurrency(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
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
    let list = rows.filter((r) =>
      r.hotelName.toLowerCase().includes(query.toLowerCase()),
    );
    list = [...list].sort((a, b) =>
      sortDesc ? b.amount - a.amount : a.amount - b.amount,
    );
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
            <Search
              size={16}
              className="text-ink-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by hotel name…"
              className="border-line text-ink-body placeholder:text-ink-muted/70 focus:border-signal-500 focus:ring-signal-500/15 w-full rounded-lg border bg-white py-2.5 pr-3 pl-9 text-sm outline-none focus:ring-2"
            />
          </div>
          <button
            onClick={() => setSortDesc((s) => !s)}
            className="border-line text-ink-body hover:bg-canvas flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2.5 text-sm font-medium"
          >
            <ArrowDownUp size={15} className="text-ink-muted" />
            {sortDesc ? "Highest first" : "Lowest first"}
          </button>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No transactions found"
            description="Try a different hotel name."
          />
        ) : (
          <div className="border-line overflow-hidden rounded-2xl border bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-line text-ink-muted border-b text-xs font-semibold tracking-wide uppercase">
                  <th className="px-5 py-3.5 font-semibold">Hotel</th>
                  <th className="px-5 py-3.5 font-semibold">Amount received</th>
                  <th className="px-5 py-3.5 font-semibold">Transactions</th>
                  <th className="px-5 py-3.5 font-semibold">Last activity</th>
                </tr>
              </thead>
              <tbody className="divide-line divide-y">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-canvas/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-sm font-bold text-amber-500">
                          {row.hotelName.charAt(0)}
                        </div>
                        <span className="text-ink-body font-semibold">
                          {row.hotelName}
                        </span>
                      </div>
                    </td>
                    <td className="text-ink-body px-5 py-4 font-mono text-sm font-semibold">
                      {formatCurrency(row.amount)}
                    </td>
                    <td className="text-ink-muted px-5 py-4">
                      {row.transactions}
                    </td>
                    <td className="text-ink-muted px-5 py-4 font-mono text-xs">
                      {row.lastTransactionAt}
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
