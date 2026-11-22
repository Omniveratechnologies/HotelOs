import "dotenv/config";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { processQueue } from "../modules/leave/services/leaveNotification.service.js";

export const send = async ({ channel, to, subject, body }) => {
  // if (channel === "EMAIL") await mailer.sendMail({ to, subject, text: body });
  // if (channel === "SMS") await sms.send(to, body);
  // if (channel === "WHATSAPP") await whatsapp.send(to, body);
  console.log(
    `[${channel}] to ${to}${subject ? ` | ${subject}` : ""} | ${body}`,
  );
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL;
  if (!uri) {
    console.error("Set MONGO_URI in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);

  const once = async () =>
    console.log(new Date().toISOString(), await processQueue(send));
  await once();

  if (process.argv.includes("--watch")) {
    setInterval(() => once().catch((error) => console.error(error)), 30000);
  } else {
    await mongoose.disconnect();
  }
}
