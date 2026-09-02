import dotenv from "dotenv";

dotenv.config();

const requiredEnvVariables = ["MONGODB_URI", "JWT_SECRET"];

for (const variable of requiredEnvVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing environment variable: ${variable}`);
  }
}

// Optional integrations. R2 (document uploads) and Razorpay (online food order
// payments) only take effect when their credentials are provided; the rest of
// the backend keeps working without them.
export default {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    urlTtlSeconds: Number(process.env.R2_URL_TTL_SECONDS || 900),
  },
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
};
