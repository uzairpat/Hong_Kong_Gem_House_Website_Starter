import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_SSL: z.enum(["true", "false"]).default("false")
    .transform((value) => value === "true"),

  CORS_ORIGIN: z.string().default("http://localhost:5173,http://localhost:5174"),

  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  APP_BASE_URL: z.string().url().default("http://localhost:5173"),

  ADMIN_OWNER_EMAIL: z.string().default(""),
  ADMIN_OWNER_PASSWORD: z.string().default(""),
  MFA_ENCRYPTION_KEY: z.string().default(""),

  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: z.enum(["true", "false"]).default("false")
    .transform((value) => value === "true"),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  MAIL_FROM: z.string().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid backend environment configuration:",
    parsed.error.flatten().fieldErrors
  );
  throw new Error("Check backend/.env configuration.");
}

export const env = parsed.data;
