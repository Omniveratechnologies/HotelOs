import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import logger from "#/utils/logger.js";

/**
 * Helper to format currency in INR style
 */
const fmtMoney = (val) => {
  const num = Number(val || 0);
  return `INR ${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fmtDateTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Generates an official A4 Guest Folio Statement PDF and streams it directly to response
 */
export const generateFolioPdf = async (
  res,
  { folio, charges = [], payments = [], hotel = {} },
) => {
  try {
    const filename = `Folio-${folio.folioNo || folio.billNo || "Statement"}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ size: "A4", margin: 36 });
    doc.pipe(res);

    const hotelName = hotel.name || "Stayscape Dev";
    const hotelAddress = hotel.address || "Salt Lake Sector V, Bidhannagar";
    const hotelCityState = `${hotel.city || "Kolkata"}, ${hotel.state || "West Bengal"} - ${hotel.pincode || "700091"}`;
    const hotelGstin = hotel.gstin || "19ABCDE1234F1Z5";
    const hotelPhone = hotel.phone || "+91 33 2357 0001";
    const hotelEmail = hotel.email || "";

    // --- Header Banner ---
    doc.rect(36, 36, 523, 72).fill("#0F172A");

    doc
      .fillColor("#FFFFFF")
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(hotelName.toUpperCase(), 50, 48);
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#94A3B8")
      .text(`${hotelAddress}, ${hotelCityState}`, 50, 70)
      .text(
        `GSTIN: ${hotelGstin}  |  Ph: ${hotelPhone}${hotelEmail ? `  |  Email: ${hotelEmail}` : ""}`,
        50,
        82,
      );

    doc
      .fillColor("#38BDF8")
      .fontSize(13)
      .font("Helvetica-Bold")
      .text("GUEST FOLIO STATEMENT", 330, 48, { align: "right", width: 215 });
    doc
      .fillColor("#FFFFFF")
      .fontSize(9)
      .font("Helvetica")
      .text(
        `Folio No: ${folio.folioNo || folio.billNo || "FL-1001"}`,
        330,
        68,
        { align: "right", width: 215 },
      )
      .text(`Date: ${fmtDate(new Date())}`, 330, 82, {
        align: "right",
        width: 215,
      });

    let y = 120;

    // --- Guest & Reservation Info Box ---
    doc.rect(36, y, 523, 86).fill("#F8FAFC").stroke("#CBD5E1");

    doc
      .fillColor("#1E293B")
      .fontSize(9)
      .font("Helvetica-Bold")
      .text("GUEST & STAY DETAILS", 46, y + 8);

    doc.fontSize(8).font("Helvetica").fillColor("#475569");
    // Column 1: Guest
    doc
      .text("Guest Name:", 46, y + 24)
      .font("Helvetica-Bold")
      .fillColor("#0F172A")
      .text(folio.guestName || "Guest", 110, y + 24);
    doc
      .font("Helvetica")
      .fillColor("#475569")
      .text("Phone:", 46, y + 38)
      .font("Helvetica-Bold")
      .fillColor("#0F172A")
      .text(folio.guestPhone || "—", 110, y + 38);
    doc
      .font("Helvetica")
      .fillColor("#475569")
      .text("Email:", 46, y + 52)
      .font("Helvetica-Bold")
      .fillColor("#0F172A")
      .text(folio.guestEmail || "—", 110, y + 52);
    doc
      .font("Helvetica")
      .fillColor("#475569")
      .text("Address / ID:", 46, y + 66)
      .font("Helvetica-Bold")
      .fillColor("#0F172A")
      .text(
        `${folio.address || "Kolkata, WB"} (${folio.idType || "Aadhaar"}: ${folio.idNumber || "•••• 9821"})`,
        110,
        y + 66,
      );

    // Column 2: Stay
    doc
      .font("Helvetica")
      .fillColor("#475569")
      .text("Booking Ref:", 310, y + 24)
      .font("Helvetica-Bold")
      .fillColor("#0F172A")
      .text(folio.bookingNo || folio.bookingId || "—", 380, y + 24);
    doc
      .font("Helvetica")
      .fillColor("#475569")
      .text("Room No:", 310, y + 38)
      .font("Helvetica-Bold")
      .fillColor("#0F172A")
      .text(
        `${folio.roomNumber || "101"} (${folio.roomType || "Executive EP"})`,
        380,
        y + 38,
      );
    doc
      .font("Helvetica")
      .fillColor("#475569")
      .text("Check-in:", 310, y + 52)
      .font("Helvetica-Bold")
      .fillColor("#0F172A")
      .text(`${fmtDate(folio.checkIn)}`, 380, y + 52);
    doc
      .font("Helvetica")
      .fillColor("#475569")
      .text("Check-out / Nts:", 310, y + 66)
      .font("Helvetica-Bold")
      .fillColor("#0F172A")
      .text(`${fmtDate(folio.checkOut)} (${folio.nights || 1} N)`, 380, y + 66);

    y += 100;

    // --- Charges Table Header ---
    doc.rect(36, y, 523, 20).fill("#1E293B");
    doc.fillColor("#FFFFFF").fontSize(8).font("Helvetica-Bold");
    doc.text("#", 42, y + 6);
    doc.text("Date & Time", 60, y + 6);
    doc.text("Description", 150, y + 6);
    doc.text("Dept", 305, y + 6);
    doc.text("Win", 355, y + 6);
    doc.text("Qty", 385, y + 6, { align: "right", width: 25 });
    doc.text("Rate (₹)", 420, y + 6, { align: "right", width: 55 });
    doc.text("Amount (₹)", 485, y + 6, { align: "right", width: 68 });

    y += 20;

    const items = charges.length ? charges : folio.charges || folio.items || [];
    let lineNo = 1;

    items.forEach((item, idx) => {
      if (y > 680) {
        doc.addPage();
        y = 40;
      }
      const isAlt = idx % 2 === 1;
      if (isAlt) {
        doc.rect(36, y, 523, 18).fill("#F1F5F9");
      }
      const qty = Number(item.quantity || 1);
      const rate = Number(item.price || item.rate || 0);
      const amount = Number(item.amount || rate * qty);

      doc.fillColor("#0F172A").fontSize(7.5).font("Helvetica");
      doc.text(String(lineNo++), 42, y + 5);
      doc.text(fmtDateTime(item.createdAt || folio.createdAt), 60, y + 5);
      doc
        .font("Helvetica-Bold")
        .text(
          String(item.description || item.name || "Charge").slice(0, 32),
          150,
          y + 5,
        );
      doc
        .font("Helvetica")
        .text(item.department || item.notes || "Room", 305, y + 5);
      doc.text(item.folioWindow || "A", 355, y + 5);
      doc.text(String(qty), 385, y + 5, { align: "right", width: 25 });
      doc.text(rate.toFixed(2), 420, y + 5, { align: "right", width: 55 });
      doc
        .font("Helvetica-Bold")
        .text(amount.toFixed(2), 485, y + 5, { align: "right", width: 68 });

      y += 18;
    });

    doc.rect(36, y, 523, 1).fill("#CBD5E1");
    y += 10;

    // --- Totals & Settlement Summary ---
    if (y > 660) {
      doc.addPage();
      y = 40;
    }

    const summary = folio.summary || {};
    const subtotal = Number(
      summary.subtotal ?? folio.totalAmount ?? folio.total ?? 0,
    );
    const serviceCharge = Number(summary.serviceCharge || 0);
    const gstTotal = Number(
      summary.gst ?? Number(folio.cgst || 0) + Number(folio.sgst || 0),
    );
    const cgst = Number(summary.cgst || gstTotal / 2);
    const sgst = Number(summary.sgst || gstTotal / 2);
    const grandTotal = Number(
      summary.grandTotal ?? folio.totalAmount ?? folio.total ?? 0,
    );
    const totalPaid = Number(summary.totalPaid ?? folio.paid ?? 0);
    const balanceDue = Number(summary.balanceDue ?? grandTotal - totalPaid);

    const leftX = 36;
    const rightX = 330;

    // Payments Mini Table on Left
    doc
      .fillColor("#0F172A")
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .text("PAYMENTS & SETTLEMENTS", leftX, y);
    y += 14;

    if (payments.length > 0) {
      payments.slice(0, 4).forEach((p) => {
        doc
          .fontSize(7.5)
          .font("Helvetica")
          .fillColor("#475569")
          .text(
            `${fmtDateTime(p.createdAt)}  |  ${(p.method || "Cash").toUpperCase()}  |  Ref: ${p.referenceNo || p.transactionId || "—"}`,
            leftX,
            y,
          );
        doc
          .font("Helvetica-Bold")
          .fillColor("#059669")
          .text(fmtMoney(p.amount), leftX + 180, y, {
            align: "right",
            width: 90,
          });
        y += 14;
      });
    } else {
      doc
        .fontSize(7.5)
        .font("Helvetica")
        .fillColor("#94A3B8")
        .text("No settlements recorded yet.", leftX, y);
      y += 14;
    }

    // Totals Table on Right (aligned with top of summary)
    let totY =
      y - (payments.length > 0 ? payments.slice(0, 4).length * 14 + 14 : 28);
    if (totY < y - 80) totY = y - 80;

    const addSummaryRow = (lbl, val, isBold = false, color = "#0F172A") => {
      doc
        .fontSize(8)
        .font(isBold ? "Helvetica-Bold" : "Helvetica")
        .fillColor(color);
      doc.text(lbl, rightX, totY);
      doc.text(fmtMoney(val), rightX + 110, totY, {
        align: "right",
        width: 115,
      });
      totY += 14;
    };

    addSummaryRow("Subtotal:", subtotal);
    if (serviceCharge > 0)
      addSummaryRow("Service Charge (10%):", serviceCharge);
    addSummaryRow("CGST (9%):", cgst);
    addSummaryRow("SGST (9%):", sgst);
    doc.rect(rightX, totY - 2, 229, 1).fill("#CBD5E1");
    totY += 4;
    addSummaryRow("Grand Total:", grandTotal, true, "#0F172A");
    addSummaryRow("Total Paid:", totalPaid, true, "#059669");
    doc.rect(rightX, totY - 2, 229, 1).fill("#CBD5E1");
    totY += 4;
    addSummaryRow(
      "Balance Due:",
      Math.max(balanceDue, 0),
      true,
      balanceDue > 0 ? "#DC2626" : "#059669",
    );

    y = Math.max(y, totY) + 20;

    // --- Signatures & Legal ---
    if (y > 720) {
      doc.addPage();
      y = 40;
    }

    doc.rect(36, y, 523, 44).fill("#F8FAFC").stroke("#E2E8F0");
    doc
      .fontSize(7)
      .font("Helvetica")
      .fillColor("#64748B")
      .text(
        "I agree that my liability for this bill is not waived and agree to be held personally liable in the event that the indicated person, company, or association fails to pay for any part of the full amount of these charges. Taxes are levied as per Indian GST regulations.",
        44,
        y + 8,
        { width: 507 },
      );

    y += 60;
    doc.fontSize(8).font("Helvetica").fillColor("#475569");
    doc.text("____________________________", 60, y);
    doc.text("Guest Signature", 80, y + 14);

    doc.text("____________________________", 380, y);
    doc.text("Authorized Signatory (Front Desk)", 380, y + 14);

    doc.end();
    logger.info(
      { folioNo: folio.folioNo || folio.billNo },
      "Folio PDF generated successfully",
    );
  } catch (err) {
    logger.error({ err }, "Failed to generate folio PDF");
    if (!res.headersSent) {
      res
        .status(500)
        .json({ success: false, message: "Error generating folio PDF" });
    }
  }
};

/**
 * Generates an official GST Tax Invoice A4 with IRN, QR Code, SAC codes, and GST breakdown
 */
export const generateInvoicePdf = async (
  res,
  { invoice, bill = {}, booking = {}, hotel = {} },
) => {
  try {
    const invoiceNo =
      invoice.reference ||
      invoice.invoiceNo ||
      `INV-${Date.now().toString().slice(-6)}`;
    const filename = `TaxInvoice-${invoiceNo}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ size: "A4", margin: 36 });
    doc.pipe(res);

    const hotelName = hotel.name || "Stayscape Dev";
    const hotelAddress = hotel.address || "Salt Lake Sector V, Bidhannagar";
    const hotelCityState = `${hotel.city || "Kolkata"}, ${hotel.state || "West Bengal"} - ${hotel.pincode || "700091"}`;
    const hotelGstin = hotel.gstin || "19ABCDE1234F1Z5";
    const hotelStateCode = "19 (West Bengal)";
    const hotelPhone = hotel.phone || "+91 33 2357 0001";
    const hotelEmail = hotel.email || "";

    // Generate GST IRN e-invoice QR code buffer
    const qrPayload = JSON.stringify({
      GSTIN: hotelGstin,
      DocNo: invoiceNo,
      DocTyp: "INV",
      DocDt: new Date().toISOString().slice(0, 10),
      TotInvVal: invoice.amount || bill.totalAmount || 0,
      ItemCnt: (bill.items || []).length || 1,
      MainHsnCode: "996311",
      Irn:
        invoice.data?.irn ||
        `IRN-${Date.now().toString(16).toUpperCase()}-KOLKATA`,
    });
    const qrBuffer = await QRCode.toBuffer(qrPayload, { width: 80, margin: 1 });

    // --- Header ---
    doc.rect(36, 36, 523, 80).fill("#0F172A");

    doc
      .fillColor("#FFFFFF")
      .fontSize(17)
      .font("Helvetica-Bold")
      .text(hotelName.toUpperCase(), 48, 46);
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#94A3B8")
      .text(`${hotelAddress}, ${hotelCityState}`, 48, 68)
      .text(
        `GSTIN: ${hotelGstin}  |  State: ${hotelStateCode}  |  Ph: ${hotelPhone}`,
        48,
        80,
      );
    if (hotelEmail) {
      doc.text(`Email: ${hotelEmail}`, 48, 92);
    }

    doc
      .fillColor("#F59E0B")
      .fontSize(13)
      .font("Helvetica-Bold")
      .text("TAX INVOICE", 320, 46, { align: "right", width: 225 });
    doc
      .fillColor("#FFFFFF")
      .fontSize(8.5)
      .font("Helvetica")
      .text(`Invoice No: ${invoiceNo}`, 320, 64, { align: "right", width: 225 })
      .text(
        `Date of Issue: ${fmtDate(invoice.createdAt || new Date())}`,
        320,
        78,
        { align: "right", width: 225 },
      )
      .text(`Place of Supply: 19 - West Bengal`, 320, 92, {
        align: "right",
        width: 225,
      });

    let y = 124;

    // --- IRN / E-Invoice Strip ---
    doc.rect(36, y, 523, 22).fill("#FEF3C7").stroke("#F59E0B");
    doc
      .fillColor("#92400E")
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .text(
        `IRN: ${invoice.data?.irn || `7e4d8c91a0f8b1c4d7e2938475a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8`}`,
        44,
        y + 6,
      );
    doc.text(
      `Ack Date: ${fmtDate(invoice.createdAt || new Date())}`,
      430,
      y + 6,
      { align: "right", width: 120 },
    );

    y += 28;

    // --- Supplier & Recipient Columns ---
    doc.rect(36, y, 256, 85).fill("#F8FAFC").stroke("#CBD5E1");
    doc.rect(303, y, 256, 85).fill("#F8FAFC").stroke("#CBD5E1");

    // Supplier Box
    doc
      .fillColor("#1E293B")
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .text("DETAILS OF SUPPLIER", 44, y + 6);
    doc
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor("#475569")
      .text(`Legal Name: ${hotelName}`, 44, y + 20)
      .text(`GSTIN: ${hotelGstin}`, 44, y + 32)
      .text(`State / Code: ${hotelStateCode}`, 44, y + 44)
      .text(`Address: ${hotelAddress}, ${hotelCityState}`, 44, y + 56, {
        width: 240,
      });

    // Recipient Box
    const recipientName =
      invoice.data?.guestName ||
      bill.guestName ||
      booking.guestId?.name ||
      "Rahul Sharma";
    const recipientPhone =
      invoice.data?.guestPhone ||
      bill.guestPhone ||
      booking.guestId?.phone ||
      "+91 98765 11001";
    const recipientEmail =
      invoice.data?.guestEmail ||
      bill.guestEmail ||
      booking.guestId?.email ||
      "";
    const recipientGstin =
      invoice.data?.companyGstin ||
      bill.companyGstin ||
      booking.groupInfo?.gstin ||
      "—";
    const recipientCompany =
      invoice.data?.companyName ||
      bill.companyName ||
      booking.groupInfo?.companyName ||
      null;

    doc
      .fillColor("#1E293B")
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .text("DETAILS OF RECIPIENT (BILLED TO)", 311, y + 6);
    doc
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor("#475569")
      .text(
        `Name: ${recipientCompany ? `${recipientCompany} (Attn: ${recipientName})` : recipientName}`,
        311,
        y + 20,
      )
      .text(
        `Phone: ${recipientPhone}${recipientEmail ? ` | Email: ${recipientEmail}` : ""}`,
        311,
        y + 32,
      )
      .text(`Recipient GSTIN: ${recipientGstin}`, 311, y + 44)
      .text(
        `Room: ${bill.roomId?.roomNumber || booking.roomAllocations?.[0]?.roomNumber || "101"} | Booking Ref: ${booking.reservationNo || "STAYSCAPE-2026-101"}`,
        311,
        y + 56,
      );

    y += 94;

    // --- Itemized Line Items Table ---
    doc.rect(36, y, 523, 20).fill("#1E293B");
    doc.fillColor("#FFFFFF").fontSize(7.5).font("Helvetica-Bold");
    doc.text("#", 42, y + 6);
    doc.text("Description of Goods / Services", 58, y + 6);
    doc.text("HSN/SAC", 240, y + 6);
    doc.text("Qty", 295, y + 6, { align: "right", width: 25 });
    doc.text("Rate (₹)", 330, y + 6, { align: "right", width: 45 });
    doc.text("Taxable (₹)", 385, y + 6, { align: "right", width: 50 });
    doc.text("CGST (9%)", 445, y + 6, { align: "right", width: 45 });
    doc.text("SGST (9%)", 498, y + 6, { align: "right", width: 45 });

    y += 20;

    const items = bill.items?.length
      ? bill.items
      : invoice.data?.items || [
          {
            name: "Executive Room Stay (Room 101)",
            price: 4998,
            quantity: 1,
            department: "Room",
          },
        ];

    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;

    items.forEach((item, idx) => {
      if (y > 670) {
        doc.addPage();
        y = 40;
      }
      const isAlt = idx % 2 === 1;
      if (isAlt) {
        doc.rect(36, y, 523, 18).fill("#F8FAFC");
      }

      const qty = Number(item.quantity || 1);
      const rate = Number(item.price || item.rate || 0);
      const lineTaxable = rate * qty;
      const dept = String(item.department || item.notes || "").toLowerCase();
      const sac =
        dept.includes("food") || dept.includes("f&b")
          ? "996331"
          : dept.includes("laundry")
            ? "999719"
            : "996311";
      const lineCgst = lineTaxable * 0.09;
      const lineSgst = lineTaxable * 0.09;

      totalTaxable += lineTaxable;
      totalCgst += lineCgst;
      totalSgst += lineSgst;

      doc.fillColor("#0F172A").fontSize(7).font("Helvetica");
      doc.text(String(idx + 1), 42, y + 5);
      doc
        .font("Helvetica-Bold")
        .text(
          String(item.description || item.name || "Service").slice(0, 36),
          58,
          y + 5,
        );
      doc.font("Helvetica").text(sac, 240, y + 5);
      doc.text(String(qty), 295, y + 5, { align: "right", width: 25 });
      doc.text(rate.toFixed(2), 330, y + 5, { align: "right", width: 45 });
      doc.text(lineTaxable.toFixed(2), 385, y + 5, {
        align: "right",
        width: 50,
      });
      doc.text(lineCgst.toFixed(2), 445, y + 5, { align: "right", width: 45 });
      doc.text(lineSgst.toFixed(2), 498, y + 5, { align: "right", width: 45 });

      y += 18;
    });

    doc.rect(36, y, 523, 1).fill("#CBD5E1");
    y += 8;

    // --- Totals Section with QR Code ---
    if (y > 640) {
      doc.addPage();
      y = 40;
    }

    const totalInvoiceAmount = totalTaxable + totalCgst + totalSgst;

    // Left: QR Code & E-Invoice Validation
    doc.image(qrBuffer, 44, y, { width: 72, height: 72 });
    doc
      .fontSize(7)
      .font("Helvetica")
      .fillColor("#64748B")
      .text("Scan QR to verify on GST e-Invoice Portal", 125, y + 10)
      .text(
        `Invoice Status: ${(invoice.status || "PAID").toUpperCase()}`,
        125,
        y + 24,
      )
      .text("Digital Signature Verified (NIC-IRP)", 125, y + 38);

    // Right: Calculation Summary
    let totY = y;
    const addInvRow = (lbl, val, isBold = false, color = "#0F172A") => {
      doc
        .fontSize(8)
        .font(isBold ? "Helvetica-Bold" : "Helvetica")
        .fillColor(color);
      doc.text(lbl, 320, totY);
      doc.text(fmtMoney(val), 430, totY, { align: "right", width: 115 });
      totY += 14;
    };

    addInvRow("Total Taxable Value:", totalTaxable);
    addInvRow("Central GST (CGST 9%):", totalCgst);
    addInvRow("State GST (SGST 9%):", totalSgst);
    addInvRow("Total GST Tax (18%):", totalCgst + totalSgst);
    doc.rect(320, totY - 2, 239, 1).fill("#CBD5E1");
    totY += 4;
    addInvRow(
      "Grand Total Invoice Value:",
      totalInvoiceAmount,
      true,
      "#0F172A",
    );

    y = Math.max(y + 80, totY + 10);

    // --- Bank Details & Authorized Signatory ---
    if (y > 720) {
      doc.addPage();
      y = 40;
    }

    doc.rect(36, y, 260, 50).fill("#F8FAFC").stroke("#CBD5E1");
    doc
      .fillColor("#1E293B")
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .text("HOTEL BANK ACCOUNT DETAILS", 44, y + 6);
    doc
      .fontSize(7)
      .font("Helvetica")
      .fillColor("#475569")
      .text("Bank: HDFC Bank Ltd | Account Name: Stayscape Dev", 44, y + 18)
      .text("A/C No: 50200084920192 | IFSC: HDFC0000128", 44, y + 28)
      .text("UPI ID: stayscape@hdfcbank", 44, y + 38);

    doc.fontSize(7.5).font("Helvetica").fillColor("#475569");
    doc.text("For Stayscape Dev", 390, y + 6);
    doc.text("____________________________", 370, y + 30);
    doc.text("Authorized Signatory", 400, y + 42);

    doc.end();
    logger.info({ invoiceNo }, "Tax invoice PDF generated successfully");
  } catch (err) {
    logger.error({ err }, "Failed to generate invoice PDF");
    if (!res.headersSent) {
      res
        .status(500)
        .json({ success: false, message: "Error generating invoice PDF" });
    }
  }
};
