import { useState } from "react";
import {
  getRoomCharges,
  createRoomCharge,
  settleRoomCharge,
} from "../../services/billing.js";
import {
  Page,
  Card,
  Panel,
  Table,
  Notice,
  money,
  dateText,
  idOf,
  statusClass,
  useLoad,
  css,
} from "./billingUi.jsx";

export default function RoomCharges() {
  const { data, setData, error, setError } = useLoad(getRoomCharges);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    description: "",
    type: "room-service",
    amount: "",
  });

  const add = async (event) => {
    event.preventDefault();
    try {
      const saved = await createRoomCharge({
        roomId: selected.roomId,
        bookingId: selected.bookingId,
        guestName: selected.guestName,
        items: [
          {
            name: form.description,
            price: Number(form.amount),
            quantity: 1,
            type: form.type,
          },
        ],
      });
      setData((current) => [saved, ...current]);
      setSelected(saved);
      setForm({ description: "", type: "room-service", amount: "" });
    } catch (e) {
      setError(e.message);
    }
  };

  const settle = async () => {
    try {
      const saved = await settleRoomCharge(idOf(selected));
      setData((current) =>
        current.map((row) => (idOf(row) === idOf(saved) ? saved : row)),
      );
      setSelected(saved);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Page
      title="Room Charges"
      action={
        <span className="text-xs text-slate-500">
          In-house folios from billing room charges
        </span>
      }
    >
      <Notice text={error} onClose={() => setError("")} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card title="In-house charges" value={data.length} />
        <Card
          title="Total charges"
          value={money(
            data.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0),
          )}
        />
        <Card
          title="Pending"
          value={money(
            data
              .filter((row) => row.paymentStatus !== "paid")
              .reduce((sum, row) => sum + Number(row.totalAmount || 0), 0),
          )}
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Table
          rows={data}
          onRow={setSelected}
          columns={[
            {
              key: "roomNumber",
              label: "Room No.",
              render: (r) => r.roomNumber || r.roomId,
            },
            { key: "guestName", label: "Guest" },
            {
              key: "createdAt",
              label: "Date",
              render: (row) => dateText(row.createdAt),
            },
            {
              key: "totalAmount",
              label: "Charges",
              render: (row) => money(row.totalAmount),
            },
            {
              key: "paymentStatus",
              label: "Status",
              render: (row) => (
                <span className={statusClass(row.paymentStatus)}>
                  {row.paymentStatus}
                </span>
              ),
            },
          ]}
        />
        {selected ? (
          <Panel title={`Room ${selected.roomNumber || selected.roomId || ""}`}>
            <div className="mb-4 space-y-2 text-xs">
              <p>Guest: {selected.guestName || "—"}</p>
              <p>Booking: {selected.bookingId || "—"}</p>
              <p>Folio total: {money(selected.totalAmount)}</p>
            </div>
            <h3 className="mb-2 font-semibold">Charge History</h3>
            {selected.items?.map((item, index) => (
              <p
                className="flex justify-between border-b border-slate-800 py-2 text-xs"
                key={index}
              >
                <span>{item.name}</span>
                <span>{money(item.price * item.quantity)}</span>
              </p>
            ))}
            <form
              onSubmit={add}
              className="mt-5 space-y-2 border-t border-slate-800 pt-4"
            >
              <h3 className="font-semibold">Add Charge</h3>
              <input
                className={css}
                required
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Description"
              />
              <select
                className={css}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="dine-in">Dine-in</option>
                <option value="room-service">Room service</option>
                <option value="other">Other</option>
              </select>
              <input
                className={css}
                required
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Amount"
              />
              <button className="w-full rounded bg-emerald-400 p-2 text-xs font-bold text-slate-950">
                Add Charge
              </button>
            </form>
            <button
              onClick={settle}
              disabled={selected.paymentStatus === "paid"}
              className="mt-3 w-full rounded bg-emerald-500/20 p-2 text-xs text-emerald-300"
            >
              Mark as Settled
            </button>
            <p className="mt-4 text-[11px] text-slate-500">
              Guest details are derived from room charges; a dedicated
              in-house-guests endpoint would be needed for a fuller guest
              details tab.
            </p>
          </Panel>
        ) : (
          <Panel title="Folio">
            <p className="text-sm text-slate-500">Select an in-house guest.</p>
          </Panel>
        )}
      </div>
    </Page>
  );
}
