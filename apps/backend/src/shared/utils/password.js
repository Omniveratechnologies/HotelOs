import { compare, hash } from "bcryptjs";

export const hashPassword = async (password) => {
  return hash(password, 12);
};

export const comparePassword = async (password, hashedPassword) => {
  return compare(password, hashedPassword);
};
