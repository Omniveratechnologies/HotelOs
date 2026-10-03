import ModalForm from "../ui/ModalForm.jsx";

const PurchaseOrderViewModal = ({ isOpen, onClose, purchaseOrder }) => {
  if (!purchaseOrder) {
    return null;
  }

  const fields = [
    {
      name: "poNumber",
      label: "PO Number",
      type: "text",
      readOnly: true,
    },
    {
      name: "supplierName",
      label: "Supplier",
      type: "text",
      readOnly: true,
    },
    {
      name: "orderDate",
      label: "Order Date",
      type: "text",
      readOnly: true,
    },
    {
      name: "expectedDeliveryDate",
      label: "Expected Delivery",
      type: "text",
      readOnly: true,
    },
    {
      name: "status",
      label: "Status",
      type: "text",
      readOnly: true,
    },
    {
      name: "subtotal",
      label: "Subtotal",
      type: "text",
      readOnly: true,
    },
    {
      name: "taxPercentage",
      label: "Tax",
      type: "text",
      readOnly: true,
    },
    {
      name: "totalAmount",
      label: "Total Amount",
      type: "text",
      readOnly: true,
    },
    {
      name: "notes",
      label: "Notes",
      type: "text",
      readOnly: true,
      fullWidth: true,
    },
  ];

  const initialData = {
    poNumber: purchaseOrder.poNumber || "-",
    supplierName: purchaseOrder.supplierName || "-",

    orderDate: purchaseOrder.orderDate
      ? new Date(purchaseOrder.orderDate).toLocaleDateString("en-IN")
      : "-",

    expectedDeliveryDate: purchaseOrder.expectedDeliveryDate
      ? new Date(purchaseOrder.expectedDeliveryDate).toLocaleDateString("en-IN")
      : "-",

    status: purchaseOrder.status || "-",

    subtotal: `₹${Number(purchaseOrder.subtotal || 0).toLocaleString("en-IN")}`,

    taxPercentage: `${purchaseOrder.taxPercentage || 0}%`,

    totalAmount: `₹${Number(purchaseOrder.totalAmount || 0).toLocaleString(
      "en-IN",
    )}`,

    notes: purchaseOrder.notes || "-",
  };

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title="Purchase Order Details"
      subtitle="View purchase order information"
      fields={fields}
      initialData={initialData}
      submitText="Close"
      showCancel={false}
      onSubmit={onClose}
    />
  );
};

export default PurchaseOrderViewModal;
