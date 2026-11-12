
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

import { pool } from "../db/pool.js";
import { env } from "../config/env.js";
import { sendAuthEmail } from "../services/email.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts. Please try again later.",
  },
});

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(180),
  companyName: z.string().trim().max(180).optional().default(""),
  email: z.string().trim().email().max(320).transform((v) => v.toLowerCase()),
  phone: z.string().trim().max(40).optional().default(""),
  password: z.string().min(12).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(320).transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(128),
});

const emailSchema = z.object({
  email: z.string().trim().email().max(320).transform((v) => v.toLowerCase()),
});

const resetSchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(12).max(128),
});

const verifySchema = z.object({
  token: z.string().min(20).max(200),
});

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createToken(): string {
  return randomBytes(32).toString("base64url");
}

function makeAuthUrl(path: string, token: string): string {
  return `${env.APP_BASE_URL}/${path}?token=${encodeURIComponent(token)}`;
}

function isDuplicateEmail(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function saveSession(req: import("express").Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function regenerateSession(req: import("express").Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

router.post("/register", authLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Please provide valid registration details. Passwords must contain at least 12 characters.",
    });
    return;
  }

  const input = parsed.data;

  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });

  const rawToken = createToken();
  const tokenHash = hashToken(rawToken);

  const client = await pool.connect();
  let userId: string;

  try {
    await client.query("BEGIN");

    const userResult = await client.query<{ id: string }>(
      `INSERT INTO users
        (email, full_name, company_name, phone, password_hash,
         account_type, status)
       VALUES ($1, $2, $3, $4, $5, 'customer', 'pending_verification')
       RETURNING id`,
      [
        input.email,
        input.fullName,
        input.companyName || null,
        input.phone || null,
        passwordHash,
      ]
    );

    userId = userResult.rows[0].id;

    await client.query(
      `INSERT INTO email_verification_tokens
        (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
      [userId, tokenHash]
    );

    await client.query(
      `INSERT INTO customer_profiles
        (user_id, full_name, company_name, email, phone, customer_status, source)
       VALUES ($1, $2, $3, $4, $5, 'active', 'website')
       ON CONFLICT (LOWER(email)) DO UPDATE
       SET user_id = EXCLUDED.user_id,
           full_name = EXCLUDED.full_name,
           company_name = EXCLUDED.company_name,
           phone = EXCLUDED.phone,
           updated_at = NOW()`,
      [userId, input.fullName, input.companyName || null, input.email, input.phone || null]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");

    if (isDuplicateEmail(error)) {
      res.status(409).json({
        error: "An account already exists with this email address.",
      });
      return;
    }

    throw error;
  } finally {
    client.release();
  }

  const verificationUrl = makeAuthUrl("verify-email", rawToken);

  try {
    await sendAuthEmail({
      to: input.email,
      subject: "Verify your Hong Kong Gem House account",
      text: `Hello ${input.fullName},\n\nPlease verify your account using this link:\n${verificationUrl}\n\nThis link expires in 24 hours.`,
      html: `
        <h2>Welcome to Hong Kong Gem House</h2>
        <p>Hello ${input.fullName.replace(/[&<>"']/g, "")},</p>
        <p>Please verify your email address to activate your customer account.</p>
        <p><a href="${verificationUrl}">Verify my email address</a></p>
        <p>This link expires in 24 hours.</p>
      `,
    });
  } catch (error) {
    console.error("Verification email delivery failed:", error);
    res.status(503).json({
      error: "Your account was created, but the verification email could not be delivered. Please contact the company.",
    });
    return;
  }

  res.status(201).json({
    message: "Your account has been created. Please check your email to verify it.",
  });
});

router.post("/verify-email", authLimiter, async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid verification link." });
    return;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query<{ user_id: string }>(
      `UPDATE email_verification_tokens
       SET used_at = NOW()
       WHERE token_hash = $1
         AND used_at IS NULL
         AND expires_at > NOW()
       RETURNING user_id`,
      [hashToken(parsed.data.token)]
    );

    if (!result.rowCount) {
      await client.query("ROLLBACK");
      res.status(400).json({
        error: "This verification link is invalid, expired or already used.",
      });
      return;
    }

    const userResult = await client.query(
      `UPDATE users
       SET status = 'active',
           email_verified_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
         AND account_type = 'customer'
         AND status = 'pending_verification'`,
      [result.rows[0].user_id]
    );

    if (!userResult.rowCount) {
      await client.query("ROLLBACK");
      res.status(400).json({
        error: "This account is already verified or cannot be activated.",
      });
      return;
    }

    await client.query("COMMIT");

    res.json({
      message: "Your email address has been verified. You can now sign in.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

router.post("/login", authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Please provide a valid email and password." });
    return;
  }

  const result = await pool.query<{
    id: string;
    email: string;
    full_name: string;
    password_hash: string;
    account_type: string;
    status: string;
  }>(
    `SELECT id, email, full_name, password_hash, account_type, status
     FROM users
     WHERE LOWER(email) = $1
     LIMIT 1`,
    [parsed.data.email]
  );

  const user = result.rows[0];

  if (!user || user.account_type !== "customer") {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const passwordMatches = await argon2.verify(
    user.password_hash,
    parsed.data.password
  );

  if (!passwordMatches) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  if (user.status === "pending_verification") {
    res.status(403).json({
      error: "Please verify your email address before signing in.",
    });
    return;
  }

  if (user.status !== "active") {
    res.status(403).json({
      error: "This account is currently unavailable.",
    });
    return;
  }

  // Rotate the session ID to prevent session fixation.
  await regenerateSession(req);

  req.session.user = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    accountType: "customer",
  };

  await saveSession(req);

  await pool.query(
    "UPDATE users SET last_login_at = NOW() WHERE id = $1",
    [user.id]
  );

  res.json({
    message: "Login successful.",
    user: req.session.user,
  });
});

router.get("/me", (req, res) => {
  res.json({
    user: req.session.user ?? null,
  });
});

router.post("/logout", async (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      next(error);
      return;
    }

    res.clearCookie("hkg.sid", {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.json({ message: "You have been signed out." });
  });
});

router.post("/forgot-password", authLimiter, async (req, res) => {
  const parsed = emailSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }

  const genericMessage =
    "If an account exists for this email, password recovery instructions will be sent.";

  const result = await pool.query<{ id: string; full_name: string }>(
    `SELECT id, full_name
     FROM users
     WHERE email = $1
       AND account_type = 'customer'
       AND status = 'active'
     LIMIT 1`,
    [parsed.data.email]
  );

  const user = result.rows[0];

  if (!user) {
    res.json({ message: genericMessage });
    return;
  }

  const rawToken = createToken();
  const tokenHash = hashToken(rawToken);

  await pool.query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [user.id]
  );

  await pool.query(
    `INSERT INTO password_reset_tokens
      (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
    [user.id, tokenHash]
  );

  const resetUrl = makeAuthUrl("reset-password", rawToken);

  try {
    await sendAuthEmail({
      to: parsed.data.email,
      subject: "Reset your Hong Kong Gem House password",
      text: `Hello ${user.full_name},\n\nUse this link to reset your password:\n${resetUrl}\n\nThis link expires in 30 minutes.`,
      html: `
        <h2>Password reset</h2>
        <p>Hello ${user.full_name.replace(/[&<>"']/g, "")},</p>
        <p>Use the link below to reset your password.</p>
        <p><a href="${resetUrl}">Reset my password</a></p>
        <p>This link expires in 30 minutes.</p>
      `,
    });
  } catch (error) {
    console.error("Password recovery email delivery failed:", error);
  }

  res.json({ message: genericMessage });
});

router.post("/reset-password", authLimiter, async (req, res) => {
  const parsed = resetSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid reset request. Password must contain at least 12 characters.",
    });
    return;
  }

  const passwordHash = await argon2.hash(parsed.data.password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const tokenResult = await client.query<{ user_id: string }>(
      `SELECT user_id
       FROM password_reset_tokens
       WHERE token_hash = $1
         AND used_at IS NULL
         AND expires_at > NOW()
       FOR UPDATE`,
      [hashToken(parsed.data.token)]
    );

    if (!tokenResult.rowCount) {
      await client.query("ROLLBACK");
      res.status(400).json({
        error: "This password reset link is invalid, expired or already used.",
      });
      return;
    }

    const userId = tokenResult.rows[0].user_id;

    await client.query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2 AND account_type = 'customer'`,
      [passwordHash, userId]
    );

    await client.query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL`,
      [userId]
    );

    // Sign out all existing sessions for this customer.
    await client.query(
      `DELETE FROM user_sessions
       WHERE sess->'user'->>'id' = $1`,
      [userId]
    );

    await client.query("COMMIT");

    res.json({
      message: "Your password has been updated. Please sign in again.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

export default router;
