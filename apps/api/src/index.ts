import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { checkDb, closePool } from "./db.js";
import { dbRoutes } from "./routes/db.js";

type AppEnv = {
  Variables: {
    requestId: string;
  };
};

const app = new Hono<AppEnv>();

app.use("*", secureHeaders());

const origins = (process.env.CORS_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return origins[0] ?? "";
      return origins.includes(origin) ? origin : "";
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    maxAge: 600,
  }),
);

app.use("*", async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set("requestId", requestId);
  c.header("X-Request-Id", requestId);
  await next();
});

app.get("/health", async (c) => {
  const db = await checkDb();
  return c.json(
    { ok: db, service: "hiperxp-api", db: db ? "up" : "down" },
    db ? 200 : 503,
  );
});

app.get("/", (c) =>
  c.json({
    service: "hiperxp-api",
    routes: ["/health", "/api/v1/db/*"],
  }),
);

app.route("/api/v1/db", dbRoutes);

app.notFound((c) =>
  c.json(
    {
      code: "not_found",
      message: "Not found",
      request_id: c.get("requestId") ?? null,
    },
    404,
  ),
);

app.onError((err, c) => {
  console.error("[api]", err);
  return c.json(
    {
      code: "internal_error",
      message: "Unexpected error",
      request_id: c.get("requestId") ?? null,
    },
    500,
  );
});

const port = Number(process.env.PORT ?? 4000);

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, (info) => {
  console.log(`hiperxp-api listening on :${info.port}`);
});

async function shutdown() {
  await closePool();
  process.exit(0);
}
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
