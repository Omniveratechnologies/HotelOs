const formatCurrency = (val) => `₹${(val || 0).toLocaleString("en-IN")}`;
const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";

export const DataTable = ({
  columns,
  data,
  emptyMessage = "No data available",
  rowKey = "id",
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row) => (
            <tr
              key={row[rowKey] || row.id || JSON.stringify(row)}
              className="hover:bg-gray-50"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-gray-900">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const RoomTypeTable = ({ roomsByType }) => (
  <DataTable
    rowKey="type"
    columns={[
      { key: "type", header: "Room Type" },
      { key: "total", header: "Total" },
      { key: "occupied", header: "Occupied" },
      { key: "available", header: "Available" },
      { key: "reserved", header: "Reserved" },
      { key: "cleaning", header: "Cleaning" },
      {
        key: "occupancyRate",
        header: "Occupancy %",
        render: (row) => `${row.occupancyRate}%`,
      },
      {
        key: "avgRate",
        header: "Avg Rate",
        render: (row) => formatCurrency(row.avgRate),
      },
      {
        key: "revenue",
        header: "Revenue",
        render: (row) => formatCurrency(row.revenue),
      },
    ]}
    data={roomsByType}
  />
);

export const BookingSourcesTable = ({ bookingSources }) => (
  <DataTable
    rowKey="source"
    columns={[
      { key: "source", header: "Source" },
      { key: "count", header: "Bookings" },
    ]}
    data={bookingSources}
    emptyMessage="No bookings in this period"
  />
);

export const RecentBookingsTable = ({ recentBookings }) => (
  <DataTable
    rowKey="id"
    columns={[
      { key: "guestName", header: "Guest" },
      { key: "roomNumber", header: "Room" },
      { key: "roomType", header: "Type" },
      {
        key: "checkIn",
        header: "Check-in",
        render: (row) => formatDate(row.checkIn),
      },
      {
        key: "checkOut",
        header: "Check-out",
        render: (row) => formatDate(row.checkOut),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              {
                "checked-in": "bg-blue-100 text-blue-800",
                reserved: "bg-amber-100 text-amber-800",
                "checked-out": "bg-gray-100 text-gray-800",
              }[row.status] || "bg-gray-100 text-gray-800"
            }`}
          >
            {row.status}
          </span>
        ),
      },
    ]}
    data={recentBookings}
    emptyMessage="No recent bookings"
  />
);

export const TopFoodItemsTable = ({ topFoodItems }) => (
  <DataTable
    rowKey="name"
    columns={[
      { key: "name", header: "Item" },
      { key: "quantity", header: "Qty Sold" },
      {
        key: "revenue",
        header: "Revenue",
        render: (row) => formatCurrency(row.revenue),
      },
    ]}
    data={topFoodItems}
    emptyMessage="No F&B orders in this period"
  />
);

export const ServiceRequestTypesTable = ({ serviceRequestsByType }) => (
  <DataTable
    rowKey="type"
    columns={[
      { key: "type", header: "Type" },
      { key: "count", header: "Count" },
    ]}
    data={serviceRequestsByType}
    emptyMessage="No service requests in this period"
  />
);
