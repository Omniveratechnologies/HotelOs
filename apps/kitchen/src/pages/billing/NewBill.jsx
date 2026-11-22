import { useMemo, useState } from "react";
import { getMenuItems } from "../../services/menu.js";
import { getCategories, getDiscounts } from "../../services/menuManagement.js";
import { getTables } from "../../services/tables.js";
import {
  createBill,
  saveBill,
  createPayment,
  getBills,
  getRooms,
} from "../../services/billing.js";
import {
  Page,
  Panel,
  Notice,
  useLoad,
  css,
  money,
  waLink,
  billShareText,
  printInvoice,
  idOf,
} from "./billingUi.jsx";

const PAYMENT_METHODS = ["cash", "upi", "card", "room"];

export default function NewBill() {
  const { data: items, error: itemsError } = useLoad(getMenuItems);
  const { data: categories } = useLoad(getCategories);
  const { data: tables } = useLoad(getTables);
  const { data: rooms } = useLoad(getRooms);
  const { data: discounts } = useLoad(getDiscounts);
  const { data: recentBills, setData: setRecentBills } = useLoad(() =>
    getBills("status=saved"),
  );

  const [billType, setBillType] = useState("dine-in");
  const [tableId, setTableId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [custom, setCustom] = useState({ name: "", price: "" });
  const [discountId, setDiscountId] = useState("");
  const [coupon, setCoupon] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [savedBill, setSavedBill] = useState(null);
  const [payMethod, setPayMethod] = useState("");

  const filteredItems = useMemo(
    () =>
      items.filter(
        (i) =>
          (activeCategory === "all" || i.category === activeCategory) &&
          i.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [items, activeCategory, query],
  );

  function addItem(item) {
    setCart((current) => {
      const existing = current.find((row) => row.foodItemId === idOf(item));
      if (existing)
        return current.map((row) =>
          row.foodItemId === idOf(item)
            ? { ...row, quantity: row.quantity + 1 }
            : row,
        );
      return [
        ...current,
        {
          foodItemId: idOf(item),
          name: item.name,
          price: item.price,
          quantity: 1,
          category: item.category,
        },
      ];
    });
  }
  function addCustom() {
    if (!custom.name || !custom.price) return;
    setCart((current) => [
      ...current,
      {
        foodItemId: null,
        name: custom.name,
        price: Number(custom.price),
        quantity: 1,
        category: null,
      },
    ]);
    setCustom({ name: "", price: "" });
  }
  function updateQty(index, quantity) {
    setCart((current) =>
      quantity < 1
        ? current.filter((_, i) => i !== index)
        : current.map((row, i) => (i === index ? { ...row, quantity } : row)),
    );
  }
  function removeRow(index) {
    setCart((current) => current.filter((_, i) => i !== index));
  }

  const subtotal = cart.reduce((sum, row) => sum + row.price * row.quantity, 0);
  const selectedDiscount = discounts.find((d) => idOf(d) === discountId);
  const discountAmount = selectedDiscount
    ? selectedDiscount.type === "percentage"
      ? subtotal * (selectedDiscount.value / 100)
      : selectedDiscount.value
    : 0;
  const taxable = Math.max(subtotal - discountAmount, 0);
  const { cgst, sgst } = cart.reduce(
    (acc, row) => {
      const cat = categories.find((c) => c.name === row.category);
      const cgstRate = cat?.cgstRate ?? 2.5;
      const sgstRate = cat?.sgstRate ?? 2.5;
      const lineTotal = row.price * row.quantity;
      const share = subtotal ? lineTotal / subtotal : 0;
      const lineTaxable = taxable * share;
      return {
        cgst: acc.cgst + (lineTaxable * cgstRate) / 100,
        sgst: acc.sgst + (lineTaxable * sgstRate) / 100,
      };
    },
    { cgst: 0, sgst: 0 },
  );
  const total = taxable + cgst + sgst;

  function resetForm() {
    setCart([]);
    setSavedBill(null);
    setPayMethod("");
    setGuestName("");
    setTableId("");
    setRoomId("");
    setDiscountId("");
    setCoupon("");
  }

  function loadBillIntoEditor(bill) {
    setSavedBill(bill);
    setBillType(bill.billType);
    setTableId(bill.tableId || "");
    setRoomId(bill.roomId || "");
    setGuestName(bill.guestName || "");
    setCart(
      (bill.items || []).map((i) => ({
        foodItemId: i.foodItemId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        category: null,
      })),
    );
    setDiscountId(bill.discountId || "");
    setCoupon(bill.couponCode || "");
    setPayMethod("");
  }

  async function saveCurrentBill() {
    setError("");
    try {
      let billId = idOf(savedBill);
      if (!billId) {
        const draft = await createBill({
          billType,
          tableId: billType === "dine-in" && tableId ? tableId : null,
          roomId: billType === "room-charge" && roomId ? roomId : null,
          guestName,
          items: cart.map((row) => ({
            foodItemId: row.foodItemId,
            name: row.name,
            price: row.price,
            quantity: row.quantity,
          })),
        });
        billId = idOf(draft);
      }
      const saved = await saveBill(billId, {
        billType,
        tableId: billType === "dine-in" && tableId ? tableId : null,
        roomId: billType === "room-charge" && roomId ? roomId : null,
        guestName,
        items: cart.map((row) => ({
          foodItemId: row.foodItemId,
          name: row.name,
          price: row.price,
          quantity: row.quantity,
        })),
        discountId: discountId || null,
        couponCode: coupon || "",
        discountAmount,
        cgst,
        sgst,
        subtotal,
        totalAmount: total,
      });
      setSavedBill(saved);
      setRecentBills((current) => [
        saved,
        ...current.filter((b) => idOf(b) !== idOf(saved)),
      ]);
      return saved;
    } catch (e) {
      setError(e.message);
      return null;
    }
  }

  async function generateAndPay() {
    if (!payMethod) {
      setError("Choose a payment method to complete this bill.");
      return;
    }
    const bill = await saveCurrentBill();
    if (!bill) return;
    try {
      await createPayment({
        billId: idOf(bill),
        method: payMethod,
        amount: bill.totalAmount,
      });
      resetForm();
    } catch (e) {
      setError(e.message);
    }
  }

  function sendToWhatsapp() {
    if (!phone) {
      setError("Enter a phone number first.");
      return;
    }
    const bill = savedBill || {
      billNo: "DRAFT",
      items: cart,
      subtotal,
      discountAmount,
      cgst,
      sgst,
      totalAmount: total,
    };
    window.open(waLink(phone, billShareText(bill)), "_blank");
  }

  const uniqueCategories = [
    "all",
    ...new Set(items.map((i) => i.category).filter(Boolean)),
  ];

  return (
    <Page
      title="New Bill"
      action={
        <div className="flex overflow-hidden rounded-lg border border-slate-700 text-xs">
          {["dine-in", "takeaway", "room-charge"].map((t) => (
            <button
              key={t}
              onClick={() => setBillType(t)}
              className={`cursor-pointer px-4 py-2 capitalize ${billType === t ? "bg-emerald-400 font-bold text-slate-950" : "text-slate-400"}`}
            >
              {t.replace("-", " ")}
            </button>
          ))}
        </div>
      }
    >
      <Notice text={error || itemsError} onClose={() => setError("")} />

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {billType === "dine-in" && (
              <select
                className={`${css} max-w-[220px] cursor-pointer`}
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
              >
                <option value="">Select table</option>
                {tables.map((t) => (
                  <option key={idOf(t)} value={idOf(t)}>
                    Table {t.tableNumber}
                  </option>
                ))}
              </select>
            )}
            {billType === "room-charge" && (
              <select
                className={`${css} max-w-[220px] cursor-pointer`}
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              >
                <option value="">Select room</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.roomNumber}
                  </option>
                ))}
              </select>
            )}
            <input
              className={`${css} max-w-[260px]`}
              placeholder="Guest Name (Optional)"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
          </div>

          <input
            className={css}
            placeholder="Search menu items..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="flex gap-2 overflow-x-auto pb-1">
            {uniqueCategories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs whitespace-nowrap capitalize ${activeCategory === c ? "border-emerald-400 bg-emerald-500/15 text-emerald-300" : "border-slate-700 text-slate-400"}`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <div
                key={idOf(item)}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                  {item.image || item.images?.[0] ? (
                    <img
                      src={item.image || item.images[0]}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-lg font-bold text-slate-600">
                      {item.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-slate-500">{money(item.price)}</p>
                </div>
                <button
                  onClick={() => addItem(item)}
                  className="cursor-pointer rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300"
                >
                  Add
                </button>
              </div>
            ))}
            {!filteredItems.length && (
              <p className="col-span-full p-8 text-center text-sm text-slate-500">
                No menu items match.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="mb-2 text-xs font-semibold text-slate-400">
              Custom Item (if not in menu)
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                className={`${css} max-w-[200px]`}
                placeholder="Item Name"
                value={custom.name}
                onChange={(e) => setCustom({ ...custom, name: e.target.value })}
              />
              <input
                className={`${css} max-w-[120px]`}
                type="number"
                placeholder="Price (₹)"
                value={custom.price}
                onChange={(e) =>
                  setCustom({ ...custom, price: e.target.value })
                }
              />
              <button
                onClick={addCustom}
                className="cursor-pointer rounded-lg bg-emerald-400 px-4 text-xs font-bold text-slate-950"
              >
                Add Item
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400">
                Recent Bills{" "}
                {savedBill && (
                  <span className="text-emerald-400">
                    (editing #{savedBill.billNo})
                  </span>
                )}
              </p>
              <a
                href="/billing/all-bills"
                className="cursor-pointer text-xs text-emerald-400"
              >
                View All
              </a>
            </div>
            <div className="space-y-2">
              {recentBills.slice(0, 5).map((bill) => (
                <button
                  key={idOf(bill)}
                  onClick={() => loadBillIntoEditor(bill)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-lg border p-3 text-left text-xs transition-colors ${idOf(savedBill) === idOf(bill) ? "border-emerald-400 bg-emerald-500/10" : "border-slate-800 bg-slate-900/60 hover:border-slate-600"}`}
                >
                  <span>#{bill.billNo}</span>
                  <span className="text-slate-400">{bill.billType}</span>
                  <span>{money(bill.totalAmount)}</span>
                  <span
                    className={
                      bill.status === "paid"
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }
                  >
                    {bill.status}
                  </span>
                </button>
              ))}
              {!recentBills.length && (
                <p className="text-center text-xs text-slate-500">
                  No recent bills yet.
                </p>
              )}
            </div>
          </div>
        </section>

        <Panel title="Current Bill">
          {savedBill && (
            <button
              onClick={resetForm}
              className="mb-3 w-full cursor-pointer rounded-lg border border-slate-700 py-1.5 text-[11px] text-slate-400"
            >
              ✕ Discard edit — start new bill
            </button>
          )}
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {cart.map((row, index) => (
              <div
                key={index}
                className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs"
              >
                <span className="flex-1">{row.name}</span>
                <button
                  onClick={() => updateQty(index, row.quantity - 1)}
                  className="cursor-pointer px-1"
                >
                  −
                </button>
                <b>{row.quantity}</b>
                <button
                  onClick={() => updateQty(index, row.quantity + 1)}
                  className="cursor-pointer px-1"
                >
                  +
                </button>
                <span className="w-16 text-right">
                  {money(row.price * row.quantity)}
                </span>
                <button
                  onClick={() => removeRow(index)}
                  className="cursor-pointer text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
            {!cart.length && (
              <p className="py-6 text-center text-xs text-slate-500">
                No items added yet.
              </p>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <select
              className={`${css} cursor-pointer`}
              value={discountId}
              onChange={(e) => setDiscountId(e.target.value)}
            >
              <option value="">Apply Discount</option>
              {discounts.map((d) => (
                <option key={idOf(d)} value={idOf(d)}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 flex gap-2">
            <input
              className={css}
              placeholder="Coupon code"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
            />
          </div>

          <div className="mt-4 space-y-1 border-t border-slate-800 pt-3 text-xs">
            <p className="flex justify-between">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </p>
            {discountAmount > 0 && (
              <p className="flex justify-between text-emerald-400">
                <span>Discount</span>
                <span>-{money(discountAmount)}</span>
              </p>
            )}
            <p className="flex justify-between">
              <span>CGST</span>
              <span>{money(cgst)}</span>
            </p>
            <p className="flex justify-between">
              <span>SGST</span>
              <span>{money(sgst)}</span>
            </p>
            <p className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold">
              <span>Total Amount</span>
              <span>{money(total)}</span>
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={saveCurrentBill}
              disabled={!cart.length}
              className="cursor-pointer rounded-lg border border-slate-700 py-2 text-xs disabled:opacity-40"
            >
              {savedBill ? "Update Bill" : "Save Bill"}
            </button>
            <button
              onClick={() =>
                printInvoice(
                  savedBill || {
                    billNo: "DRAFT",
                    items: cart,
                    subtotal,
                    discountAmount,
                    cgst,
                    sgst,
                    totalAmount: total,
                    createdAt: new Date(),
                  },
                )
              }
              className="cursor-pointer rounded-lg border border-slate-700 py-2 text-xs"
            >
              Print Bill
            </button>
          </div>

          <div className="mt-3 space-y-2">
            <select
              className={`${css} cursor-pointer`}
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
            >
              <option value="">Choose payment method</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m} className="capitalize">
                  {m}
                </option>
              ))}
            </select>
            <button
              onClick={generateAndPay}
              disabled={!cart.length}
              className="w-full cursor-pointer rounded-lg bg-emerald-400 py-2 text-xs font-bold text-slate-950 disabled:opacity-40"
            >
              Generate & Pay →
            </button>
          </div>

          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <p className="mb-2 text-xs font-semibold text-emerald-300">
              Send Bill to Phone Number
            </p>
            <div className="flex gap-2">
              <input
                className={css}
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <button
                onClick={sendToWhatsapp}
                className="cursor-pointer rounded-lg bg-emerald-400 px-4 text-xs font-bold whitespace-nowrap text-slate-950"
              >
                Send Bill
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Customer will receive the bill on WhatsApp
            </p>
          </div>
        </Panel>
      </div>
    </Page>
  );
}
