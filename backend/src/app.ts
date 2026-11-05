import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";

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

const catalogueSelect = `
  SELECT
    g.id,
    g.reference_code,
    g.name,
    g.category,
    g.weight_carat,
    g.shape,
    g.origin,
    g.colour,
    g.clarity,
    g.treatment,
    g.certification_lab,
    g.certification_number,
    g.description,
    g.is_sample,
    g.created_at,
    (
      SELECT gi.image_path
      FROM gemstone_images gi
      WHERE gi.gemstone_id = g.id
      ORDER BY gi.is_primary DESC, gi.sort_order ASC, gi.created_at ASC
      LIMIT 1
    ) AS image_path
  FROM gemstones g
`;

app.get("/api/gemstones", async (request, response, next) => {
  try {
    const conditions = ["g.status = 'published'"];
    const values: string[] = [];

    if (env.NODE_ENV === "production") {
      conditions.push("g.is_sample = FALSE");
    }

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
      conditions.push(`g.category = $${values.length}`);
    }

    const search = typeof request.query.search === "string"
      ? request.query.search.trim()
      : "";

    if (search) {
      values.push(`%${search}%`);
      const parameter = values.length;
      conditions.push(`(g.reference_code ILIKE $${parameter} OR g.name ILIKE $${parameter})`);
    }

    const result = await pool.query(
      `${catalogueSelect}
       WHERE ${conditions.join(" AND ")}
       ORDER BY g.created_at DESC, g.reference_code ASC`,
      values,
    );

    response.json({ data: result.rows, count: result.rowCount ?? 0 });
  } catch (error) {
    next(error);
  }
});

app.get("/api/gemstones/:referenceCode", async (request, response, next) => {
  try {
    const conditions = ["g.reference_code = $1", "g.status = 'published'"];
    if (env.NODE_ENV === "production") {
      conditions.push("g.is_sample = FALSE");
    }

    const result = await pool.query(
      `${catalogueSelect}
       WHERE ${conditions.join(" AND ")}
       LIMIT 1`,
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

app.use((_request, response) => {
  response.status(404).json({ error: "API endpoint not found." });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error("Unhandled API error:", error);
  response.status(500).json({ error: "Internal server error." });
};

app.use(errorHandler);
