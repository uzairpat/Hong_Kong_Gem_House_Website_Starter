import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { csrfSync } from "csrf-sync";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";
import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";
import enquiriesRouter from "./routes/enquiries.js";

export const app = express();

const allowedOrigins = env.CORS_ORIGIN
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("This origin is not allowed by the API CORS policy."));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));

const PgSessionStore = connectPgSimple(session);
const isProduction = env.NODE_ENV === "production";

if (isProduction) app.set("trust proxy", 1);

app.use(session({
  name: "hkg.sid",
  store: new PgSessionStore({
    pool,
    tableName: "user_sessions",
    schemaName: "public",
    createTableIfMissing: false,
    pruneSessionInterval: 900,
  }),
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  },
}));

const {
  csrfSynchronisedProtection,
  generateToken,
  invalidCsrfTokenError,
} = csrfSync();

app.get("/api/auth/csrf", (request, response) => {
  response.json({ csrfToken: generateToken(request) });
});
app.use(csrfSynchronisedProtection);

app.get("/api/health", async (_request, response) => {
  try {
    await pool.query("SELECT 1");
    response.json({
      status: "ok",
      service: "hong-kong-gem-house-api",
      database: "connected",
    });
  } catch (error) {
    console.error("Health check could not reach PostgreSQL:", error);
    response.status(503).json({
      status: "degraded",
      service: "hong-kong-gem-house-api",
      database: "unavailable",
    });
  }
});

const catalogueSelect = [
  "SELECT",
  "  g.id,",
  "  g.reference_code,",
  "  g.name,",
  "  g.category,",
  "  g.weight_carat,",
  "  g.shape,",
  "  g.origin,",
  "  g.colour,",
  "  g.clarity,",
  "  g.treatment,",
  "  g.certification_lab,",
  "  g.certification_number,",
  "  g.description,",
  "  g.public_title,",
  "  g.public_description,",
  "  g.cut,",
  "  g.dimensions_mm,",
  "  g.origin_region,",
  "  g.availability_status,",
  "  g.public_price_mode,",
  "  CASE WHEN g.public_price_mode = 'fixed' THEN g.selling_price::text ELSE NULL END AS public_price,",
  "  g.is_sample,",
  "  g.created_at,",
  "  (SELECT gi.image_path FROM gemstone_images gi WHERE gi.gemstone_id = g.id ORDER BY gi.is_primary DESC, gi.sort_order ASC, gi.created_at ASC LIMIT 1) AS image_path",
  "FROM gemstones g",
].join("\n");

app.get("/api/gemstones", async (request, response, next) => {
  try {
    const conditions = ["g.status = 'published'", "g.public_visibility = TRUE"];
    const values: string[] = [];

    if (env.NODE_ENV === "production") conditions.push("g.is_sample = FALSE");

    const category = typeof request.query.category === "string"
      ? request.query.category.trim().toLowerCase()
      : "";
    if (category) {
      const validCategories = ["ruby", "sapphire", "emerald", "rare"];
      if (!validCategories.includes(category)) {
        response.status(400).json({ error: "Unsupported gemstone category." });
        return;
      }
      values.push(category);
      conditions.push("g.category = $" + values.length);
    }

    const search = typeof request.query.search === "string" ? request.query.search.trim() : "";
    if (search) {
      values.push("%" + search + "%");
      conditions.push("(g.reference_code ILIKE $" + values.length + " OR g.name ILIKE $" + values.length + ")");
    }

    const result = await pool.query(
      catalogueSelect + "\nWHERE " + conditions.join(" AND ") +
      "\nORDER BY g.created_at DESC, g.reference_code ASC",
      values,
    );
    response.json({ data: result.rows, count: result.rowCount ?? 0 });
  } catch (error) {
    next(error);
  }
});

app.get("/api/gemstones/:referenceCode", async (request, response, next) => {
  try {
    const conditions = [
      "g.reference_code = $1",
      "g.status = 'published'",
      "g.public_visibility = TRUE",
    ];
    if (env.NODE_ENV === "production") conditions.push("g.is_sample = FALSE");

    const result = await pool.query(
      catalogueSelect + "\nWHERE " + conditions.join(" AND ") + "\nLIMIT 1",
      [request.params.referenceCode.toUpperCase()],
    );
    if (!result.rowCount) {
      response.status(404).json({ error: "Gemstone not found." });
      return;
    }
    response.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api", enquiriesRouter);

app.use((_request, response) => {
  response.status(404).json({ error: "API endpoint not found." });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (
    error === invalidCsrfTokenError ||
    (error instanceof Error && error.message.toLowerCase().includes("csrf"))
  ) {
    response.status(403).json({
      error: "Invalid or missing security token. Please refresh and try again.",
    });
    return;
  }
  console.error("Unhandled API error:", error);
  response.status(500).json({ error: "Internal server error." });
};

app.use(errorHandler);
