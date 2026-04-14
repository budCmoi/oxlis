import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(8),
  ATTACHMENTS_ENCRYPTION_KEY: z.string().min(16).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  APPLE_CLIENT_ID: z.string().min(1).optional(),
  PORT: z.string().default("4000"),
  CLIENT_URL: z.string().default("http://localhost:3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  PORT: Number(parsed.data.PORT),
};
