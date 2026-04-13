import path from "node:path";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import routes from "./routes";

const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.use("/api", routes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  return res.status(500).json({ message: "Erreur serveur inattendue" });
});

app.listen(env.PORT, () => {
  console.log(`API server running on http://localhost:${env.PORT}`);
});
