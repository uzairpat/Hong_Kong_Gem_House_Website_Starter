import argon2 from "argon2";
import { pool } from "../db/pool.js";
import { env } from "../config/env.js";

async function bootstrapOwner(): Promise<void> {
  const email = env.ADMIN_OWNER_EMAIL.trim().toLowerCase();
  const password = env.ADMIN_OWNER_PASSWORD;

  if (!email || !password) {
    throw new Error("Set ADMIN_OWNER_EMAIL and ADMIN_OWNER_PASSWORD in the backend environment before running the owner bootstrap.");
  }
  if (password.length < 16 || password.length > 128) {
    throw new Error("The initial owner password must be between 16 and 128 characters.");
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Serialize concurrent bootstrap attempts before checking the one-owner invariant.
    await client.query("SELECT pg_advisory_xact_lock(hashtext('hkg-owner-bootstrap'))");
    const existingAdmin = await client.query(
      "SELECT id FROM users WHERE account_type = 'admin' LIMIT 1",
    );
    if (existingAdmin.rowCount) {
      throw new Error("An administrator already exists. The one-time owner bootstrap will not create or replace another account.");
    }

    const user = await client.query<{ id: string }>(
      "INSERT INTO users (email, full_name, password_hash, account_type, status, email_verified_at) VALUES ($1,$2,$3,'admin','active',NOW()) RETURNING id",
      [email, "Hong Kong Gem House Owner", passwordHash],
    );
    const ownerRole = await client.query<{ id: string }>(
      "SELECT id FROM roles WHERE code = 'owner' LIMIT 1",
    );
    if (!ownerRole.rowCount) {
      throw new Error("The owner role is missing. Run database migrations before bootstrapping.");
    }
    await client.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES ($1,$2)",
      [user.rows[0].id, ownerRole.rows[0].id],
    );
    await client.query(
      "INSERT INTO admin_profiles (user_id, mfa_required) VALUES ($1, TRUE)",
      [user.rows[0].id],
    );
    await client.query("COMMIT");
    console.log("Initial owner account created.");
    console.log("Next step: sign in at /admin/login and complete authenticator-app MFA setup.");
    console.log("The initial owner account can only be created once. Remove ADMIN_OWNER_PASSWORD from the environment after bootstrap.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

bootstrapOwner()
  .catch((error: unknown) => {
    console.error("Owner bootstrap failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
