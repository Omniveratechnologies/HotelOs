import Table from "../ui/Table.jsx";

const PurchaseOrderItemsTable = ({ items = [] }) => {
  const columns = [
    {
      key: "serialNumber",
      label: "#",
      render: (_, index) => index + 1,
    },
    {
      key: "itemName",
      label: "Item",
      render: (row) => row.itemName || row.inventoryItem?.name || "-",
    },
    {
      key: "quantity",
      label: "Ordered",
      render: (row) => `${row.quantity} ${row.unit}`,
    },
    {
      key: "receivedQuantity",
      label: "Received",
      render: (row) => `${row.receivedQuantity ?? 0} ${row.unit}`,
    },
    {
      key: "remainingQuantity",
      label: "Pending",
      render: (row) => `${row.remainingQuantity ?? row.quantity} ${row.unit}`,
    },
    {
      key: "unitCost",
      label: "Unit Price",
      render: (row) => `₹${Number(row.unitCost || 0).toLocaleString("en-IN")}`,
    },
    {
      key: "totalCost",
      label: "Total",
      render: (row) => `₹${Number(row.totalCost || 0).toLocaleString("en-IN")}`,
    },
  ];

  return (
    <Table
      columns={columns}
      data={items}
      emptyMessage="No items in this purchase order"
    />
  );
};

export default PurchaseOrderItemsTable;
