import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Edit3,
  Eye,
  MousePointerClick,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { getMenuItems } from "../../services/menu.js";
import {
  getBillingSettings,
  updateBillingSettings,
} from "../../services/billing.js";
import {
  createFastItem,
  createPostOrderOffer,
  createSmartRule,
  createUpsellingRule,
  deleteFastItem,
  deletePostOrderOffer,
  deleteSmartRule,
  deleteUpsellingRule,
  getFastItems,
  getPostOrderOffers,
  getSmartRules,
  getUpsellingAnalytics,
  getUpsellingRules,
  updateFastItem,
  updatePostOrderOffer,
  updateSmartRule,
  updateUpsellingRule,
} from "../../services/upselling.js";
import {
  Card,
  Notice,
  Page,
  Panel,
  Table,
  Tabs,
  css,
  money,
} from "../billing/billingUi.jsx";

const tabValues = [
  "overview",
  "combinations",
  "addons",
  "offers",
  "fast",
  "smart",
  "settings",
];
const tabLabels = {
  overview: "Overview",
  combinations: "Food Combinations",
  addons: "Add-ons & Upgrades",
  offers: "Post-Order Offers",
  fast: "Fast Items",
  smart: "Smart Recommendations",
  settings: "Rules/Settings",
};
const blankRule = {
  triggerItemId: "",
  type: "combo",
  recommendedItems: [],
  priority: "medium",
  status: "active",
  bundlePrice: "",
  discountType: "fixedAmount",
  discountValue: "",
  minSelection: 1,
  maxSelection: 1,
};
const blankOffer = {
  triggerTiming: "immediately",
  offerType: "singleItem",
  validForMinutes: 10,
  offerItemId: "",
  offerPrice: "",
  displayPriority: 1,
  status: "active",
};
const blankFast = {
  foodItemId: "",
  prepTimeMinutes: 10,
  offerPrice: "",
  displayPriority: 1,
  status: "active",
};
const blankSmart = {
  category: "",
  itemId: "",
  minOrderValue: 0,
  timeOfDay: "allDay",
  dayOfWeek: "all",
  tableType: "any",
  showIfNotOrderedBefore: false,
  onlyIfInStock: true,
  maxPrepTimeMinutes: "",
  weatherEvent: "",
  limitFrequency: false,
  maxPerOrder: 1,
  status: "active",
};
const list = (value, key) =>
  Array.isArray(value) ? value : value?.[key] || value?.items || [];
const recordId = (value) => value?.id || value?._id || "";
const itemName = (value, items) =>
  items.find(
    (item) => recordId(item) === (value?.foodItemId || value?.itemId || value),
  )?.name ||
  value?.name ||
  "Unknown item";
const pretty = (value) =>
  String(value || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
const isActive = (value) => value === true || value === "active";
const formStatus = (value) => (isActive(value) ? "active" : "inactive");

function Field({ label, children }) {
  return (
    <label className="block text-xs text-slate-400">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
function Select({ value, onChange, children }) {
  return (
    <select
      className={css}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
    >
      {children}
    </select>
  );
}
function Toggle({ checked, onChange, label = "Status" }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-xs text-slate-300"
    >
      <span
        className={`relative h-5 w-10 rounded-full ${checked ? "bg-emerald-500" : "bg-slate-700"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${checked ? "left-5" : "left-0.5"}`}
        />
      </span>
      {label}
    </button>
  );
}
function Button({ children, onClick, secondary = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${secondary ? "border border-slate-700 text-slate-300" : "bg-emerald-400 text-slate-950"}`}
    >
      {children}
    </button>
  );
}
function FormGrid({ children }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}
function ItemSelect({ items, value, onChange, multiple = false }) {
  if (multiple)
    return (
      <div className="flex min-h-10 flex-wrap gap-2 rounded-lg border border-slate-700 bg-slate-950/70 p-2">
        {items.map((item) => {
          const itemKey = recordId(item);
          const selected = value.includes(itemKey);
          return (
            <button
              type="button"
              key={itemKey}
              onClick={() =>
                onChange(
                  selected
                    ? value.filter((entry) => entry !== itemKey)
                    : [...value, itemKey],
                )
              }
              className={`rounded-full border px-2.5 py-1 text-xs ${selected ? "border-emerald-400 bg-emerald-400/15 text-emerald-300" : "border-slate-700 text-slate-400"}`}
            >
              {selected && <Check size={12} className="mr-1 inline" />}
              {item.name}
            </button>
          );
        })}
      </div>
    );
  return (
    <Select value={value} onChange={onChange}>
      <option value="">Select item</option>
      {items.map((item) => (
        <option value={recordId(item)} key={recordId(item)}>
          {item.name}
        </option>
      ))}
    </Select>
  );
}
function Actions({ onEdit, onDelete }) {
  return (
    <div className="flex gap-2">
      <button
        title="Edit"
        onClick={onEdit}
        className="text-slate-400 hover:text-emerald-300"
      >
        <Edit3 size={15} />
      </button>
      <button
        title="Delete"
        onClick={onDelete}
        className="text-slate-400 hover:text-red-300"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function RuleForm({
  items,
  value,
  setValue,
  onSave,
  title = "Combo Builder",
  simple = false,
}) {
  const patch = (next) => setValue((current) => ({ ...current, ...next }));
  const selected = (value.recommendedItems || []).map(
    (item) => item.foodItemId || item,
  );
  return (
    <Panel title={title}>
      <div className="space-y-3">
        <Field label="Base Item">
          <ItemSelect
            items={items}
            value={value.triggerItemId}
            onChange={(triggerItemId) => patch({ triggerItemId })}
          />
        </Field>
        <Field label="Recommended Items">
          <ItemSelect
            items={items}
            multiple
            value={selected}
            onChange={(ids) =>
              patch({
                recommendedItems: ids.map((foodItemId) => ({
                  foodItemId,
                  name: itemName(foodItemId, items),
                })),
              })
            }
          />
        </Field>
        <FormGrid>
          <Field label="Type">
            <Select value={value.type} onChange={(type) => patch({ type })}>
              <option value="combo">Combo</option>
              <option value="upsell">Upsell</option>
              <option value="addon">Add-on</option>
            </Select>
          </Field>
          <Field label="Priority">
            <Select
              value={value.priority}
              onChange={(priority) => patch({ priority })}
            >
              <option>high</option>
              <option>medium</option>
              <option>low</option>
            </Select>
          </Field>
          {!simple && (
            <>
              <Field label="Bundle Price">
                <input
                  className={css}
                  type="number"
                  value={value.bundlePrice}
                  onChange={(event) =>
                    patch({ bundlePrice: event.target.value })
                  }
                />
              </Field>
              <Field label="Discount Type">
                <Select
                  value={value.discountType}
                  onChange={(discountType) => patch({ discountType })}
                >
                  <option value="fixedAmount">Fixed amount</option>
                  <option value="percentage">Percentage</option>
                </Select>
              </Field>
              <Field label="Discount Value">
                <input
                  className={css}
                  type="number"
                  value={value.discountValue}
                  onChange={(event) =>
                    patch({ discountValue: event.target.value })
                  }
                />
              </Field>
              <Field label="Min / Max Selection">
                <div className="flex gap-2">
                  <input
                    className={css}
                    type="number"
                    value={value.minSelection}
                    onChange={(event) =>
                      patch({ minSelection: Number(event.target.value) })
                    }
                  />
                  <input
                    className={css}
                    type="number"
                    value={value.maxSelection}
                    onChange={(event) =>
                      patch({ maxSelection: Number(event.target.value) })
                    }
                  />
                </div>
              </Field>
            </>
          )}
        </FormGrid>
        <Toggle
          checked={value.status === "active"}
          onChange={(active) =>
            patch({ status: active ? "active" : "inactive" })
          }
        />
        <Button onClick={onSave}>
          <Check size={14} /> Save Rule
        </Button>
      </div>
    </Panel>
  );
}
function OfferForm({ items, value, setValue, onSave }) {
  const patch = (next) => setValue((current) => ({ ...current, ...next }));
  return (
    <Panel title="Post-Order Offer">
      <div className="space-y-3">
        <FormGrid>
          <Field label="Trigger Timing">
            <Select
              value={value.triggerTiming}
              onChange={(triggerTiming) => patch({ triggerTiming })}
            >
              <option value="immediately">Immediately</option>
              <option value="5min">After 5 minutes</option>
              <option value="10min">After 10 minutes</option>
            </Select>
          </Field>
          <Field label="Offer Type">
            <Select
              value={value.offerType}
              onChange={(offerType) => patch({ offerType })}
            >
              <option value="singleItem">Single item</option>
              <option value="bundle">Bundle</option>
            </Select>
          </Field>
          <Field label="Valid For (minutes)">
            <input
              className={css}
              type="number"
              value={value.validForMinutes}
              onChange={(event) =>
                patch({ validForMinutes: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="Offer Item">
            <ItemSelect
              items={items}
              value={value.offerItemId}
              onChange={(offerItemId) => patch({ offerItemId })}
            />
          </Field>
          <Field label="Offer Price">
            <input
              className={css}
              type="number"
              value={value.offerPrice}
              onChange={(event) => patch({ offerPrice: event.target.value })}
            />
          </Field>
          <Field label="Display Priority">
            <input
              className={css}
              type="number"
              value={value.displayPriority}
              onChange={(event) =>
                patch({ displayPriority: Number(event.target.value) })
              }
            />
          </Field>
        </FormGrid>
        <Toggle
          checked={value.status === "active"}
          onChange={(active) =>
            patch({ status: active ? "active" : "inactive" })
          }
        />
        <Button onClick={onSave}>
          <Check size={14} /> Save Offer
        </Button>
      </div>
    </Panel>
  );
}
function FastForm({ items, value, setValue, onSave }) {
  const patch = (next) => setValue((current) => ({ ...current, ...next }));
  return (
    <Panel title="Add Fast Item">
      <div className="space-y-3">
        <Field label="Food Item">
          <ItemSelect
            items={items}
            value={value.foodItemId}
            onChange={(foodItemId) => patch({ foodItemId })}
          />
        </Field>
        <FormGrid>
          <Field label="Prep Time (minutes)">
            <input
              className={css}
              type="number"
              value={value.prepTimeMinutes}
              onChange={(event) =>
                patch({ prepTimeMinutes: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="Offer Price">
            <input
              className={css}
              type="number"
              value={value.offerPrice}
              onChange={(event) => patch({ offerPrice: event.target.value })}
            />
          </Field>
          <Field label="Display Priority">
            <input
              className={css}
              type="number"
              value={value.displayPriority}
              onChange={(event) =>
                patch({ displayPriority: Number(event.target.value) })
              }
            />
          </Field>
        </FormGrid>
        <Toggle
          checked={value.status === "active"}
          onChange={(active) =>
            patch({ status: active ? "active" : "inactive" })
          }
        />
        <Button onClick={onSave}>
          <Check size={14} /> Save Fast Item
        </Button>
      </div>
    </Panel>
  );
}
function SmartForm({ items, value, setValue, onSave }) {
  const patch = (next) => setValue((current) => ({ ...current, ...next }));
  return (
    <Panel title="Smart Recommendation Rule">
      <div className="space-y-3">
        <FormGrid>
          <Field label="Category">
            <input
              className={css}
              value={value.category}
              onChange={(event) => patch({ category: event.target.value })}
            />
          </Field>
          <Field label="Item (optional)">
            <ItemSelect
              items={items}
              value={value.itemId}
              onChange={(itemId) => patch({ itemId })}
            />
          </Field>
          <Field label="Min Order Value">
            <input
              className={css}
              type="number"
              value={value.minOrderValue}
              onChange={(event) =>
                patch({ minOrderValue: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="Time of Day">
            <Select
              value={value.timeOfDay}
              onChange={(timeOfDay) => patch({ timeOfDay })}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="allDay">All Day</option>
            </Select>
          </Field>
          <Field label="Day of Week">
            <Select
              value={value.dayOfWeek}
              onChange={(dayOfWeek) => patch({ dayOfWeek })}
            >
              <option value="all">All days</option>
              {[
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ].map((day) => (
                <option key={day}>{day}</option>
              ))}
            </Select>
          </Field>
          <Field label="Table Type">
            <Select
              value={value.tableType}
              onChange={(tableType) => patch({ tableType })}
            >
              <option value="any">Any</option>
              <option value="dineIn">Dine In</option>
              <option value="takeaway">Takeaway</option>
            </Select>
          </Field>
          <Field label="Max Prep Time (minutes)">
            <input
              className={css}
              type="number"
              value={value.maxPrepTimeMinutes}
              onChange={(event) =>
                patch({ maxPrepTimeMinutes: event.target.value })
              }
            />
          </Field>
          <Field label="Weather / Event">
            <input
              className={css}
              value={value.weatherEvent}
              onChange={(event) => patch({ weatherEvent: event.target.value })}
            />
          </Field>
        </FormGrid>
        <div className="space-y-3 border-t border-slate-800 pt-3">
          <Toggle
            label="Show if not ordered before"
            checked={value.showIfNotOrderedBefore}
            onChange={(showIfNotOrderedBefore) =>
              patch({ showIfNotOrderedBefore })
            }
          />
          <Toggle
            label="Only if in stock"
            checked={value.onlyIfInStock}
            onChange={(onlyIfInStock) => patch({ onlyIfInStock })}
          />
          <Toggle
            label="Limit recommendation frequency"
            checked={value.limitFrequency}
            onChange={(limitFrequency) => patch({ limitFrequency })}
          />
          {value.limitFrequency && (
            <Field label="Max Per Order">
              <input
                className={css}
                type="number"
                value={value.maxPerOrder}
                onChange={(event) =>
                  patch({ maxPerOrder: Number(event.target.value) })
                }
              />
            </Field>
          )}
          <Toggle
            checked={value.status === "active"}
            onChange={(active) =>
              patch({ status: active ? "active" : "inactive" })
            }
          />
        </div>
        <Button onClick={onSave}>
          <Check size={14} /> Save Smart Rule
        </Button>
      </div>
    </Panel>
  );
}

export default function Upselling() {
  const [tab, setTab] = useState("overview"),
    [items, setItems] = useState([]),
    [rules, setRules] = useState([]),
    [offers, setOffers] = useState([]),
    [fastItems, setFastItems] = useState([]),
    [smartRules, setSmartRules] = useState([]),
    [analytics, setAnalytics] = useState({}),
    [query, setQuery] = useState(""),
    [ruleType, setRuleType] = useState(""),
    [error, setError] = useState(""),
    [ruleForm, setRuleForm] = useState(blankRule),
    [offerForm, setOfferForm] = useState(blankOffer),
    [fastForm, setFastForm] = useState(blankFast),
    [smartForm, setSmartForm] = useState(blankSmart),
    [settings, setSettings] = useState({
      enabled: true,
      defaultPriority: "medium",
    });
  const analyticsRef = useRef(null),
    comboRef = useRef(null);
  const load = async () => {
    try {
      const [menu, ruleData, offerData, fastData, smartData, metrics, billing] =
        await Promise.all([
          getMenuItems(),
          getUpsellingRules(),
          getPostOrderOffers(),
          getFastItems(),
          getSmartRules(),
          getUpsellingAnalytics(),
          getBillingSettings(),
        ]);
      setItems(list(menu, "foodItems"));
      setRules(list(ruleData, "rules"));
      setOffers(list(offerData, "postOrderOffers"));
      setFastItems(list(fastData, "fastItems"));
      setSmartRules(list(smartData, "smartRules"));
      setAnalytics(metrics || {});
      setSettings(
        billing?.upselling || { enabled: true, defaultPriority: "medium" },
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to load upselling data");
    }
  };
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    load();
  }, []);
  const save = async (create, update, form, blank, setForm, setRows) => {
    try {
      const payload = { ...form, status: isActive(form.status) };
      const saved = recordId(payload)
        ? await update(recordId(payload), payload)
        : await create(payload);
      setRows((current) =>
        recordId(payload)
          ? current.map((row) =>
              recordId(row) === recordId(payload) ? saved : row,
            )
          : [saved, ...current],
      );
      setForm({ ...blank });
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  const remove = async (removeRequest, id, setRows) => {
    try {
      await removeRequest(id);
      setRows((current) => current.filter((row) => recordId(row) !== id));
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  const visibleRules = useMemo(
    () =>
      rules.filter(
        (rule) =>
          (!ruleType || rule.type === ruleType) &&
          `${itemName(rule.triggerItemId, items)} ${rule.type} ${rule.priority}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [rules, items, query, ruleType],
  );
  const ruleColumns = [
    {
      key: "triggerItemId",
      label: "Trigger Item",
      render: (row) => (
        <div>
          <b>{itemName(row.triggerItemId, items)}</b>
          <small className="block text-slate-500">
            {items.find((item) => recordId(item) === row.triggerItemId)
              ?.category || "—"}
          </small>
        </div>
      ),
    },
    {
      key: "recommendedItems",
      label: "Recommended",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.recommendedItems || []).map((item, index) => (
            <span
              className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300"
              key={item.foodItemId || index}
            >
              {item.name || itemName(item.foodItemId || item, items)}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (row) => (
        <span className="rounded-full bg-slate-800 px-2 py-1 capitalize">
          {row.type}
        </span>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      render: (row) => (
        <span className="text-amber-300 capitalize">
          {row.priority} <ArrowUpRight size={13} className="inline" />
        </span>
      ),
    },
    { key: "conversion", label: "Conversion", render: () => "—" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={
            isActive(row.status) ? "text-emerald-300" : "text-slate-500"
          }
        >
          {pretty(isActive(row.status) ? "active" : "inactive")}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <Actions
          onEdit={() =>
            setRuleForm({
              ...blankRule,
              ...row,
              status: formStatus(row.status),
            })
          }
          onDelete={() => remove(deleteUpsellingRule, recordId(row), setRules)}
        />
      ),
    },
  ];
  const saveRule = (form = ruleForm) =>
    save(
      createUpsellingRule,
      updateUpsellingRule,
      form,
      blankRule,
      setRuleForm,
      setRules,
    );
  const metrics = [
    {
      label: "Impressions",
      value: analytics.impressions,
      icon: <Eye size={16} />,
    },
    {
      label: "Clicks",
      value: analytics.clicks,
      icon: <MousePointerClick size={16} />,
    },
    {
      label: "Add to cart",
      value: analytics.addToCart,
      icon: <ShoppingCart size={16} />,
    },
    {
      label: "Accepted",
      value: analytics.accepted,
      icon: <TrendingUp size={16} />,
    },
  ];
  const offerColumns = [
    { key: "triggerTiming", label: "Trigger Timing" },
    { key: "offerType", label: "Offer Type" },
    {
      key: "validForMinutes",
      label: "Valid For",
      render: (row) => `${row.validForMinutes} min`,
    },
    {
      key: "offerItemId",
      label: "Offer Item",
      render: (row) => itemName(row.offerItemId, items),
    },
    {
      key: "offerPrice",
      label: "Offer Price",
      render: (row) => money(row.offerPrice),
    },
    { key: "displayPriority", label: "Priority" },
    {
      key: "status",
      label: "Status",
      render: (row) => pretty(isActive(row.status) ? "active" : "inactive"),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <Actions
          onEdit={() =>
            setOfferForm({
              ...blankOffer,
              ...row,
              status: formStatus(row.status),
            })
          }
          onDelete={() =>
            remove(deletePostOrderOffer, recordId(row), setOffers)
          }
        />
      ),
    },
  ];
  const fastColumns = [
    {
      key: "foodItemId",
      label: "Item",
      render: (row) => itemName(row.foodItemId, items),
    },
    {
      key: "prepTimeMinutes",
      label: "Prep Time",
      render: (row) => `${row.prepTimeMinutes} min`,
    },
    {
      key: "stock",
      label: "Stock",
      render: (row) => {
        const item = items.find(
          (candidate) => recordId(candidate) === row.foodItemId,
        );
        return item?.trackInventory ? (item.stock ?? "—") : "—";
      },
    },
    {
      key: "offerPrice",
      label: "Offer Price",
      render: (row) => money(row.offerPrice),
    },
    { key: "displayPriority", label: "Priority" },
    {
      key: "status",
      label: "Status",
      render: (row) => pretty(isActive(row.status) ? "active" : "inactive"),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <Actions
          onEdit={() =>
            setFastForm({
              ...blankFast,
              ...row,
              status: formStatus(row.status),
            })
          }
          onDelete={() => remove(deleteFastItem, recordId(row), setFastItems)}
        />
      ),
    },
  ];
  const smartColumns = [
    { key: "category", label: "Category" },
    {
      key: "itemId",
      label: "Item",
      render: (row) => (row.itemId ? itemName(row.itemId, items) : "Any item"),
    },
    { key: "timeOfDay", label: "Time" },
    { key: "dayOfWeek", label: "Day" },
    { key: "tableType", label: "Table" },
    {
      key: "minOrderValue",
      label: "Min Order",
      render: (row) => money(row.minOrderValue),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => pretty(isActive(row.status) ? "active" : "inactive"),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <Actions
          onEdit={() =>
            setSmartForm({
              ...blankSmart,
              ...row,
              status: formStatus(row.status),
            })
          }
          onDelete={() => remove(deleteSmartRule, recordId(row), setSmartRules)}
        />
      ),
    },
  ];
  const saveSettings = async () => {
    try {
      const current = await getBillingSettings();
      await updateBillingSettings({ ...current, upselling: settings });
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  const showAnalytics = () => {
    setTab("overview");
    window.setTimeout(
      () =>
        analyticsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      0,
    );
  };
  const showComboBuilder = () => {
    setRuleForm({ ...blankRule });
    setTab("combinations");
    window.setTimeout(() => {
      comboRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      comboRef.current?.querySelector("select")?.focus();
    }, 0);
  };
  return (
    <Page
      title="Combinations & Upselling"
      action={
        <div className="flex gap-2">
          <Button secondary onClick={showAnalytics}>
            <Eye size={14} /> View Upsell Analytics
          </Button>
          <Button onClick={showComboBuilder}>
            <Plus size={14} /> Create Upsell Rule
          </Button>
        </div>
      }
    >
      <Notice text={error} onClose={() => setError("")} />
      <Tabs
        values={tabValues}
        labels={tabLabels}
        current={tab}
        onChange={setTab}
      />
      <div className="space-y-5 pt-4">
        {tab === "overview" && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Card
                title="Active Rules"
                value={rules.filter((rule) => isActive(rule.status)).length}
                detail="Active Rules"
                icon="✓"
              />
              <Card
                title="Upsell Revenue"
                value={money(analytics.revenueGenerated)}
                detail="Upsell Revenue"
                icon="₹"
              />
              <Card
                title="Conversion Rate"
                value={
                  analytics.conversionRate == null
                    ? "—"
                    : `${analytics.conversionRate}%`
                }
                detail="Conversion Rate"
                icon="%"
              />
              <Card
                title="Avg Order Value Increase"
                value={
                  analytics.averageOrderValueIncrease == null
                    ? "—"
                    : money(analytics.averageOrderValueIncrease)
                }
                detail="Avg Order Value Increase"
                icon="↗"
              />
            </div>
            <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <div className="relative min-w-[220px] flex-1">
                    <Search
                      size={15}
                      className="absolute top-3 left-3 text-slate-500"
                    />
                    <input
                      className={`${css} pl-9`}
                      placeholder="Search rules..."
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </div>
                  <Select value={ruleType} onChange={setRuleType}>
                    <option value="">All rule types</option>
                    <option value="combo">Combos</option>
                    <option value="upsell">Upsells</option>
                    <option value="addon">Add-ons</option>
                  </Select>
                </div>
                <Table columns={ruleColumns} rows={visibleRules} />
              </div>
              <div className="space-y-5">
                <RuleForm
                  items={items}
                  value={ruleForm}
                  setValue={setRuleForm}
                  onSave={() => saveRule()}
                />
                <OfferForm
                  items={items}
                  value={offerForm}
                  setValue={setOfferForm}
                  onSave={() =>
                    save(
                      createPostOrderOffer,
                      updatePostOrderOffer,
                      offerForm,
                      blankOffer,
                      setOfferForm,
                      setOffers,
                    )
                  }
                />
              </div>
            </div>
            <div ref={analyticsRef}>
              <Panel title="Upselling Analytics">
                <div className="grid grid-cols-2 gap-3">
                  {metrics.map((metric) => (
                    <Card
                      key={metric.label}
                      title={metric.label}
                      value={metric.value ?? "—"}
                      icon={metric.icon}
                    />
                  ))}
                </div>
              </Panel>
            </div>
          </>
        )}
        {tab === "combinations" && (
          <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <Table
              columns={ruleColumns}
              rows={rules.filter((rule) => rule.type === "combo")}
            />
            <div ref={comboRef}>
              <RuleForm
                items={items}
                value={{ ...ruleForm, type: "combo" }}
                setValue={setRuleForm}
                onSave={() => saveRule({ ...ruleForm, type: "combo" })}
              />
            </div>
          </div>
        )}
        {tab === "addons" && (
          <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <Table
              columns={ruleColumns}
              rows={rules.filter((rule) =>
                ["upsell", "addon"].includes(rule.type),
              )}
            />
            <RuleForm
              simple
              title="Add-on / Upsell Rule"
              items={items}
              value={{
                ...ruleForm,
                type: ruleForm.type === "combo" ? "upsell" : ruleForm.type,
              }}
              setValue={setRuleForm}
              onSave={() =>
                saveRule({
                  ...ruleForm,
                  type: ruleForm.type === "combo" ? "upsell" : ruleForm.type,
                  bundlePrice: undefined,
                  discountType: undefined,
                  discountValue: undefined,
                })
              }
            />
          </div>
        )}
        {tab === "offers" && (
          <ResourceTable
            title="Post-Order Offers"
            columns={offerColumns}
            rows={offers}
            side={
              <OfferForm
                items={items}
                value={offerForm}
                setValue={setOfferForm}
                onSave={() =>
                  save(
                    createPostOrderOffer,
                    updatePostOrderOffer,
                    offerForm,
                    blankOffer,
                    setOfferForm,
                    setOffers,
                  )
                }
              />
            }
          />
        )}
        {tab === "fast" && (
          <ResourceTable
            title="Fast Items"
            columns={fastColumns}
            rows={fastItems}
            side={
              <FastForm
                items={items}
                value={fastForm}
                setValue={setFastForm}
                onSave={() =>
                  save(
                    createFastItem,
                    updateFastItem,
                    fastForm,
                    blankFast,
                    setFastForm,
                    setFastItems,
                  )
                }
              />
            }
          />
        )}
        {tab === "smart" && (
          <ResourceTable
            title="Smart Recommendation Rules"
            columns={smartColumns}
            rows={smartRules}
            side={
              <SmartForm
                items={items}
                value={smartForm}
                setValue={setSmartForm}
                onSave={() =>
                  save(
                    createSmartRule,
                    updateSmartRule,
                    smartForm,
                    blankSmart,
                    setSmartForm,
                    setSmartRules,
                  )
                }
              />
            }
          />
        )}
        {tab === "settings" && (
          <Panel title="Upselling Rules & Settings">
            <div className="max-w-xl space-y-5">
              <Toggle
                label="Enable upselling globally"
                checked={settings.enabled !== false}
                onChange={(enabled) =>
                  setSettings((current) => ({ ...current, enabled }))
                }
              />
              <Field label="Default priority">
                <Select
                  value={settings.defaultPriority || "medium"}
                  onChange={(defaultPriority) =>
                    setSettings((current) => ({ ...current, defaultPriority }))
                  }
                >
                  <option>high</option>
                  <option>medium</option>
                  <option>low</option>
                </Select>
              </Field>
              <Button onClick={saveSettings}>
                <Check size={14} /> Save Settings
              </Button>
            </div>
          </Panel>
        )}
      </div>
    </Page>
  );
}

function ResourceTable({ title, columns, rows, side }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <div>
        <h2 className="mb-3 text-sm font-semibold">{title}</h2>
        <Table columns={columns} rows={rows} />
      </div>
      {side}
    </div>
  );
}
