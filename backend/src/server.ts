import { app } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";

const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Hong Kong Gem House API listening on http://localhost:${env.PORT}`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`${signal} received. Shutting down API...`);

  server.close(async (error) => {
    if (error) {
      console.error("Error while closing the HTTP server:", error);
      process.exitCode = 1;
    }

    await pool.end();
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
