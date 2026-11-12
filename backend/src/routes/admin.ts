import { Router, type Request, type Response, type NextFunction } from "express";
import { rateLimit } from "express-rate-limit";
import argon2 from "argon2";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { env } from "../config/env.js";
import { sendAuthEmail } from "../services/email.js";

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Please try again later." },
});
const mutationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

const loginSchema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});
const otpSchema = z.object({ code: z.string().regex(/^\d{6}$/) });
const resetRequestSchema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
});
const resetSchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(12).max(128),
});

const gemstoneCreateSchema = z.object({
  referenceCode: z.string().trim().min(3).max(32).regex(/^[A-Za-z0-9-]+$/)
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(180),
  category: z.enum(["ruby", "sapphire", "emerald", "rare"]),
  weightCarat: z.number().positive().max(999999).nullable().optional(),
  shape: z.string().trim().max(80).nullable().optional(),
  origin: z.string().trim().max(120).nullable().optional(),
  colour: z.string().trim().max(120).nullable().optional(),
  clarity: z.string().trim().max(80).nullable().optional(),
  treatment: z.string().trim().max(160).nullable().optional(),
  certificationLab: z.string().trim().max(120).nullable().optional(),
  certificationNumber: z.string().trim().max(120).nullable().optional(),
  description: z.string().trim().max(8000).nullable().optional(),
  availabilityStatus: z.enum(["available", "reserved", "sold", "unavailable"]).optional(),
  acquisitionCost: z.number().nonnegative().nullable().optional(),
  sellingPrice: z.number().nonnegative().nullable().optional(),
  currencyCode: z.string().trim().length(3).transform((value) => value.toUpperCase()).nullable().optional(),
  publicPriceMode: z.enum(["hidden", "enquiry", "fixed"]).optional(),
  publicVisibility: z.boolean().optional(),
});
const gemstoneUpdateSchema = gemstoneCreateSchema.omit({ referenceCode: true }).partial();

const enquiryUpdateSchema = z.object({
  status: z.enum(["new", "assigned", "in_progress", "waiting_customer", "quotation_sent", "won", "lost", "closed"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  assignedStaffId: z.string().uuid().nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
});
const noteSchema = z.object({ note: z.string().trim().min(1).max(5000) });
const staffCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(180),
  email: z.string().trim().email().max(320).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  department: z.string().trim().max(120).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  employmentStatus: z.enum(["active", "inactive", "on_leave"]).optional(),
  notes: z.string().trim().max(3000).optional(),
});

type OwnerSession = { id: string; email: string; fullName: string; role: "owner" };
type AdminChallenge = { id: string; email: string; fullName: string; expiresAt: number };

function createToken(): string {
  return randomBytes(32).toString("base64url");
}
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
function saveSession(request: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    request.session.save((error) => error ? reject(error) : resolve());
  });
}
function regenerateSession(request: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    request.session.regenerate((error) => error ? reject(error) : resolve());
  });
}
function getChallenge(request: Request): AdminChallenge | null {
  const challenge = request.session.adminChallenge as AdminChallenge | undefined;
  if (!challenge || challenge.expiresAt < Date.now()) return null;
  return challenge;
}
function encryptionKey(): Buffer {
  const key = Buffer.from(env.MFA_ENCRYPTION_KEY, "base64");
  if (key.length !== 32) {
    throw new Error("MFA_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  }
  return key;
}
function encryptSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}
function decryptSecret(payload: string): string {
  const parts = payload.split(".");
  if (parts.length !== 3) throw new Error("Invalid stored MFA secret.");
  const iv = Buffer.from(parts[0], "base64url");
  const tag = Buffer.from(parts[1], "base64url");
  const ciphertext = Buffer.from(parts[2], "base64url");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function encodeBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += base32Alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += base32Alphabet[(value << (5 - bits)) & 31];
  return output;
}
function decodeBase32(input: string): Buffer {
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const char of input.toUpperCase().replace(/=+$/g, "")) {
    const index = base32Alphabet.indexOf(char);
    if (index < 0) throw new Error("Invalid base32 MFA secret.");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}
function totp(secret: string, timestamp = Date.now()): string {
  const counter = BigInt(Math.floor(timestamp / 30000));
  const message = Buffer.alloc(8);
  let remaining = counter;
  for (let index = 7; index >= 0; index -= 1) {
    message[index] = Number(remaining & 255n);
    remaining >>= 8n;
  }
  const digest = createHmac("sha1", decodeBase32(secret)).update(message).digest();
  const offset = digest[digest.length - 1] & 15;
  const code = ((digest[offset] & 127) << 24)
    | ((digest[offset + 1] & 255) << 16)
    | ((digest[offset + 2] & 255) << 8)
    | (digest[offset + 3] & 255);
  return String(code % 1000000).padStart(6, "0");
}
function verifyTotp(secret: string, code: string): boolean {
  const candidate = Buffer.from(code);
  for (const drift of [-1, 0, 1]) {
    const expected = Buffer.from(totp(secret, Date.now() + drift * 30000));
    if (candidate.length === expected.length && timingSafeEqual(candidate, expected)) return true;
  }
  return false;
}
async function recordAudit(
  request: Request,
  action: string,
  entityType: string,
  entityId: string | null,
  beforeData: unknown = null,
  afterData: unknown = null,
): Promise<void> {
  await pool.query(
    "INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, before_data, after_data, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8)",
    [
      request.session.admin?.id ?? request.session.adminChallenge?.id ?? null,
      action,
      entityType,
      entityId,
      beforeData === null ? null : JSON.stringify(beforeData),
      afterData === null ? null : JSON.stringify(afterData),
      request.ip || null,
      request.get("user-agent") || null,
    ],
  );
}
async function activateOwnerSession(request: Request, owner: OwnerSession): Promise<void> {
  await regenerateSession(request);
  request.session.admin = owner;
  await saveSession(request);
}
function denyChallenge(response: Response): void {
  response.status(401).json({ error: "Your verification session has expired. Please sign in again." });
}
async function requireOwner(request: Request, response: Response, next: NextFunction): Promise<void> {
  const owner = request.session.admin as OwnerSession | undefined;
  if (!owner?.id) {
    response.status(401).json({ error: "Owner sign-in is required." });
    return;
  }
  try {
    const result = await pool.query(
      "SELECT 1 FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id JOIN admin_profiles ap ON ap.user_id = u.id WHERE u.id = $1 AND u.account_type = 'admin' AND u.status = 'active' AND r.code = 'owner' AND ap.mfa_enabled_at IS NOT NULL AND ap.mfa_required = TRUE LIMIT 1",
      [owner.id],
    );
    if (!result.rowCount) {
      response.status(403).json({ error: "This account does not have owner portal access." });
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
}

router.post("/auth/login", authLimiter, async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Enter a valid email address and password." });
    return;
  }
  if (env.ADMIN_OWNER_EMAIL && parsed.data.email !== env.ADMIN_OWNER_EMAIL.toLowerCase()) {
    response.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const result = await pool.query<{
    id: string; email: string; full_name: string; password_hash: string;
  }>(
    "SELECT u.id, u.email, u.full_name, u.password_hash FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id WHERE LOWER(u.email) = $1 AND u.account_type = 'admin' AND u.status = 'active' AND r.code = 'owner' LIMIT 1",
    [parsed.data.email],
  );
  const owner = result.rows[0];
  if (!owner || !(await argon2.verify(owner.password_hash, parsed.data.password))) {
    await recordAudit(request, "admin_login_failed", "admin_session", null, null, { email: parsed.data.email });
    response.status(401).json({ error: "Invalid email or password." });
    return;
  }

  await regenerateSession(request);
  request.session.adminChallenge = {
    id: owner.id,
    email: owner.email,
    fullName: owner.full_name,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  await saveSession(request);

  const mfa = await pool.query<{ mfa_secret_encrypted: string | null; mfa_enabled_at: Date | null }>(
    "SELECT mfa_secret_encrypted, mfa_enabled_at FROM admin_profiles WHERE user_id = $1",
    [owner.id],
  );
  response.json({
    mfaRequired: true,
    mfaSetupRequired: !mfa.rows[0]?.mfa_enabled_at,
    message: mfa.rows[0]?.mfa_enabled_at
      ? "Enter the six-digit code from your authenticator app."
      : "Set up an authenticator app to secure the owner portal.",
  });
});

router.post("/auth/mfa/setup", authLimiter, async (request, response) => {
  const challenge = getChallenge(request);
  if (!challenge) {
    denyChallenge(response);
    return;
  }
  const secret = encodeBase32(randomBytes(20));
  const issuer = encodeURIComponent("Hong Kong Gem House");
  const label = encodeURIComponent(challenge.email);
  const otpauthUri = "otpauth://totp/" + issuer + ":" + label
    + "?secret=" + secret + "&issuer=" + issuer + "&algorithm=SHA1&digits=6&period=30";
  await pool.query(
    "UPDATE admin_profiles SET mfa_secret_encrypted = $1, updated_at = NOW() WHERE user_id = $2 AND mfa_enabled_at IS NULL",
    [encryptSecret(secret), challenge.id],
  );
  response.json({
    secret,
    otpauthUri,
    issuer: "Hong Kong Gem House",
    account: challenge.email,
    instructions: "Add this account to an authenticator app, then enter the current six-digit code to confirm.",
  });
});

router.post("/auth/mfa/verify", authLimiter, async (request, response) => {
  const challenge = getChallenge(request);
  if (!challenge) {
    denyChallenge(response);
    return;
  }
  const parsed = otpSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Enter the six-digit authenticator code." });
    return;
  }
  const result = await pool.query<{ mfa_secret_encrypted: string | null; mfa_enabled_at: Date | null }>(
    "SELECT mfa_secret_encrypted, mfa_enabled_at FROM admin_profiles WHERE user_id = $1",
    [challenge.id],
  );
  const row = result.rows[0];
  if (!row?.mfa_secret_encrypted) {
    response.status(409).json({ error: "MFA setup has not been started. Please restart sign-in." });
    return;
  }
  const secret = decryptSecret(row.mfa_secret_encrypted);
  if (!verifyTotp(secret, parsed.data.code)) {
    await recordAudit(request, "admin_mfa_failed", "admin_session", challenge.id);
    response.status(401).json({ error: "That code is not valid. Check your authenticator and try again." });
    return;
  }
  if (!row.mfa_enabled_at) {
    await pool.query(
      "UPDATE admin_profiles SET mfa_enabled_at = NOW(), mfa_required = TRUE, updated_at = NOW() WHERE user_id = $1",
      [challenge.id],
    );
  }
  const owner: OwnerSession = {
    id: challenge.id,
    email: challenge.email,
    fullName: challenge.fullName,
    role: "owner",
  };
  await pool.query("UPDATE admin_profiles SET last_admin_login_at = NOW() WHERE user_id = $1", [owner.id]);
  await pool.query("UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1", [owner.id]);
  await activateOwnerSession(request, owner);
  await recordAudit(request, "admin_login_success", "admin_session", owner.id);
  response.json({ message: "Owner verification successful.", admin: owner });
});

router.post("/auth/password/forgot", authLimiter, async (request, response) => {
  const parsed = resetRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Enter a valid email address." });
    return;
  }
  const genericMessage = "If an owner account matches that email, password reset instructions will be sent.";
  if (env.ADMIN_OWNER_EMAIL && parsed.data.email !== env.ADMIN_OWNER_EMAIL.toLowerCase()) {
    response.json({ message: genericMessage });
    return;
  }
  const result = await pool.query<{ id: string; full_name: string }>(
    "SELECT id, full_name FROM users WHERE LOWER(email) = $1 AND account_type = 'admin' AND status = 'active' LIMIT 1",
    [parsed.data.email],
  );
  const owner = result.rows[0];
  if (!owner) {
    response.json({ message: genericMessage });
    return;
  }
  const token = createToken();
  await pool.query(
    "UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL",
    [owner.id],
  );
  await pool.query(
    "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '30 minutes')",
    [owner.id, hashToken(token)],
  );
  const resetUrl = env.APP_BASE_URL.replace(/\/$/, "") + "/admin/reset-password?token=" + encodeURIComponent(token);
  try {
    await sendAuthEmail({
      to: parsed.data.email,
      subject: "Reset your Hong Kong Gem House admin password",
      text: "Hello " + owner.full_name + ",\n\nUse this link to reset your owner portal password:\n" + resetUrl + "\n\nThis link expires in 30 minutes.",
      html: "<h2>Owner portal password reset</h2><p>Hello " + owner.full_name.replace(/[&<>\"']/g, "") + ",</p><p><a href=\"" + resetUrl + "\">Reset your password</a></p><p>This link expires in 30 minutes.</p>",
    });
  } catch (error) {
    console.error("Admin password reset email delivery failed:", error);
  }
  response.json({ message: genericMessage });
});

router.post("/auth/password/reset", authLimiter, async (request, response) => {
  const parsed = resetSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Use a reset link and a password with at least 12 characters." });
    return;
  }
  const passwordHash = await argon2.hash(parsed.data.password, {
    type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1,
  });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const tokenResult = await client.query<{ user_id: string }>(
      "SELECT user_id FROM password_reset_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW() FOR UPDATE",
      [hashToken(parsed.data.token)],
    );
    const userId = tokenResult.rows[0]?.user_id;
    if (!userId) {
      await client.query("ROLLBACK");
      response.status(400).json({ error: "This reset link is invalid, expired or already used." });
      return;
    }
    const update = await client.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 AND account_type = 'admin'",
      [passwordHash, userId],
    );
    if (!update.rowCount) {
      await client.query("ROLLBACK");
      response.status(400).json({ error: "This account cannot use this reset link." });
      return;
    }
    await client.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL", [userId]);
    await client.query("DELETE FROM user_sessions WHERE sess->'admin'->>'id' = $1 OR sess->'adminChallenge'->>'id' = $1", [userId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  response.json({ message: "Your password has been reset. Sign in again and complete MFA verification." });
});

router.post("/auth/logout", async (request, response, next) => {
  request.session.destroy((error) => {
    if (error) {
      next(error);
      return;
    }
    response.clearCookie("hkg.sid", {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    response.json({ message: "You have been signed out." });
  });
});

router.get("/me", requireOwner, async (request, response) => {
  response.json({ admin: request.session.admin });
});

router.use(mutationLimiter);
router.use(requireOwner);

router.get("/dashboard/summary", async (_request, response) => {
  const result = await pool.query(
    "SELECT " +
    "(SELECT COUNT(*)::int FROM gemstones WHERE is_sample = FALSE) AS gemstone_count, " +
    "(SELECT COUNT(*)::int FROM gemstones WHERE is_sample = FALSE AND status = 'published' AND public_visibility = TRUE) AS published_count, " +
    "(SELECT COUNT(*)::int FROM enquiries) AS enquiry_count, " +
    "(SELECT COUNT(*)::int FROM enquiries WHERE status NOT IN ('won', 'lost', 'closed')) AS open_enquiry_count, " +
    "(SELECT COUNT(*)::int FROM customer_profiles WHERE customer_status = 'active') AS customer_count, " +
    "(SELECT COUNT(*)::int FROM staff_profiles WHERE employment_status = 'active') AS active_staff_count",
  );
  const recent = await pool.query(
    "SELECT id, action, entity_type, entity_id, occurred_at FROM audit_logs ORDER BY occurred_at DESC LIMIT 8",
  );
  const attention = await pool.query(
    "SELECT id, enquiry_number, name_snapshot, enquiry_type, priority, status, created_at FROM enquiries WHERE status NOT IN ('won', 'lost', 'closed') ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, created_at ASC LIMIT 8",
  );
  response.json({
    summary: result.rows[0],
    recentActivity: recent.rows,
    attention: attention.rows,
    sales: { status: "not_configured", message: "Sales workflows are the next implementation slice." },
    generatedAt: new Date().toISOString(),
  });
});

router.get("/gemstones", async (request, response) => {
  const search = typeof request.query.search === "string" ? request.query.search.trim() : "";
  const category = typeof request.query.category === "string" ? request.query.category : "";
  const status = typeof request.query.status === "string" ? request.query.status : "";
  const availability = typeof request.query.availability === "string" ? request.query.availability : "";
  const page = Math.max(1, Number.parseInt(String(request.query.page || "1"), 10) || 1);
  const pageSize = Math.min(100, Math.max(10, Number.parseInt(String(request.query.pageSize || "25"), 10) || 25));
  const conditions = ["g.is_sample = FALSE"];
  const values: unknown[] = [];
  if (search) {
    values.push("%" + search + "%");
    conditions.push("(g.reference_code ILIKE $" + values.length + " OR g.name ILIKE $" + values.length + " OR COALESCE(g.origin, '') ILIKE $" + values.length + ")");
  }
  if (category && ["ruby", "sapphire", "emerald", "rare"].includes(category)) {
    values.push(category);
    conditions.push("g.category = $" + values.length);
  }
  if (status && ["draft", "pending_review", "published", "archived"].includes(status)) {
    values.push(status);
    conditions.push("g.status = $" + values.length);
  }
  if (availability && ["available", "reserved", "sold", "unavailable"].includes(availability)) {
    values.push(availability);
    conditions.push("g.availability_status = $" + values.length);
  }
  const where = conditions.join(" AND ");
  const count = await pool.query("SELECT COUNT(*)::int AS total FROM gemstones g WHERE " + where, values);
  values.push(pageSize, (page - 1) * pageSize);
  const result = await pool.query(
    "SELECT g.id, g.reference_code, g.name, g.category, g.weight_carat, g.shape, g.origin, g.colour, g.clarity, g.treatment, g.certification_lab, g.certification_number, g.description, g.status, g.availability_status, g.public_visibility, g.acquisition_cost::text, g.selling_price::text, g.currency_code, g.public_price_mode, g.created_at, g.updated_at, (SELECT gi.image_path FROM gemstone_images gi WHERE gi.gemstone_id = g.id ORDER BY gi.is_primary DESC, gi.sort_order ASC, gi.created_at ASC LIMIT 1) AS image_path FROM gemstones g WHERE " + where + " ORDER BY g.updated_at DESC, g.reference_code ASC LIMIT $" + (values.length - 1) + " OFFSET $" + values.length,
    values,
  );
  response.json({ data: result.rows, count: count.rows[0].total, page, pageSize });
});

router.post("/gemstones", async (request, response) => {
  const parsed = gemstoneCreateSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Check the gemstone details and try again.", fields: parsed.error.flatten().fieldErrors });
    return;
  }
  const input = parsed.data;
  try {
    const result = await pool.query(
      "INSERT INTO gemstones (reference_code, name, category, weight_carat, shape, origin, colour, clarity, treatment, certification_lab, certification_number, description, status, availability_status, acquisition_cost, selling_price, currency_code, public_price_mode, public_visibility, is_sample, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'draft',$13,$14,$15,$16,$17,$18,FALSE,$19,$19) RETURNING *",
      [
        input.referenceCode, input.name, input.category, input.weightCarat ?? null,
        input.shape || null, input.origin || null, input.colour || null, input.clarity || null,
        input.treatment || null, input.certificationLab || null, input.certificationNumber || null,
        input.description || null, input.availabilityStatus || "available",
        input.acquisitionCost ?? null, input.sellingPrice ?? null, input.currencyCode ?? null,
        input.publicPriceMode || "hidden", input.publicVisibility ?? true, request.session.admin!.id,
      ],
    );
    await recordAudit(request, "gemstone_created", "gemstone", result.rows[0].id, null, result.rows[0]);
    response.status(201).json({ data: result.rows[0] });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      response.status(409).json({ error: "That gemstone reference code is already in use." });
      return;
    }
    throw error;
  }
});

router.patch("/gemstones/:id", async (request, response) => {
  const parsed = gemstoneUpdateSchema.safeParse(request.body);
  if (!parsed.success || Object.keys(parsed.data || {}).length === 0) {
    response.status(400).json({ error: "Provide at least one valid gemstone field.", fields: parsed.success ? undefined : parsed.error.flatten().fieldErrors });
    return;
  }
  const columns: Record<string, string> = {
    name: "name", category: "category", weightCarat: "weight_carat", shape: "shape",
    origin: "origin", colour: "colour", clarity: "clarity", treatment: "treatment",
    certificationLab: "certification_lab", certificationNumber: "certification_number",
    description: "description", availabilityStatus: "availability_status",
    acquisitionCost: "acquisition_cost", sellingPrice: "selling_price",
    currencyCode: "currency_code", publicPriceMode: "public_price_mode",
    publicVisibility: "public_visibility",
  };
  const before = await pool.query("SELECT * FROM gemstones WHERE id = $1 AND is_sample = FALSE", [request.params.id]);
  if (!before.rowCount) {
    response.status(404).json({ error: "Gemstone not found." });
    return;
  }
  const entries = Object.entries(parsed.data).filter(([key]) => columns[key]);
  const values = entries.map(([, value]) => value === "" ? null : value);
  const assignments = entries.map(([key], index) => columns[key] + " = $" + (index + 1));
  values.push(request.session.admin!.id, request.params.id);
  const result = await pool.query(
    "UPDATE gemstones SET " + assignments.join(", ") + ", updated_by = $" + (values.length - 1) + ", updated_at = NOW() WHERE id = $" + values.length + " AND is_sample = FALSE RETURNING *",
    values,
  );
  await recordAudit(request, "gemstone_updated", "gemstone", request.params.id, before.rows[0], result.rows[0]);
  response.json({ data: result.rows[0] });
});

async function changeGemstoneStatus(request: Request, response: Response, next: NextFunction, status: "draft" | "published" | "archived"): Promise<void> {
  try {
    const gemstoneId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    if (typeof gemstoneId !== "string" || !gemstoneId) {
      response.status(400).json({ error: "A valid gemstone ID is required." });
      return;
    }
    const before = await pool.query("SELECT * FROM gemstones WHERE id = $1 AND is_sample = FALSE", [gemstoneId]);
    if (!before.rowCount) {
      response.status(404).json({ error: "Gemstone not found." });
      return;
    }
    if (status === "published") {
      const row = before.rows[0];
      if (!row.name || !row.category) {
        response.status(400).json({ error: "Add the required gemstone details before publishing." });
        return;
      }
    }
    const result = await pool.query(
      "UPDATE gemstones SET status = $1, updated_by = $2, updated_at = NOW() WHERE id = $3 AND is_sample = FALSE RETURNING *",
      [status, request.session.admin!.id, gemstoneId],
    );
    await recordAudit(request, "gemstone_" + status, "gemstone", gemstoneId, before.rows[0], result.rows[0]);
    response.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
}
router.post("/gemstones/:id/publish", (request, response, next) => void changeGemstoneStatus(request, response, next, "published"));
router.post("/gemstones/:id/unpublish", (request, response, next) => void changeGemstoneStatus(request, response, next, "draft"));
router.post("/gemstones/:id/archive", (request, response, next) => void changeGemstoneStatus(request, response, next, "archived"));
router.post("/gemstones/:id/restore", (request, response, next) => void changeGemstoneStatus(request, response, next, "draft"));
router.get("/gemstones/:id/history", async (request, response) => {
  const result = await pool.query(
    "SELECT id, action, before_data, after_data, occurred_at FROM audit_logs WHERE entity_type = 'gemstone' AND entity_id = $1 ORDER BY occurred_at DESC LIMIT 100",
    [request.params.id],
  );
  response.json({ data: result.rows });
});

router.get("/enquiries", async (request, response) => {
  const search = typeof request.query.search === "string" ? request.query.search.trim() : "";
  const status = typeof request.query.status === "string" ? request.query.status : "";
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (search) {
    values.push("%" + search + "%");
    conditions.push("(e.enquiry_number ILIKE $" + values.length + " OR e.name_snapshot ILIKE $" + values.length + " OR e.email_snapshot ILIKE $" + values.length + " OR COALESCE(g.reference_code, '') ILIKE $" + values.length + ")");
  }
  if (status && ["new", "assigned", "in_progress", "waiting_customer", "quotation_sent", "won", "lost", "closed"].includes(status)) {
    values.push(status);
    conditions.push("e.status = $" + values.length);
  }
  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const result = await pool.query(
    "SELECT e.id, e.enquiry_number, e.name_snapshot, e.email_snapshot, e.company_snapshot, e.phone_snapshot, e.enquiry_type, e.message, e.source, e.source_path, e.status, e.priority, e.due_at, e.created_at, g.reference_code AS gemstone_reference, g.name AS gemstone_name, s.full_name AS assigned_staff_name, e.assigned_staff_id FROM enquiries e LEFT JOIN gemstones g ON g.id = e.gemstone_id LEFT JOIN staff_profiles s ON s.id = e.assigned_staff_id " + where + " ORDER BY CASE e.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, e.created_at DESC LIMIT 200",
    values,
  );
  response.json({ data: result.rows, count: result.rowCount ?? 0 });
});

router.get("/enquiries/:id", async (request, response) => {
  const result = await pool.query(
    "SELECT e.*, g.reference_code AS gemstone_reference, g.name AS gemstone_name, s.full_name AS assigned_staff_name FROM enquiries e LEFT JOIN gemstones g ON g.id = e.gemstone_id LEFT JOIN staff_profiles s ON s.id = e.assigned_staff_id WHERE e.id = $1",
    [request.params.id],
  );
  if (!result.rowCount) {
    response.status(404).json({ error: "Enquiry not found." });
    return;
  }
  const [notes, activities] = await Promise.all([
    pool.query("SELECT id, note, created_at FROM enquiry_notes WHERE enquiry_id = $1 ORDER BY created_at DESC", [request.params.id]),
    pool.query("SELECT id, activity_type, details, created_at FROM enquiry_activities WHERE enquiry_id = $1 ORDER BY created_at DESC", [request.params.id]),
  ]);
  response.json({ data: result.rows[0], notes: notes.rows, activities: activities.rows });
});

router.patch("/enquiries/:id", async (request, response) => {
  const parsed = enquiryUpdateSchema.safeParse(request.body);
  if (!parsed.success || Object.keys(parsed.data || {}).length === 0) {
    response.status(400).json({ error: "Provide a valid enquiry update.", fields: parsed.success ? undefined : parsed.error.flatten().fieldErrors });
    return;
  }
  const before = await pool.query("SELECT * FROM enquiries WHERE id = $1", [request.params.id]);
  if (!before.rowCount) {
    response.status(404).json({ error: "Enquiry not found." });
    return;
  }
  const input = parsed.data;
  if (input.assignedStaffId) {
    const staff = await pool.query("SELECT 1 FROM staff_profiles WHERE id = $1 AND employment_status = 'active'", [input.assignedStaffId]);
    if (!staff.rowCount) {
      response.status(400).json({ error: "Choose an active staff member for this assignment." });
      return;
    }
  }
  const columns: Record<string, string> = {
    status: "status", priority: "priority", assignedStaffId: "assigned_staff_id", dueAt: "due_at",
  };
  const entries = Object.entries(input).filter(([key]) => columns[key]);
  const values = entries.map(([, value]) => value);
  const assignments = entries.map(([key], index) => columns[key] + " = $" + (index + 1));
  values.push(request.params.id);
  const result = await pool.query(
    "UPDATE enquiries SET " + assignments.join(", ") + ", updated_at = NOW() WHERE id = $" + values.length + " RETURNING *",
    values,
  );
  await pool.query(
    "INSERT INTO enquiry_activities (enquiry_id, actor_user_id, activity_type, details) VALUES ($1, $2, 'record_updated', $3::jsonb)",
    [request.params.id, request.session.admin!.id, JSON.stringify(input)],
  );
  await recordAudit(request, "enquiry_updated", "enquiry", request.params.id, before.rows[0], result.rows[0]);
  response.json({ data: result.rows[0] });
});

router.post("/enquiries/:id/notes", async (request, response) => {
  const parsed = noteSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Enter an internal note." });
    return;
  }
  const exists = await pool.query("SELECT 1 FROM enquiries WHERE id = $1", [request.params.id]);
  if (!exists.rowCount) {
    response.status(404).json({ error: "Enquiry not found." });
    return;
  }
  const result = await pool.query(
    "INSERT INTO enquiry_notes (enquiry_id, actor_user_id, note) VALUES ($1, $2, $3) RETURNING id, note, created_at",
    [request.params.id, request.session.admin!.id, parsed.data.note],
  );
  await recordAudit(request, "enquiry_note_added", "enquiry", request.params.id);
  response.status(201).json({ data: result.rows[0] });
});

router.get("/staff", async (_request, response) => {
  const result = await pool.query(
    "SELECT id, full_name, email, phone, department, job_title, employment_status, notes, created_at, updated_at FROM staff_profiles ORDER BY employment_status, full_name",
  );
  response.json({ data: result.rows });
});
router.post("/staff", async (request, response) => {
  const parsed = staffCreateSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Check the staff details and try again.", fields: parsed.error.flatten().fieldErrors });
    return;
  }
  const input = parsed.data;
  try {
    const result = await pool.query(
      "INSERT INTO staff_profiles (full_name, email, phone, department, job_title, employment_status, notes, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8) RETURNING *",
      [input.fullName, input.email || null, input.phone || null, input.department || null, input.jobTitle || null, input.employmentStatus || "active", input.notes || null, request.session.admin!.id],
    );
    await recordAudit(request, "staff_created", "staff", result.rows[0].id, null, result.rows[0]);
    response.status(201).json({ data: result.rows[0] });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      response.status(409).json({ error: "A staff record already uses that email address." });
      return;
    }
    throw error;
  }
});
router.patch("/staff/:id", async (request, response) => {
  const parsed = staffCreateSchema.partial().safeParse(request.body);
  if (!parsed.success || Object.keys(parsed.data || {}).length === 0) {
    response.status(400).json({ error: "Provide valid staff details." });
    return;
  }
  const before = await pool.query("SELECT * FROM staff_profiles WHERE id = $1", [request.params.id]);
  if (!before.rowCount) {
    response.status(404).json({ error: "Staff record not found." });
    return;
  }
  const columns: Record<string, string> = {
    fullName: "full_name", email: "email", phone: "phone", department: "department",
    jobTitle: "job_title", employmentStatus: "employment_status", notes: "notes",
  };
  const entries = Object.entries(parsed.data).filter(([key]) => columns[key]);
  const values = entries.map(([, value]) => value === "" ? null : value);
  const assignments = entries.map(([key], index) => columns[key] + " = $" + (index + 1));
  values.push(request.session.admin!.id, request.params.id);
  const result = await pool.query(
    "UPDATE staff_profiles SET " + assignments.join(", ") + ", updated_by = $" + (values.length - 1) + ", updated_at = NOW() WHERE id = $" + values.length + " RETURNING *",
    values,
  );
  await recordAudit(request, "staff_updated", "staff", request.params.id, before.rows[0], result.rows[0]);
  response.json({ data: result.rows[0] });
});

router.get("/customers", async (request, response) => {
  const search = typeof request.query.search === "string" ? request.query.search.trim() : "";
  const values: unknown[] = [];
  let where = "";
  if (search) {
    values.push("%" + search + "%");
    where = "WHERE full_name ILIKE $1 OR email ILIKE $1 OR COALESCE(company_name, '') ILIKE $1";
  }
  const result = await pool.query(
    "SELECT id, user_id, full_name, company_name, email, phone, customer_status, source, created_at FROM customer_profiles " + where + " ORDER BY created_at DESC LIMIT 200",
    values,
  );
  response.json({ data: result.rows });
});

router.get("/notifications", async (request, response) => {
  const result = await pool.query(
    "SELECT id, notification_type, severity, title, body, entity_type, entity_id, read_at, created_at FROM notifications WHERE recipient_user_id = $1 OR recipient_user_id IS NULL ORDER BY created_at DESC LIMIT 50",
    [request.session.admin!.id],
  );
  response.json({ data: result.rows });
});
router.patch("/notifications/:id/read", async (request, response) => {
  await pool.query(
    "UPDATE notifications SET read_at = NOW() WHERE id = $1 AND (recipient_user_id = $2 OR recipient_user_id IS NULL)",
    [request.params.id, request.session.admin!.id],
  );
  response.json({ message: "Notification marked as read." });
});

router.get("/audit-logs", async (request, response) => {
  const result = await pool.query(
    "SELECT id, action, entity_type, entity_id, before_data, after_data, occurred_at FROM audit_logs ORDER BY occurred_at DESC LIMIT 200",
  );
  response.json({ data: result.rows });
});

export default router;
