require("dotenv").config();

const { connectDB, disconnectDB } = require("./config/db");
const app = require("./app");

const PORT = process.env.PORT || 3000;

// ============================================================
// BOOT SEQUENCE
// ============================================================
// The HTTP server is started ONLY after MongoDB successfully
// connects. This prevents the server from accepting requests
// before the database is ready.

const start = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`[Server] Listening on http://localhost:${PORT}`);
  });

  // ============================================================
  // GRACEFUL SHUTDOWN
  // ============================================================

  const shutdown = async (signal) => {
    console.log(`\n[Server] ${signal} received. Shutting down gracefully…`);

    server.close(async () => {
      console.log("[Server] HTTP server closed.");
      await disconnectDB();
      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long.
    setTimeout(() => {
      console.error("[Server] Forced shutdown after timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));
};

start().catch((error) => {
  console.error("[Server] Startup failed:", error.message);
  process.exit(1);
});
