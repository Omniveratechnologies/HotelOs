import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,

  port: Number(process.env.EMAIL_PORT),

  secure:
    process.env.EMAIL_SECURE === "true",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendInvitationEmail = async ({
  email,
  name,
  inviteUrl,
  role,
  hotelName,
}) => {
  const subject =
    `HotelOS Invitation - ${hotelName}`;

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