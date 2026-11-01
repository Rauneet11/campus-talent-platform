const mongoose = require("mongoose");
const Student = require("../models/Student");

// ============================================================
// REMOVE LEGACY INDEX (migration helper — runs once on startup)
// ============================================================

const removeLegacyStudentEmailIndex = async () => {
  const collections = await mongoose.connection.db
    .listCollections({ name: Student.collection.name }, { nameOnly: true })
    .toArray();

  if (collections.length === 0) return;

  const indexes = await Student.collection.indexes();
  const legacyEmailIndex = indexes.find(
    (index) =>
      index.unique === true &&
      Object.keys(index.key).length === 1 &&
      index.key.email === 1
  );

  if (legacyEmailIndex) {
    await Student.collection.dropIndex(legacyEmailIndex.name);
    console.log(
      `[DB] Removed obsolete unique student email index: ${legacyEmailIndex.name}`
    );
  }
};

// ============================================================
// CONNECT TO MONGODB ATLAS
// ============================================================

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("[DB] MONGO_URI environment variable is not set.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // Atlas-safe defaults
      serverSelectionTimeoutMS: 10000,  // 10 s — fail fast on bad URI
      socketTimeoutMS: 45000,           // keep connection alive
      maxPoolSize: 10,
    });

    console.log("[DB] MongoDB connected successfully.");

    // Run one-time migration helpers after connection is established.
    await removeLegacyStudentEmailIndex();
  } catch (error) {
    // Log a safe message — no URI or credentials in the output.
    console.error("[DB] Database connection failed:", error.message);
    process.exit(1);
  }
};

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log("[DB] MongoDB connection closed.");
  } catch (error) {
    console.error("[DB] Error closing MongoDB connection:", error.message);
  }
};

module.exports = { connectDB, disconnectDB };
