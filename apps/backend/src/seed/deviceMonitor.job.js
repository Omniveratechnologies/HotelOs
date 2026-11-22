import "dotenv/config";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { checkDevices } from "../modules/attendance/services/attendanceDevice.service.js";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL;
  if (!uri) {
    console.error("Set MONGO_URI (or MONGODB_URI) in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(await checkDevices());

  if (process.argv.includes("--watch")) {
    console.log("Watching. Press Ctrl+C to stop.");
    setInterval(
      async () => console.log(new Date().toISOString(), await checkDevices()),
      60 * 1000,
    );
  } else {
    await mongoose.disconnect();
  }
}
