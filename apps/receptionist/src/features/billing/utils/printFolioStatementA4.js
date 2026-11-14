const formatCurr = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

/**
 * Isolated A4 Statement Printing Pipeline via hidden iframe.
 *
 * @param {Object} [folio={}]
 * @param {Array} [charges=[]]
 * @param {Array} [payments=[]]
 */
export function printFolioStatementA4(folio = {}, charges = [], payments = []) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const totalCharges = Number(folio.summary?.grandTotal ?? folio.total ?? 0);
  const totalPaid = Number(folio.summary?.totalPaid ?? folio.paid ?? 0);
  const balanceDue = Number(
    folio.summary?.balanceDue ??
      folio.balanceDue ??
      Math.max(totalCharges - totalPaid, 0),
  );

  const chargesRows = (charges || [])
    .map(
      (c) => `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb;">${c.date ? new Date(c.date).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN")}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb;">${c.name || c.description || "Charge"}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-transform: uppercase;">${c.department || "ROOM"}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${c.quantity || 1}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatCurr(c.amount || c.total || 0)}</td>
      </tr>
    `,
    )
    .join("");

  const paymentsRows = (payments || [])
    .map(
      (p) => `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb;">${p.date || p.createdAt ? new Date(p.date || p.createdAt).toLocaleDateString("en-IN") : "—"}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-transform: capitalize;">${p.method || "Cash"}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-family: monospace;">${p.referenceNo || p.reference || "—"}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #047857; font-weight: 600;">${formatCurr(p.amount || 0)}</td>
      </tr>
    `,
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Folio Statement - ${folio.folioNo || "FL-1001"}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #111827;
            font-size: 11pt;
            line-height: 1.4;
            background: #fff;
            padding: 10px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 14px;
            margin-bottom: 18px;
          }
          .hotel-name {
            font-size: 20pt;
            font-weight: 800;
            color: #1e3a8a;
            letter-spacing: -0.5px;
          }
          .hotel-sub {
            font-size: 9pt;
            color: #4b5563;
            margin-top: 2px;
          }
          .statement-title {
            text-align: right;
          }
          .statement-title h1 {
            font-size: 16pt;
            font-weight: 700;
            color: #111827;
          }
          .statement-title p {
            font-size: 9pt;
            color: #6b7280;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 18px;
            background: #f9fafb;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            font-size: 9.5pt;
          }
          .info-block p {
            margin-bottom: 3px;
          }
          .info-block strong {
            color: #374151;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5pt;
            margin-bottom: 18px;
          }
          th {
            background: #f3f4f6;
            color: #374151;
            font-weight: 600;
            text-align: left;
            padding: 8px;
            border-bottom: 1px solid #d1d5db;
          }
          .section-heading {
            font-size: 11pt;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .summary-table {
            width: 280px;
            margin-left: auto;
            margin-bottom: 20px;
          }
          .summary-table td {
            padding: 4px 8px;
          }
          .summary-total {
            font-size: 12pt;
            font-weight: 800;
            border-top: 2px solid #111827;
            padding-top: 6px !important;
          }
          .footer {
            margin-top: 30px;
            border-top: 1px solid #e5e7eb;
            padding-top: 12px;
            font-size: 8.5pt;
            color: #6b7280;
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
          }
          .sig-line {
            width: 200px;
            border-top: 1px dashed #9ca3af;
            text-align: center;
            padding-top: 4px;
            font-size: 9pt;
            color: #4b5563;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="hotel-name">Stayscape Dev</div>
            <div class="hotel-sub">Salt Lake Sector V, Bidhannagar, Kolkata, West Bengal 700091</div>
            <div class="hotel-sub">GSTIN: 19AAACH7409R1ZZ · Phone: +91 33 2955 8000</div>
          </div>
          <div class="statement-title">
            <h1>GUEST FOLIO STATEMENT</h1>
            <p><strong>Folio No:</strong> ${folio.folioNo || "FL-1001"}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString("en-IN")}</p>
            <p><strong>Status:</strong> ${folio.status || "In House"}</p>
          </div>
        </div>

        <div class="grid-2">
          <div class="info-block">
            <p><strong>Guest Name:</strong> ${folio.guestName || "Guest"}</p>
            <p><strong>Phone:</strong> ${folio.guestPhone || "—"}</p>
            <p><strong>Email:</strong> ${folio.guestEmail || "—"}</p>
            <p><strong>Booking Ref:</strong> ${folio.bookingNo || "—"}</p>
          </div>
          <div class="info-block">
            <p><strong>Room Number:</strong> ${folio.roomNumber || "101"}</p>
            <p><strong>Room Type:</strong> ${folio.roomType || "Standard"}</p>
            <p><strong>Rate Plan:</strong> ${folio.ratePlan || "EP - European Plan"}</p>
            <p><strong>Stay Period:</strong> ${folio.checkIn ? new Date(folio.checkIn).toLocaleDateString("en-IN") : "—"} to ${folio.checkOut ? new Date(folio.checkOut).toLocaleDateString("en-IN") : "—"}</p>
          </div>
        </div>

        <div class="section-heading">Itemized Charges</div>
        <table>
          <thead>
            <tr>
              <th style="width: 15%;">Date</th>
              <th style="width: 45%;">Description</th>
              <th style="width: 15%;">Department</th>
              <th style="width: 10%; text-align: center;">Qty</th>
              <th style="width: 15%; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${chargesRows || '<tr><td colspan="5" style="text-align:center; padding:12px; color:#6b7280;">No charges recorded.</td></tr>'}
          </tbody>
        </table>

        ${
          payments && payments.length > 0
            ? `
          <div class="section-heading">Settlements & Payments</div>
          <table>
            <thead>
              <tr>
                <th style="width: 25%;">Date</th>
                <th style="width: 25%;">Method</th>
                <th style="width: 25%;">Reference</th>
                <th style="width: 25%; text-align: right;">Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              ${paymentsRows}
            </tbody>
          </table>
        `
            : ""
        }

        <table class="summary-table">
          <tr>
            <td>Total Charges:</td>
            <td style="text-align: right; font-weight: 600;">${formatCurr(totalCharges)}</td>
          </tr>
          <tr>
            <td>Total Payments:</td>
            <td style="text-align: right; color: #047857; font-weight: 600;">${formatCurr(totalPaid)}</td>
          </tr>
          <tr class="summary-total">
            <td>Balance Due:</td>
            <td style="text-align: right; color: ${balanceDue > 0 ? "#b91c1c" : "#047857"};">${formatCurr(balanceDue)}</td>
          </tr>
        </table>

        <div class="signature-box">
          <div class="sig-line">Guest Signature</div>
          <div class="sig-line">Cashier / Front Desk Officer</div>
        </div>

        <div class="footer">
          <span>Thank you for staying at Stayscape Dev.</span>
          <span>Computer generated folio statement.</span>
        </div>
      </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1500);
  }, 250);
}
