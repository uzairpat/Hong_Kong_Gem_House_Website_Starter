import "express-session";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      fullName: string;
      accountType: "customer" | "admin";
    };
    admin?: {
      id: string;
      email: string;
      fullName: string;
      role: "owner";
    };
    adminChallenge?: {
      id: string;
      email: string;
      fullName: string;
      expiresAt: number;
    };
  }
}
