import { FiCalendar, FiDownload } from "react-icons/fi";

import Filters from "../ui/Filters";
import SearchBar from "../ui/SearchBar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const OrdersHeader = ({
  filters,
  onFilterChange,
  searchTerm,
  setSearchTerm,
  orders,
}) => {
  const filterOptions = [
    {
      name: "status",
      options: [
        { value: "ALL", label: "All Status" },
        { value: "NEW", label: "New" },
        { value: "PREPARING", label: "Preparing" },
        { value: "READY", label: "Ready" },
        {
          value: "OUT FOR DELIVERY",
          label: "Out for Delivery",
        },
        { value: "REJECTED", label: "Rejected" },
      ],
    },
    {
      name: "payment",
      options: [
        { value: "ALL", label: "All Payment" },
        { value: "PAID", label: "Paid" },
        { value: "PENDING", label: "Pending" },
      ],
    },
  ];

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Hotel OS - Orders Report", 14, 20);

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    const tableData = orders.map((order) => [
      order.orderNumber || "-",
      order.guestName || "-",
      order.roomNumber || "-",
      order.foodItem || "-",
      order.quantity || 0,
      order.status || "-",
      order.paymentStatus || "-",
      order.createdAt ? new Date(order.createdAt).toLocaleString() : "-",
    ]);

    autoTable(doc, {
      startY: 35,
      head: [
        [
          "Order ID",
          "Guest",
          "Room",
          "Item",
          "Qty",
          "Status",
          "Payment",
          "Order Time",
        ],
      ],
      body: tableData,
      styles: {
        fontSize: 8,
      },
    });

    doc.save("hotel-os-orders.pdf");
  };

  return (
    <div className="flex flex-col gap-3 border-b border-gray-800 px-3 py-2 md:flex-row md:items-center">
      <div className="relative shrink-0">
        <FiCalendar
          size={14}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
        />

        <input
          type="date"
          value={filters.date}
          onChange={(e) => onFilterChange("date", e.target.value)}
          className="rounded-lg border border-gray-700 bg-[#0f0f0f] py-2 pr-3 pl-9 text-xs text-gray-300 outline-none focus:border-emerald-500"
        />
      </div>
      <Filters
        filters={filterOptions}
        values={filters}
        onChange={onFilterChange}
      />

      <div className="flex-1">
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholder="Search orders, room no., guest name,..."
        />
      </div>

      <button
        type="button"
        onClick={handleExportPDF}
        className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-xs text-gray-300 transition hover:border-gray-600 hover:bg-gray-900 hover:text-white"
      >
        <FiDownload size={14} />
        Export
      </button>
    </div>
  );
};

export default OrdersHeader;
