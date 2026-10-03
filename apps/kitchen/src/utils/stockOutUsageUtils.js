import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const fetchUsageHistory = async (API_BASE_URL) => {
  const response = await fetch(`${API_BASE_URL}/inventory/usage`);

  if (!response.ok) {
    throw new Error("Failed to fetch usage history");
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error("Failed to load usage history");
  }

  return result.data;
};

export const generateUsageReportPDF = (usageHistory) => {
  if (!usageHistory.length) {
    alert("No usage history available to generate the report.");
    return;
  }

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("HOTEL OS", 14, 20);

  doc.setFontSize(14);
  doc.text("Stock Usage Report", 14, 30);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 38);

  const totalRecords = usageHistory.length;

  const totalQuantity = usageHistory.reduce(
    (total, item) => total + Number(item.quantityUsed || 0),
    0,
  );

  doc.text(`Total Records: ${totalRecords}`, 14, 46);
  doc.text(`Total Quantity Used: ${totalQuantity}`, 80, 46);

  autoTable(doc, {
    startY: 54,
    head: [
      [
        "#",
        "Item",
        "Category",
        "Quantity",
        "Unit",
        "Reason",
        "Department",
        "Reference",
        "Date",
      ],
    ],
    body: usageHistory.map((item, index) => [
      index + 1,
      item.inventoryItem?.name || "-",
      item.inventoryItem?.category || item.category || "-",
      item.quantityUsed || 0,
      item.unit || item.inventoryItem?.unit || "-",
      item.usageType || "-",
      item.department || "-",
      item.reference || "-",
      item.usedDate ? new Date(item.usedDate).toLocaleDateString("en-IN") : "-",
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

  doc.save(`stock-usage-report-${new Date().toISOString().split("T")[0]}.pdf`);
};
