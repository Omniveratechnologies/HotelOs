import { createTransport } from "nodemailer";
import logger from "#/utils/logger.js";
import { env } from "#/config/env.js";

const transporter = createTransport({
  host: env.email.host,

  port: env.email.port,

  secure: env.email.secure,

  auth: {
    user: env.email.user,
    pass: env.email.password,
  },
});

export const sendInvitationEmail = async ({
  email,
  name,
  inviteUrl,
  role,
  hotelName,
}) => {
  const subject = `HotelOS Invitation - ${hotelName}`;

  const html = `
    <div
      style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
      "
    >
      <h2>Welcome to HotelOS</h2>

      <p>Hello ${name},</p>

      <p>
        You have been invited to join
        <strong>${hotelName}</strong>
        as a
        <strong>${role}</strong>.
      </p>

      <p>
        Click the button below to set your password
        and activate your account.
      </p>

      <p>
        <a
          href="${inviteUrl}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background: #111827;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
          "
        >
          Set Your Password
        </a>
      </p>

      <p>
        This invitation link will expire in 24 hours.
      </p>

      <p>
        If you did not expect this invitation,
        please ignore this email.
      </p>

      <br />

      <p>HotelOS Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html,
  });
};

// =====================================================
// FORGOT USERNAME EMAIL
// =====================================================

export const sendUsernameReminderEmail = async ({
  email,
  name,
  username,
  usernames,
  portalName,
}) => {
  const portalText = portalName || "HotelOS";
  const subject = `HotelOS - Your ${portalText} Username(s)`;

  const usernameList =
    Array.isArray(usernames) && usernames.length > 0
      ? usernames
      : [username || "your account"];

  const usernameContent =
    usernameList.length === 1
      ? `<p>Your username is: <strong>${usernameList[0]}</strong></p>`
      : `
        <p>The username(s) associated with this email for this portal are:</p>
        <ul style="padding-left: 20px; line-height: 1.8;">
          ${usernameList.map((u) => `<li><strong>${u}</strong></li>`).join("")}
        </ul>
      `;

  const html = `
    <div
      style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
      "
    >
      <h2>Your ${portalText} Username</h2>

      <p>Hello ${name || "there"},</p>

      <p>
        You recently requested your username for
        your <strong>${portalText}</strong> account.
      </p>

      ${usernameContent}

      <p>
        If you did not request this,
        please ignore this email.
      </p>

      <br />

      <p>HotelOS Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html,
  });
};

// =====================================================
// GUEST CREDENTIALS EMAIL
// =====================================================

export const sendGuestCredentialsEmail = async ({
  email,
  name,
  username,
  password,
  hotelName,
}) => {
  const subject = `Your HotelOS Guest Account - ${hotelName}`;

  const html = `
    <div
      style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
      "
    >
      <h2>Welcome to ${hotelName}</h2>

      <p>Hello ${name},</p>

      <p>
        Your guest account has been created.
        Use the credentials below to log in to your
        HotelOS guest dashboard.
      </p>

      <p>
        Username:
        <strong>${username}</strong>
      </p>

      <p>
        Password:
        <strong>${password}</strong>
      </p>

      <p>
        Please keep these credentials safe. You can
        ask the reception desk to reset them if needed.
      </p>

      <br />

      <p>HotelOS Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html,
  });
};

// =====================================================
// GENERIC CHECK-IN EMAIL (link / correction / reject / approve)
// =====================================================

/**
 * Sends a check-in notification email (link, correction, approval, rejection).
 *
 * @param {Object} input
 * @param {string} input.email
 * @param {string} input.name - Guest name.
 * @param {string} input.hotelName
 * @param {string} input.subject
 * @param {string} input.heading
 * @param {string} input.body - Plain-text-ish body (rendered as a paragraph).
 * @param {string|null} [input.actionUrl] - CTA link.
 * @param {string} [input.actionLabel] - CTA button label.
 */
export const sendCheckInEmail = async ({
  email,
  name,
  hotelName,
  subject,
  heading,
  body,
  actionUrl,
  actionLabel,
}) => {
  const html = `
    <div
      style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
      "
    >
      <h2>${heading}</h2>

      <p>Hello ${name},</p>

      <p>${body}</p>

      ${
        actionUrl
          ? `<p>
        <a
          href="${actionUrl}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background: #0f1f3d;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
          "
        >
          ${actionLabel || "Open"}
        </a>
      </p>

      <p style="color: #6b7280; font-size: 12px;">
        If the button does not work, copy this link into your browser:<br />
        ${actionUrl}
      </p>`
          : ""
      }

      <p>If you need help, please contact the reception desk.</p>

      <br />

      <p>${hotelName} Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `${subject} - ${hotelName}`,
    html,
  });
};

// =====================================================
// PASSWORD RESET EMAIL
// =====================================================

export const sendPasswordResetEmail = async ({
  email,
  name,
  username,
  resetUrl,
  portalName,
}) => {
  const portalText = portalName || "HotelOS";
  const subject = `HotelOS - Reset Your Password (${portalText})`;

  const accountInfo = username
    ? `<p>We received a request to reset the password for account: <strong>${username}</strong> on <strong>${portalText}</strong>.</p>`
    : `<p>We received a request to reset the password for your <strong>${portalText}</strong> account.</p>`;

  const html = `
    <div
      style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
      "
    >
      <h2>Reset Your Password</h2>

      <p>Hello ${name || "there"},</p>

      ${accountInfo}

      <p>
        Click the button below to choose a new password.
      </p>

      <p>
        <a
          href="${resetUrl}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background: #111827;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
          "
        >
          Reset Password
        </a>
      </p>

      <p>
        This password reset link will expire in 1 hour.
      </p>

      <p>
        If you did not request a password reset,
        please ignore this email and your password
        will remain unchanged.
      </p>

      <br />

      <p>HotelOS Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html,
  });
};

// =====================================================
// ACCOUNT SELECTION EMAIL (MULTI-ACCOUNT RECOVERY)
// =====================================================

export const sendAccountSelectionEmail = async ({
  email,
  name,
  selectUrl,
  portalName,
}) => {
  const portalText = portalName || "HotelOS";
  const subject = `HotelOS - Select Account to Reset Password (${portalText})`;

  const html = `
    <div
      style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
      "
    >
      <h2>Select Your Account</h2>

      <p>Hello ${name || "there"},</p>

      <p>
        We received a request to reset your password on <strong>${portalText}</strong>.
      </p>

      <p>
        Your email address is associated with multiple accounts on this portal.
        Please click the button below to choose which account you would like to reset:
      </p>

      <p>
        <a
          href="${selectUrl}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background: #111827;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
          "
        >
          Select Account to Reset
        </a>
      </p>

      <p>
        This account selection link will expire in 15 minutes.
      </p>

      <p>
        No active password reset links have been generated yet. If you did not request this,
        you can safely ignore this email.
      </p>

      <br />

      <p>HotelOS Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html,
  });
};

// =====================================================
// KIOSK / SELF-CHECKIN OTP VERIFICATION EMAIL
// =====================================================

export const sendCheckInOtpEmail = async ({
  email,
  name,
  otp,
  hotelName = "HotelOS",
}) => {
  const subject = `${otp} is your Self Check-In Verification Code - ${hotelName}`;

  const html = `
    <div
      style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 24px;
        background-color: #f9fafb;
        border-radius: 8px;
      "
    >
      <h2 style="color: #0f1f3d; margin-top: 0;">Self Check-In Verification</h2>

      <p>Hello ${name || "Guest"},</p>

      <p>
        Use the verification code below on the kiosk terminal to access your check-in:
      </p>

      <div
        style="
          margin: 24px 0;
          padding: 16px;
          background-color: #ffffff;
          border: 2px dashed #0284c7;
          border-radius: 8px;
          text-align: center;
        "
      >
        <span
          style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 6px;
            color: #0f1f3d;
            font-family: monospace;
          "
        >
          ${otp}
        </span>
      </div>

      <p style="color: #64748b; font-size: 14px;">
        This code is valid for <strong>10 minutes</strong>. If you did not initiate this check-in request, please contact the front desk.
      </p>

      <br />
      <p style="color: #334155; font-weight: 500;">${hotelName} Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html,
  });
};

// =====================================================
// GUEST FOLIO STATEMENT EMAIL
// =====================================================

export const sendFolioStatementEmail = async ({
  email,
  guestName = "Guest",
  folioNo = "FL-1001",
  roomNumber = "101",
  totalAmount = 0,
  balanceDue = 0,
  hotelName = "Stayscape Dev",
}) => {
  const subject = `Your Folio Statement [${folioNo}] - ${hotelName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #0f172a; padding: 24px; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">${hotelName}</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Guest Billing & Folio Statement</p>
      </div>

      <div style="padding: 24px; background-color: #ffffff;">
        <p style="font-size: 15px; margin-top: 0;">Dear <strong>${guestName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.5; color: #475569;">
          Thank you for choosing ${hotelName}. Please find below the summary of your folio charges and settlement status:
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Folio Number:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #0f172a;">${folioNo}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Room Number:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #0f172a;">Room ${roomNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Total Charges:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #0f172a;">₹${Number(totalAmount).toFixed(2)}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 8px 0 2px 0; font-size: 14px; font-weight: bold; color: #0f172a;">Balance Due:</td>
              <td style="padding: 8px 0 2px 0; text-align: right; font-size: 14px; font-weight: bold; color: ${Number(balanceDue) > 0 ? "#dc2626" : "#059669"};">
                ₹${Number(balanceDue).toFixed(2)}
              </td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          If you have any questions or require an updated copy of your itemized tax invoice, please visit our front desk or reply directly to this email.
        </p>

        <p style="margin-top: 24px; font-size: 14px; color: #334155;">
          Warm regards,<br />
          <strong>${hotelName} Front Desk & Accounts</strong>
        </p>
      </div>
    </div>
  `;

  if (!email) {
    logger.warn({ folioNo }, "No recipient email provided for folio statement");
    return { success: false, error: "Recipient email is required" };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html,
    });
    logger.info(
      { email, folioNo, messageId: info?.messageId },
      "Folio statement email sent successfully",
    );
    return { success: true, messageId: info?.messageId };
  } catch (err) {
    logger.warn(
      { err: err.message, email, folioNo },
      "Failed to deliver folio email via SMTP (logged for fallback)",
    );
    return { success: false, error: err.message };
  }
};

// =====================================================
// GST TAX INVOICE EMAIL
// =====================================================

export const sendTaxInvoiceEmail = async ({
  email,
  guestName = "Guest",
  invoiceNo = "INV-2026-1001",
  totalAmount = 0,
  hotelName = "Stayscape Dev",
}) => {
  const subject = `Tax Invoice [${invoiceNo}] - ${hotelName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #0f172a; padding: 24px; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px; font-weight: bold;">${hotelName}</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #f59e0b; font-weight: 600;">Official GST Tax Invoice</p>
      </div>

      <div style="padding: 24px; background-color: #ffffff;">
        <p style="font-size: 15px; margin-top: 0;">Dear <strong>${guestName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.5; color: #475569;">
          Please find details of your official GST Tax Invoice from ${hotelName}:
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Invoice Number:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #0f172a;">${invoiceNo}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Invoice Date:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #0f172a;">${new Date().toLocaleDateString("en-IN")}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 8px 0 2px 0; font-size: 14px; font-weight: bold; color: #0f172a;">Total Invoice Value:</td>
              <td style="padding: 8px 0 2px 0; text-align: right; font-size: 14px; font-weight: bold; color: #059669;">
                ₹${Number(totalAmount).toFixed(2)}
              </td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          This is an authorized GST computer-generated tax invoice. You can download or print your PDF statement anytime from your guest portal.
        </p>

        <p style="margin-top: 24px; font-size: 14px; color: #334155;">
          Warm regards,<br />
          <strong>${hotelName} Accounts Team</strong>
        </p>
      </div>
    </div>
  `;

  if (!email) {
    logger.warn({ invoiceNo }, "No recipient email provided for tax invoice");
    return { success: false, error: "Recipient email is required" };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html,
    });
    logger.info(
      { email, invoiceNo, messageId: info?.messageId },
      "Tax invoice email sent successfully",
    );
    return { success: true, messageId: info?.messageId };
  } catch (err) {
    logger.warn(
      { err: err.message, email, invoiceNo },
      "Failed to deliver tax invoice email via SMTP (logged for fallback)",
    );
    return { success: false, error: err.message };
  }
};
