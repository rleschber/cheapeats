import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dealsRouter from "./routes/deals.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/deals", dealsRouter);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// In production, serve the built frontend (single deploy)
const frontendDist = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path === "/health") return next();
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`CheapEats API running at http://localhost:${PORT}`);
  if (process.env.OPENMENU_API_KEY) {
    const loc = process.env.OPENMENU_CITY && process.env.OPENMENU_COUNTRY ? " (location: " + [process.env.OPENMENU_CITY, process.env.OPENMENU_COUNTRY].join(", ") + ")" : " (sample deals)";
    console.log("Live deals: OpenMenu API enabled" + loc);
  }
  if (process.env.DEALS_FEED_URL) console.log("Live deals: DEALS_FEED_URL set");
});
