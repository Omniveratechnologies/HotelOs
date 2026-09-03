import crypto from "crypto";

export const generateUsername = (hotelCode, role, number) => {
  return `${hotelCode}-${role}-${number}`.toLowerCase();
};

export const generateTemporaryPassword = () => {
  const randomPart = crypto.randomBytes(6).toString("base64url");

  return `${randomPart}A1!`;
};
