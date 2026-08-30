import crypto from "crypto";

export const generateInviteToken = () => {
  return crypto
    .randomBytes(32)
    .toString("hex");
};

export const getInviteExpiry = () => {
  const expiry = new Date();

  // Invitation valid for 24 hours
  expiry.setHours(
    expiry.getHours() + 24
  );

  return expiry;
};