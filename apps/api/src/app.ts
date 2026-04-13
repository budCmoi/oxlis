import path from "node:path";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import routes from "./routes";

function parseAllowedOrigins() {
  if (!env.CLIENT_URL) {
    return true;
  }

  const allowedOrigins = env.CLIENT_URL.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return allowedOrigins.length > 0 ? allowedOrigins : true;
}

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: parseAllowedOrigins(),
      credentials: true,
    }),
  );
  app.use(helmet());
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(
    "/uploads",
    express.static(path.resolve(__dirname, "../uploads"), {
      setHeaders(res) {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      },
    }),
  );

  app.use("/api", routes);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);

    if (err instanceof Error) {
      return res.status(500).json({ message: err.message });
    }

    return res.status(500).json({ message: "Erreur serveur inattendue" });
  });

  return app;
}

export const app = createApp();