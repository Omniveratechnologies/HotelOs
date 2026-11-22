import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FiChevronDown,
  FiDownload,
  FiEdit2,
  FiMoreVertical,
  FiPlus,
  FiPrinter,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiX,
} from "react-icons/fi";
import Navbar from "../components/ui/Navbar.jsx";
import Sidebar from "../components/hamburger/SideBar.jsx";
import StatusCard from "../components/ui/StatusCard.jsx";
import {
  createTable,
  deleteTable,
  downloadTableQr,
  getTables,
  updateTable,
} from "../services/tables.js";

const initialForm = {
  tableNumber: "",
  seats: "2",
  section: "Main Hall",
  status: "AVAILABLE",
};
const statuses = ["AVAILABLE", "OCCUPIED", "RESERVED"];
const statusStyles = {
  AVAILABLE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  OCCUPIED: "border-red-500/30 bg-red-500/10 text-red-400",
  RESERVED: "border-amber-500/30 bg-amber-500/10 text-amber-400",
};
const displayStatus = (status) =>
  status?.toLowerCase().replace(/^./, (letter) => letter.toUpperCase());

const AddTables = () => {
  const [tables, setTables] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingTable, setEditingTable] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [section, setSection] = useState("ALL");
  const [search, setSearch] = useState("");
  const [qrPreview, setQrPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getTables()
      .then(setTables)
      .catch((loadError) =>
        setError(loadError.message || "Unable to load tables"),
      )
      .finally(() => setLoading(false));
  }, []);
  useEffect(
    () => () => qrPreview && URL.revokeObjectURL(qrPreview.url),
    [qrPreview],
  );

  const sections = useMemo(
    () =>
      [...new Set(tables.map((table) => table.section).filter(Boolean))].sort(),
    [tables],
  );
  const filteredTables = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tables.filter(
      (table) =>
        (section === "ALL" || table.section === section) &&
        (!query || String(table.tableNumber).toLowerCase().includes(query)),
    );
  }, [tables, section, search]);
  const counts = statuses.map(
    (status) => tables.filter((table) => table.status === status).length,
  );

  const showQr = async (table) => {
    try {
      const blob = await downloadTableQr(table.id);
      setQrPreview((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return { table, url: URL.createObjectURL(blob) };
      });
      setOpenMenu(null);
    } catch (qrError) {
      setError(qrError.message || "Unable to load QR code");
    }
  };
  const openEditPanel = (table) => {
    setEditingTable(table);
    setForm({
      tableNumber: table.tableNumber,
      seats: String(table.seats),
      section: table.section || "Main Hall",
      status: table.status,
    });
    setOpenMenu(null);
    setIsPanelOpen(true);
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form, seats: Number(form.seats) };
      const savedTable = editingTable
        ? await updateTable(editingTable.id, payload)
        : await createTable(payload);
      setTables((current) =>
        editingTable
          ? current.map((table) =>
              table.id === editingTable.id ? savedTable : table,
            )
          : [...current, savedTable],
      );
      setIsPanelOpen(false);
      setEditingTable(null);
      if (!editingTable) await showQr(savedTable);
    } catch (saveError) {
      setError(saveError.message || "Unable to save table");
    } finally {
      setSaving(false);
    }
  };
  const removeTable = async (table, action) => {
    if (!window.confirm(`${action} table ${table.tableNumber}?`)) return;
    try {
      await deleteTable(table.id);
      setTables((current) => current.filter((item) => item.id !== table.id));
      setOpenMenu(null);
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete table");
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0f0f0f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <div
        className={`min-h-screen transition-transform duration-300 ${isMenuOpen ? "translate-x-64" : "translate-x-0"}`}
      >
        <Navbar
          title="Add Tables"
          subtitle="Manage seating, sections and table QR codes."
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
        />
        <main className="space-y-5 px-4 py-4 md:px-6">
          {error && (
            <div className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
              <span>{error}</span>
              <button onClick={() => setError("")} title="Dismiss">
                <FiX />
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatusCard
              title="Total Tables"
              value={tables.length}
              icon={<FiUsers />}
              iconColor="text-blue-400"
              iconBg="bg-blue-950"
            />
            <StatusCard
              title="Available"
              value={counts[0]}
              icon={
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              }
              iconColor="text-emerald-400"
              iconBg="bg-emerald-950"
            />
            <StatusCard
              title="Occupied"
              value={counts[1]}
              icon={<span className="h-2.5 w-2.5 rounded-full bg-red-400" />}
              iconColor="text-red-400"
              iconBg="bg-red-950"
            />
            <StatusCard
              title="Reserved"
              value={counts[2]}
              icon={<span className="h-2.5 w-2.5 rounded-full bg-amber-400" />}
              iconColor="text-amber-400"
              iconBg="bg-amber-950"
            />
          </div>
          <section className="rounded-lg border border-gray-800 bg-[#151515] p-4 md:p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-semibold">Restaurant Tables</h2>
                <p className="mt-1 text-xs text-gray-500">
                  {filteredTables.length} table
                  {filteredTables.length === 1 ? "" : "s"} shown
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingTable(null);
                  setForm(initialForm);
                  setIsPanelOpen(true);
                }}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                <FiPlus /> Add Table
              </button>
            </div>
            <div className="mt-5 flex flex-col gap-3 border-b border-gray-800 pb-5 sm:flex-row">
              <label className="relative flex-1">
                <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by table number"
                  className="w-full rounded-lg border border-gray-700 bg-[#0f0f0f] py-2.5 pr-3 pl-9 text-xs text-white outline-none focus:border-emerald-500"
                />
              </label>
              <label className="relative sm:w-48">
                <select
                  value={section}
                  onChange={(event) => setSection(event.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2.5 text-xs text-gray-300 outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All Sections</option>
                  {sections.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500" />
              </label>
            </div>
            {loading ? (
              <p className="py-12 text-center text-xs text-gray-500">
                Loading tables...
              </p>
            ) : filteredTables.length === 0 ? (
              <p className="py-12 text-center text-xs text-gray-500">
                No tables found.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 pt-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredTables.map((table) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    onEdit={openEditPanel}
                    onQr={showQr}
                    onDelete={removeTable}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
      {qrPreview && (
        <QrPreview preview={qrPreview} onClose={() => setQrPreview(null)} />
      )}
      <TablePanel
        isOpen={isPanelOpen}
        editingTable={editingTable}
        form={form}
        setForm={setForm}
        onClose={() => setIsPanelOpen(false)}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </div>
  );
};

const TableCard = ({
  table,
  openMenu,
  setOpenMenu,
  onEdit,
  onQr,
  onDelete,
}) => (
  <article className="relative rounded-lg border border-gray-800 bg-[#1d1d1d] p-4 hover:border-gray-600">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] tracking-[2px] text-gray-500 uppercase">
          Table
        </p>
        <h3 className="mt-1 text-2xl font-bold">{table.tableNumber}</h3>
      </div>
      <div className="relative">
        <button
          onClick={() => setOpenMenu(openMenu === table.id ? null : table.id)}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
          title="Table actions"
        >
          <FiMoreVertical />
        </button>
        {openMenu === table.id && (
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-gray-700 bg-[#111] py-1 shadow-xl">
            <button
              onClick={() => onEdit(table)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <FiEdit2 /> Edit
            </button>
            <button
              onClick={() => onQr(table)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <FiDownload /> View/Download QR
            </button>
            <button
              onClick={() => onDelete(table, "Deactivate")}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <FiTrash2 /> Deactivate
            </button>
            <button
              onClick={() => onDelete(table, "Delete")}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 hover:bg-gray-800"
            >
              <FiTrash2 /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
    <div className="mt-5 flex items-center justify-between border-t border-gray-800 pt-4">
      <div className="space-y-1 text-xs text-gray-400">
        <p>{table.seats} seats</p>
        <p>{table.section || "Main Hall"}</p>
      </div>
      <span
        className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusStyles[table.status] || "border-gray-700 text-gray-400"}`}
      >
        {displayStatus(table.status)}
      </span>
    </div>
  </article>
);

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-medium text-gray-300">
      {label}
    </span>
    {Children.map(children, (child) =>
      isValidElement(child)
        ? cloneElement(child, {
            className:
              "w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500",
          })
        : child,
    )}
  </label>
);
const TablePanel = ({
  isOpen,
  editingTable,
  form,
  setForm,
  onClose,
  onSubmit,
  saving,
}) =>
  !isOpen ? null : (
    <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose}>
      <aside
        className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto border-l border-gray-800 bg-[#111] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <div>
            <h2 className="font-semibold">
              {editingTable ? "Edit Table" : "Add Table"}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Configure the table details.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
            title="Close"
          >
            <FiX />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-5 p-5">
          <Field label="Table Number">
            <input
              required
              value={form.tableNumber}
              onChange={(event) =>
                setForm({ ...form, tableNumber: event.target.value })
              }
              placeholder="e.g. T-01"
            />
          </Field>
          <Field label="Seats">
            <select
              value={form.seats}
              onChange={(event) =>
                setForm({ ...form, seats: event.target.value })
              }
            >
              <option value="2">2 seats</option>
              <option value="4">4 seats</option>
              <option value="6">6 seats</option>
              <option value="8">8 seats</option>
            </select>
          </Field>
          <Field label="Section">
            <input
              list="table-sections"
              required
              value={form.section}
              onChange={(event) =>
                setForm({ ...form, section: event.target.value })
              }
            />
            <datalist id="table-sections">
              <option value="Main Hall" />
              <option value="Garden Area" />
              <option value="VIP Section" />
            </datalist>
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value })
              }
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {displayStatus(status)}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex gap-3 border-t border-gray-800 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-xs text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingTable
                  ? "Save Changes"
                  : "Add Table"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
const QrPreview = ({ preview, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    onClick={onClose}
  >
    <div
      className="w-full max-w-sm rounded-lg border border-gray-700 bg-[#171717] p-5 text-center"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Table {preview.table.tableNumber} QR</h2>
        <button
          onClick={onClose}
          title="Close"
          className="text-gray-400 hover:text-white"
        >
          <FiX />
        </button>
      </div>
      <img
        src={preview.url}
        alt={`QR code for table ${preview.table.tableNumber}`}
        className="mx-auto my-5 h-64 w-64 bg-white p-3"
      />
      <div className="flex flex-wrap justify-center gap-3">
        <a
          href={preview.table.qrUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          Open guest ordering page
        </a>
        <a
          href={preview.url}
          download={`table-${preview.table.tableNumber}-qr.png`}
          className="flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-xs text-gray-300 hover:bg-gray-800"
        >
          <FiDownload /> Download
        </a>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-xs text-gray-300 hover:bg-gray-800"
        >
          <FiPrinter /> Print
        </button>
      </div>
    </div>
  </div>
);

export default AddTables;
