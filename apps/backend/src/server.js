import "dotenv/config";

console.log("SERVER: starting");

const appModule = await import("#/app.js");
console.log("SERVER: app.js loaded");

const dbModule = await import("#/config/db.js");
console.log("SERVER: db.js loaded");

const app = appModule.default;
const connectDB = dbModule.default;

const PORT = process.env.PORT || 5001;

console.log("SERVER: connecting to MongoDB...");

try {
  await connectDB();

  console.log("SERVER: MongoDB connected");

  app.listen(PORT, () => {
    console.log(`SERVER: running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
  });
} catch (error) {
  console.error("SERVER ERROR:", error);
  process.exit(1);
}
