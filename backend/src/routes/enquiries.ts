import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { pool } from "../db/pool.js";

const router = Router();
const enquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many enquiries were sent from this connection. Please try again later." },
});
const eventLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 90,
  standardHeaders: true,
  legacyHeaders: false,
});

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(180),
  company: z.string().trim().max(180).optional().default(""),
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(40).optional().default(""),
  type: z.string().trim().min(2).max(80),
  message: z.string().trim().min(5).max(8000),
  gemstoneReference: z.string().trim().max(32).optional().default(""),
  sourcePath: z.string().trim().max(500).optional().default(""),
});
const eventSchema = z.object({
  eventName: z.enum(["page_view", "section_view", "category_view", "gemstone_view", "image_interaction", "whatsapp_clicked"]),
  anonymousId: z.string().trim().max(100).optional(),
  pagePath: z.string().trim().max(500).optional(),
  sectionKey: z.string().trim().max(80).optional(),
  gemstoneReference: z.string().trim().max(32).optional(),
  category: z.enum(["ruby", "sapphire", "emerald", "rare"]).optional(),
  source: z.string().trim().max(80).optional(),
  consentState: z.enum(["granted", "denied", "unknown"]).default("unknown"),
  properties: z.record(z.string(), z.union([z.string().max(160), z.number(), z.boolean()])).optional(),
});

router.post("/enquiries", enquiryLimiter, async (request, response) => {
  const parsed = enquirySchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({
      error: "Please check the enquiry details and try again.",
      fields: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const input = parsed.data;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let gemstoneId: string | null = null;
    if (input.gemstoneReference) {
      const gemstone = await client.query<{ id: string }>(
        "SELECT id FROM gemstones WHERE UPPER(reference_code) = UPPER($1) AND status = 'published' AND public_visibility = TRUE AND is_sample = FALSE LIMIT 1",
        [input.gemstoneReference],
      );
      if (!gemstone.rowCount) {
        await client.query("ROLLBACK");
        response.status(400).json({ error: "The selected gemstone is no longer available for enquiry. Please refresh and try again." });
        return;
      }
      gemstoneId = gemstone.rows[0].id;
    }

    const customer = await client.query<{ id: string }>(
      "INSERT INTO customer_profiles (full_name, company_name, email, phone, source) VALUES ($1,$2,$3,$4,'website') ON CONFLICT (LOWER(email)) DO UPDATE SET full_name = EXCLUDED.full_name, company_name = COALESCE(NULLIF(EXCLUDED.company_name, ''), customer_profiles.company_name), phone = COALESCE(NULLIF(EXCLUDED.phone, ''), customer_profiles.phone), updated_at = NOW() RETURNING id",
      [input.name, input.company || null, input.email, input.phone || null],
    );

    const counter = await client.query<{ last_number: string }>(
      "UPDATE enquiry_number_counter SET last_number = last_number + 1 WHERE id = 1 RETURNING last_number",
    );
    const sequence = String(counter.rows[0].last_number).padStart(6, "0");
    const enquiryNumber = "ENQ-" + new Date().getUTCFullYear() + "-" + sequence;

    const enquiry = await client.query(
      "INSERT INTO enquiries (enquiry_number, customer_id, gemstone_id, name_snapshot, email_snapshot, company_snapshot, phone_snapshot, enquiry_type, message, source, source_path) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'website',$10) RETURNING id, enquiry_number, status, created_at",
      [
        enquiryNumber,
        customer.rows[0].id,
        gemstoneId,
        input.name,
        input.email,
        input.company || null,
        input.phone || null,
        input.type,
        input.message,
        input.sourcePath || null,
      ],
    );

    await client.query(
      "INSERT INTO notifications (notification_type, severity, title, body, entity_type, entity_id) VALUES ('new_enquiry','success','New website enquiry',$1,'enquiry',$2)",
      ["A new enquiry was received from " + input.name + " (" + enquiryNumber + ").", enquiry.rows[0].id],
    );
    await client.query(
      "INSERT INTO analytics_events (event_name, page_path, gemstone_id, consent_state, properties) VALUES ('enquiry_submitted',$1,$2,'unknown',$3::jsonb)",
      [input.sourcePath || null, gemstoneId, JSON.stringify({ enquiryNumber, enquiryType: input.type })],
    );

    await client.query("COMMIT");
    response.status(201).json({
      message: "Thank you. Your enquiry has been received.",
      enquiry: enquiry.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

router.post("/events", eventLimiter, async (request, response) => {
  const parsed = eventSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid event data." });
    return;
  }
  const input = parsed.data;
  const properties = input.consentState === "granted" ? (input.properties || {}) : {};
  let gemstoneId: string | null = null;
  if (input.gemstoneReference) {
    const gemstone = await pool.query<{ id: string }>(
      "SELECT id FROM gemstones WHERE UPPER(reference_code) = UPPER($1) LIMIT 1",
      [input.gemstoneReference],
    );
    gemstoneId = gemstone.rows[0]?.id ?? null;
  }
  await pool.query(
    "INSERT INTO analytics_events (event_name, anonymous_id, page_path, section_key, gemstone_id, category, source, consent_state, properties) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)",
    [
      input.eventName,
      input.consentState === "granted" ? input.anonymousId || null : null,
      input.pagePath || null,
      input.sectionKey || null,
      gemstoneId,
      input.category || null,
      input.source || null,
      input.consentState,
      JSON.stringify(properties),
    ],
  );
  response.status(202).json({ accepted: true });
});

export default router;
