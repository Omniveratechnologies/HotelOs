import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInventoryReport = (items = []) => {
  if (!items.length) {
    alert("No inventory data available to generate the report.");
    return;
  }

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("HOTEL OS", 14, 20);

  doc.setFontSize(14);
  doc.text("Inventory Report", 14, 30);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 38);

  autoTable(doc, {
    startY: 46,

    head: [
      [
        "#",
        "Item",
        "Category",
        "Current Stock",
        "Unit",
        "Min Stock",
        "Cost / Unit",
        "Stock Value",
      ],
    ],

    body: items.map((item, index) => [
      index + 1,
      item.name || "-",
      item.category || "-",
      item.currentStock || 0,
      item.unit || "-",
      item.minimumStock || 0,
      `₹${Number(item.costPerUnit || 0).toFixed(2)}`,
      `₹${(
        Number(item.currentStock || 0) * Number(item.costPerUnit || 0)
      ).toFixed(2)}`,
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

  doc.save(`inventory-report-${new Date().toISOString().split("T")[0]}.pdf`);
};
