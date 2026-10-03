import * as XLSX from "xlsx";

export const exportLowStockToExcel = (items = []) => {
  const exportData = items.map((item, index) => ({
    "S.No": index + 1,
    Item: item.name,
    Category: item.category,
    "Current Stock": item.currentStock,
    Unit: item.unit,
    "Minimum Stock": item.minimumStock,
    "Recommended Order Qty": item.reorderQuantity,
    "Cost Per Unit": item.costPerUnit,
    "Estimated Purchase Value": item.estimatedPurchaseValue,
    Status: item.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Low Stock");

  XLSX.writeFile(workbook, "low-stock-items.xlsx");
};

export const createPurchaseOrder = async (items = []) => {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/inventory/purchase-orders`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: items.map((item) => ({
          inventoryItemId: item._id,
          quantity: item.reorderQuantity,
          unit: item.unit,
          unitCost: item.costPerUnit,
        })),
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create purchase order");
  }

  return data;
};

export const printLowStockList = (items = []) => {
  const printWindow = window.open("", "_blank", "width=1000,height=700");

  if (!printWindow) {
    return;
  }

  const rows = items
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.name}</td>
          <td>${item.category}</td>
          <td>${item.currentStock} ${item.unit}</td>
          <td>${item.minimumStock} ${item.unit}</td>
          <td>${item.reorderQuantity} ${item.unit}</td>
          <td>${item.status}</td>
        </tr>
      `,
    )
    .join("");

  printWindow.document.write(`
    <html>
      <head>
        <title>Low Stock Items</title>

        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 30px;
          }

          h2 {
            margin-bottom: 20px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th,
          td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
            font-size: 12px;
          }

          th {
            background: #f2f2f2;
          }
        </style>
      </head>

      <body>
        <h2>Low Stock Items</h2>

        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Item</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Minimum Stock</th>
              <th>Recommended Qty</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
