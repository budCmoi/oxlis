import { env } from "./config/env";
import { app } from "./app";

app.listen(env.PORT, () => {
  console.log(`API server running on http://localhost:${env.PORT}`);
});
