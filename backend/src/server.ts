import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { closeDatabase } from "./db/client.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`Solo Leveling API listening on http://localhost:${env.PORT}`);
  console.log(`Health: http://localhost:${env.PORT}/api/v1/health`);
});

async function shutdown() {
  server.close();
  await closeDatabase();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown();
});
process.on("SIGTERM", () => {
  void shutdown();
});
