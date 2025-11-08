import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { PrismaClient } from "./generated";

const prisma = new PrismaClient();
const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || process.env.CORS_ORIGINS || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

app.use(
  cors({
    origin: allowedOrigins.length === 0 || allowedOrigins.includes("*") ? "*" : allowedOrigins,
  })
);

app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/waitlist", async (req: Request, res: Response) => {
  const { name, email } = req.body ?? {};

  if (typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({ message: "Name is required and must be at least 2 characters." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (typeof email !== "string" || !emailRegex.test(email.trim())) {
    return res.status(400).json({ message: "A valid email address is required." });
  }

  try {
    const entry = await prisma.waitlist.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      },
    });

    return res.status(201).json({
      message: "Successfully joined the waitlist!",
      data: { id: entry.id, name: entry.name, email: entry.email, createdAt: entry.createdAt },
    });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && (error as any).code === "P2002") {
      return res.status(409).json({ message: "You're already on the waitlist with this email." });
    }

    console.error("Error saving waitlist entry:", error);
    return res.status(500).json({ message: "Unexpected error joining the waitlist. Please try again later." });
  }
});

const port = Number(process.env.PORT) || 3001;

const server = app.listen(port, () => {
  console.log(`🚀 Waitlist backend running on http://localhost:${port}`);
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

