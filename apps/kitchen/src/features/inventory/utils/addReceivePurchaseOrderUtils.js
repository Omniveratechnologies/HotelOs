import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const fetchPurchaseOrder = async (API_BASE_URL) => {
  const response = await fetch(`${API_BASE_URL}/inventory/purchase-history`);

  if (!response.ok) {
    throw new Error("Failed to fetch purchase history");
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error("Failed to load purchase history");
  }

  return result.data;
};

export const generatePurchaseOrderPDF = (purchaseOrder) => {
  if (!purchaseOrder.length) {
    alert("No purchase history available to generate the report.");
    return;
  }

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("HOTEL OS", 14, 20);

  doc.setFontSize(14);
  doc.text("Purchase Order Report", 14, 30);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 38);

  const totalRecords = purchaseOrder.length;

  const totalQuantity = purchaseOrder.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0,
  );

  const totalCost = purchaseOrder.reduce(
    (total, item) => total + Number(item.totalCost || 0),
    0,
  );

  doc.text(`Total Records: ${totalRecords}`, 14, 46);
  doc.text(`Total Quantity: ${totalQuantity}`, 75, 46);
  doc.text(`Total Cost: ₹${totalCost}`, 140, 46);

  autoTable(doc, {
    startY: 54,
    head: [
      [
        "#",
        "Item",
        "Category",
        "Supplier",
        "Qty",
        "Unit",
        "Unit Cost",
        "Total Cost",
        "Date",
      ],
    ],
    body: purchaseOrder.map((item, index) => [
      index + 1,
      item.inventoryItem?.name || "-",
      item.inventoryItem?.category || item.category || "-",
      item.supplierName || "-",
      item.quantity || 0,
      item.unit || item.inventoryItem?.unit || "-",
      `₹${item.costPerUnit || 0}`,
      `₹${item.totalCost || 0}`,
      item.purchaseDate
        ? new Date(item.purchaseDate).toLocaleDateString("en-IN")
        : "-",
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fontStyle: "bold",
    },
    margin: {
      left: 14,
      right: 14,
    },
  });

  doc.save(
    `purchase-order-report-${new Date().toISOString().split("T")[0]}.pdf`,
  );
};
