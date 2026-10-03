import DeleteButton from "../ui/button/DeleteButton.jsx";
import ViewButton from "../ui/button/ViewButton.jsx";
import EditButton from "../ui/button/EditButton.jsx";
import StatusBadge from "../ui/StatusBadge.jsx";
import Table from "../ui/Table.jsx";

const PurchaseOrderTable = ({
  purchaseOrders,
  onView,
  onEdit,
  onDelete,
  onViewOrderPage,
}) => {
  const columns = [
    {
      key: "serialNumber",
      label: "S.No",
      render: (_, index) => index + 1,
    },
    {
      key: "poNumber",
      label: "PO Number",
      render: (row) => row.poNumber || "-",
    },
    {
      key: "orderDate",
      label: "Order Date",
      render: (row) =>
        row.orderDate
          ? new Date(row.orderDate).toLocaleDateString("en-IN")
          : "-",
    },
    {
      key: "expectedDeliveryDate",
      label: "Expected Delivery",
      render: (row) =>
        row.expectedDeliveryDate
          ? new Date(row.expectedDeliveryDate).toLocaleDateString("en-IN")
          : "-",
    },
    {
      key: "totalAmount",
      label: "Total Amount",
      render: (row) =>
        `₹${Number(row.totalAmount || 0).toLocaleString("en-IN")}`,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <ViewButton onClick={() => onView(row)} />

          <EditButton onClick={() => onEdit(row)} />

          <DeleteButton onClick={() => onDelete(row)} />
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={purchaseOrders}
      onRowClick={onViewOrderPage}
      emptyMessage="No purchase orders found"
    />
  );
};

export default PurchaseOrderTable;
