import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";

const app: Express = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Only start listening when run directly (not as a Vercel serverless function)
if (process.env.NODE_ENV !== "production" || process.env.START_SERVER === "true") {
  const port = Number(process.env.PORT || 5000);
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

export default app;
