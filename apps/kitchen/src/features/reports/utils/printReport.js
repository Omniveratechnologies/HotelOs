const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );

const STYLES = `
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 16px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .sub { font-size: 11px; color: #555; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
  th { background: #166534; color: #fff; }
  tr:nth-child(even) td { background: #f5f5f5; }
  .note { font-size: 10px; color: #92400e; margin-top: 8px; }
  @media print { th { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`;

export const writePrintView = (
  win,
  { title, subtitle, columns, rows, total },
) => {
  const head = columns.map((c) => `<th>${escapeHtml(c.title)}</th>`).join("");

  const body = rows
    .map(
      (row, index) =>
        `<tr><td>${index + 1}</td>${columns
          .map((c) => `<td>${escapeHtml(row[c.key])}</td>`)
          .join("")}</tr>`,
    )
    .join("");

  const note =
    total > rows.length
      ? `<p class="note">Showing the first ${rows.length} of ${total} records. Use Excel / PDF / CSV for the full report.</p>`
      : "";

  win.document.open();
  win.document.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${STYLES}</style></head><body>` +
      `<h1>${escapeHtml(title)}</h1><p class="sub">${escapeHtml(subtitle)}</p>` +
      `<table><thead><tr><th>#</th>${head}</tr></thead><tbody>${body}</tbody></table>${note}</body></html>`,
  );
  win.document.close();

  win.focus();
  setTimeout(() => win.print(), 300);
};
