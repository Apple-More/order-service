// src/app.ts
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";

import router from "./routes/index";

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// API routes
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "Order service is online" });
});

app.use("/v1", router);

// 404 handler for unknown routes
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

export default app;
