import app from "./app";
import { logger } from "./lib/logger";
import { initPush } from "./lib/push";
import { fileURLToPath } from "url";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Only bind the port when this file is the actual entry point.
// If something dynamically imports this module (e.g. a health-check wrapper),
// we skip listen() to avoid EADDRINUSE on the already-bound port.
const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  initPush().catch((err) => logger.warn({ err }, "Push init failed — continuing without push"));

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}
