import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import useMenuItems from "../../hooks/useMenuItems.js";
import { updateMenuItem } from "../../services/menu.js";
const css =
  "w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400";
const periods = ["Breakfast", "Lunch", "Evening", "Dinner", "Late Night"],
  dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export default function MenuAvailability() {
  const { items, setItems, error } = useMenuItems();
  const [query, setQuery] = useState(""),
    [selectedId, setSelectedId] = useState(""),
    [tab, setTab] = useState("Time & Days"),
    [checked, setChecked] = useState([]);
  const selected = items.find((item) => item.id === selectedId) || items[0];
  const rows = useMemo(
    () =>
      items.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [items, query],
  );
  const patch = async (body) => {
    const saved = await updateMenuItem(selected.id, body);
    setItems((current) =>
      current.map((item) => (item.id === saved.id ? saved : item)),
    );
  };
  const updateNested = (key, value) => patch({ [key]: value });
  return (
    <main className="min-h-full bg-[#07131f] p-4 text-slate-100 md:p-6">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-xs tracking-[.22em] text-emerald-400 uppercase">
            Menu Management
          </p>
          <h1 className="text-2xl font-bold">Menu Availability</h1>
          <p className="text-sm text-slate-400">
            Control when and where each menu item can be ordered.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              alert("Inventory sync requires the Inventory module")
            }
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs"
          >
            Sync with Inventory
          </button>
          <button
            onClick={() =>
              alert(`Bulk update selected ${checked.length} item(s)`)
            }
            className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950"
          >
            Bulk Update
          </button>
        </div>
      </div>
      {error && (
        <p className="mb-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="mb-4">
        <input
          className={css}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search menu items..."
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          {rows.map((item) => (
            <label
              className={`mb-1 flex items-center gap-2 rounded-lg p-3 ${selected?.id === item.id ? "bg-emerald-500/15" : "hover:bg-slate-800"}`}
              key={item.id}
            >
              <input
                type="checkbox"
                checked={checked.includes(item.id)}
                onChange={(e) =>
                  setChecked(
                    e.target.checked
                      ? [...checked, item.id]
                      : checked.filter((id) => id !== item.id),
                  )
                }
              />
              <button
                className="flex-1 text-left"
                onClick={() => setSelectedId(item.id)}
              >
                <b className="block text-sm">{item.name}</b>
                <small className="text-slate-500">
                  {item.category} ·{" "}
                  {item.isAvailable ? "Available" : "Unavailable"}
                </small>
              </button>
            </label>
          ))}
          {!rows.length && (
            <p className="p-6 text-center text-xs text-slate-500">
              No menu items found.
            </p>
          )}
        </section>
        {selected ? (
          <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-800">
              {[
                "Time & Days",
                "Meal Periods",
                "Branch Availability",
                "Stock Rules",
                "Temporary Toggle",
                "Preview",
              ].map((name) => (
                <button
                  key={name}
                  onClick={() => setTab(name)}
                  className={`border-b-2 px-3 py-3 text-xs whitespace-nowrap ${tab === name ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-500"}`}
                >
                  {name}
                </button>
              ))}
            </div>
            {tab === "Time & Days" && (
              <TimeDays item={selected} save={updateNested} />
            )}
            {tab === "Meal Periods" && (
              <div className="space-y-2">
                {periods.map((period) => (
                  <label
                    className="flex items-center gap-3 rounded border border-slate-800 p-3"
                    key={period}
                  >
                    <input
                      type="checkbox"
                      checked={selected.mealPeriods?.includes(period)}
                      onChange={(e) =>
                        updateNested(
                          "mealPeriods",
                          e.target.checked
                            ? [...(selected.mealPeriods || []), period]
                            : (selected.mealPeriods || []).filter(
                                (entry) => entry !== period,
                              ),
                        )
                      }
                    />
                    {period}
                  </label>
                ))}
              </div>
            )}
            {tab === "Branch Availability" && (
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selected.isAvailable}
                  onChange={(e) => patch({ isAvailable: e.target.checked })}
                />{" "}
                Available at this hotel
              </label>
            )}
            {tab === "Stock Rules" && (
              <StockRule item={selected} save={updateNested} />
            )}
            {tab === "Temporary Toggle" && (
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={
                      selected.temporaryAvailability?.available ??
                      selected.isAvailable
                    }
                    onChange={(e) =>
                      updateNested("temporaryAvailability", {
                        ...selected.temporaryAvailability,
                        available: e.target.checked,
                      })
                    }
                  />{" "}
                  Item Available
                </label>
                {!(selected.temporaryAvailability?.available ?? true) && (
                  <input
                    className={css}
                    placeholder="Reason"
                    value={selected.temporaryAvailability?.reason || ""}
                    onChange={(e) =>
                      updateNested("temporaryAvailability", {
                        ...selected.temporaryAvailability,
                        reason: e.target.value,
                      })
                    }
                  />
                )}
              </div>
            )}
            {tab === "Preview" && (
              <pre className="overflow-auto rounded bg-slate-950 p-4 text-xs text-slate-300">
                {JSON.stringify(
                  {
                    availabilityChannels: selected.availabilityChannels,
                    mealPeriods: selected.mealPeriods,
                    dayAvailability: selected.dayAvailability,
                    stockRule: selected.stockRule,
                    temporaryAvailability: selected.temporaryAvailability,
                  },
                  null,
                  2,
                )}
              </pre>
            )}
          </section>
        ) : (
          <p className="p-12 text-center text-sm text-slate-500">
            No backend menu items found.
          </p>
        )}
      </div>
    </main>
  );
}
function TimeDays({ item, save }) {
  const [slots, setSlots] = useState(item.timeAvailability?.slots || []),
    [days, setDays] = useState(item.dayAvailability || dayNames);
  const persist = (nextSlots, nextDays) =>
    save({
      timeAvailability: {
        ...item.timeAvailability,
        enabled: true,
        slots: nextSlots,
      },
      dayAvailability: nextDays,
    });
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={item.timeAvailability?.enabled}
          onChange={(e) =>
            save({
              timeAvailability: {
                ...item.timeAvailability,
                enabled: e.target.checked,
                slots,
              },
            })
          }
        />{" "}
        Enable Time Restriction
      </label>
      {slots.map((slot, index) => (
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2" key={index}>
          <input
            className={css}
            value={slot.start}
            onChange={(e) => {
              const next = slots.map((row, i) =>
                i === index ? { ...row, start: e.target.value } : row,
              );
              setSlots(next);
              persist(next, days);
            }}
          />
          <input
            className={css}
            value={slot.end}
            onChange={(e) => {
              const next = slots.map((row, i) =>
                i === index ? { ...row, end: e.target.value } : row,
              );
              setSlots(next);
              persist(next, days);
            }}
          />
          <button
            onClick={() => {
              const next = slots.filter((_, i) => i !== index);
              setSlots(next);
              persist(next, days);
            }}
            className="text-red-400"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button
        onClick={() => {
          const next = [...slots, { start: "09:00", end: "17:00" }];
          setSlots(next);
          persist(next, days);
        }}
        className="rounded border border-emerald-500/40 px-3 py-2 text-xs text-emerald-400"
      >
        + Add Time Slot
      </button>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <button
            type="button"
            key={day}
            onClick={() => {
              const next = item.dayAvailability?.includes(day)
                ? days.filter((entry) => entry !== day)
                : [...days, day];
              setDays(next);
              persist(slots, next);
            }}
            className={`rounded border p-2 text-xs ${days.includes(day) ? "border-emerald-400 text-emerald-400" : "border-slate-700 text-slate-500"}`}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}
function StockRule({ item, save }) {
  const rule = item.stockRule || {};
  const patch = (key, value) => save({ stockRule: { ...rule, [key]: value } });
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={rule.enabled}
          onChange={(e) => patch("enabled", e.target.checked)}
        />{" "}
        Enable Stock Rule
      </label>
      <input
        className={css}
        placeholder="Ingredient Name"
        value={rule.ingredientName || ""}
        onChange={(e) => patch("ingredientName", e.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className={css}
          type="number"
          placeholder="Current Qty"
          value={rule.currentQty || 0}
          onChange={(e) => patch("currentQty", Number(e.target.value))}
        />
        <input
          className={css}
          type="number"
          placeholder="Minimum Qty"
          value={rule.minQty || 0}
          onChange={(e) => patch("minQty", Number(e.target.value))}
        />
      </div>
      {rule.enabled && rule.currentQty < rule.minQty && (
        <p className="rounded bg-amber-500/10 p-3 text-xs text-amber-300">
          Item will be unavailable when stock falls below minimum.
        </p>
      )}
    </div>
  );
}
