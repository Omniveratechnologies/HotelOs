import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,

  port: Number(process.env.EMAIL_PORT),

  secure: process.env.EMAIL_SECURE === "true",

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

export const sendUsernameReminderEmail = async ({ email, name, username }) => {
  const subject = "HotelOS - Your Username";

  const html = `
    <div
      style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
      "
    >
      <h2>Your HotelOS Username</h2>

      <p>Hello ${name},</p>

      <p>
        You recently requested your username for
        your HotelOS account.
      </p>

      <p>
        Your username is:
        <strong>${username}</strong>
      </p>

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
// PASSWORD RESET EMAIL
// =====================================================

export const sendPasswordResetEmail = async ({ email, name, resetUrl }) => {
  const subject = "HotelOS - Reset Your Password";

  const html = `
    <div
      style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
      "
    >
      <h2>Reset Your Password</h2>

      <p>Hello ${name},</p>

      <p>
        We received a request to reset the password
        for your HotelOS account.
      </p>

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
