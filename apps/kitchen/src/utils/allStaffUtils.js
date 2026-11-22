import * as XLSX from "xlsx";

export const exportStaffToExcel = (staff = []) => {
  const exportData = staff.map((member, index) => ({
    "S.No": index + 1,
    "Staff ID": member.staffId || member.employeeId || "",
    Name:
      member.name ||
      member.fullName ||
      [member.firstName, member.lastName].filter(Boolean).join(" "),
    Email: member.email || "",
    Phone: member.phone || member.phoneNumber || "",
    Department:
      member.department?.name ||
      member.departmentName ||
      member.department ||
      "",
    Designation:
      member.designation?.name ||
      member.designationName ||
      member.designation ||
      "",
    Status: member.status || "",
    "Date of Joining": member.joinDate || member.dateOfJoining || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "All Staff");

  XLSX.writeFile(workbook, "all-staff.xlsx");
};

export const printStaffList = (staff = []) => {
  const printWindow = window.open("", "_blank", "width=1000,height=700");

  if (!printWindow) return;

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };

      return entities[character];
    });

  const rows = staff
    .map((member, index) => {
      const name =
        member.name ||
        member.fullName ||
        [member.firstName, member.lastName].filter(Boolean).join(" ");

      const department =
        member.department?.name ||
        member.departmentName ||
        member.department ||
        "";

      const designation =
        member.designation?.name ||
        member.designationName ||
        member.designation ||
        "";

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(member.staffId || member.employeeId)}</td>
          <td>${escapeHtml(name)}</td>
          <td>${escapeHtml(member.email)}</td>
          <td>${escapeHtml(member.phone || member.phoneNumber)}</td>
          <td>${escapeHtml(department)}</td>
          <td>${escapeHtml(designation)}</td>
          <td>${escapeHtml(member.status)}</td>
        </tr>
      `;
    })
    .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>All Staff</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 24px;
            color: #222;
          }
          h2 { margin-bottom: 20px; }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
            font-size: 11px;
          }
          th { background: #f2f2f2; }
        </style>
      </head>
      <body>
        <h2>All Staff</h2>
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Staff ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
