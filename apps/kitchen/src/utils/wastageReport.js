const toCSV = (records) => {
  const headers = [
    "Date",
    "Item Name",
    "Batch No.",
    "Quantity",
    "Unit",
    "Reason",
    "Department",
    "Cost (₹)",
    "Notes",
  ];

  const escapeCell = (value) => {
    const str = String(value ?? "");

    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = records.map((r) => [
    new Date(r.date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    r.itemName,
    r.batchNumber || "-",
    r.quantity,
    r.unit,
    r.reason,
    r.department,
    Number(r.totalCost || 0).toFixed(2),
    r.notes || "",
  ]);

  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(","));
  return lines.join("\n");
};

const downloadFile = (
  content,
  filename,
  mimeType = "text/csv;charset=utf-8;",
) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const WastageReport = async (apiBaseUrl, filters = {}) => {
  const params = new URLSearchParams({
    search: filters.search || "",
    reason: filters.reason || "ALL",
    department: filters.department || "ALL",
    period: filters.period || "All Time",
    page: 1,
    limit: 10000,
  });

  const res = await fetch(
    `${apiBaseUrl}/inventory/wastage?${params.toString()}`,
  );
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(
      data.message || "Failed to fetch wastage records for report",
    );
  }

  const records = data.data.records;

  if (records.length === 0) {
    throw new Error("No wastage records found for the selected filters.");
  }

  const csv = toCSV(records);
  const today = new Date().toISOString().slice(0, 10);
  downloadFile(csv, `wastage-report-${today}.csv`);

  return records.length;
};
