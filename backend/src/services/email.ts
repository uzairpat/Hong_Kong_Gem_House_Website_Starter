
import nodemailer from "nodemailer";
import { env } from "../config/env.js";

type AuthEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

export async function sendAuthEmail(message: AuthEmail): Promise<void> {
  const configured = Boolean(
    env.SMTP_HOST &&
    env.SMTP_USER &&
    env.SMTP_PASS &&
    env.MAIL_FROM
  );

  if (!configured) {
    if (env.NODE_ENV !== "production") {
      console.info("\n========== DEVELOPMENT EMAIL ==========");
      console.info("To:", message.to);
      console.info("Subject:", message.subject);
      console.info(message.text);
      console.info("=======================================\n");
      return;
    }

    throw new Error("SMTP email service is not configured.");
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}
