import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { json } from "express";
import { loadDatasets, getState, applyChange, undoLast, addBookmark, runStorytime, getAudit, getBuilderLog } from "./services/state.js";

const app = express();
// Enable CORS with more permissive settings for development
app.use(cors({
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Handle preflight requests
app.options('*', cors());
app.use(json({ limit: "2mb" }));
app.use(morgan("dev"));

// Add reset endpoint for demo
app.post("/api/reset-demo", async (req, res) => {
  await loadDatasets();
  res.json({ status: "Demo state reset" });
});

await loadDatasets();

app.get("/api/data", (req, res) => res.json(getState()));
app.get("/api/audit", (req, res) => res.json(getAudit()));
app.get("/api/builder-log", (req, res) => res.json(getBuilderLog()));

app.post("/api/bookmark", async (req, res) => {
  const { transcript, context } = req.body || {};
  const result = await addBookmark(transcript || "", context || "");
  res.json(result);
});

app.post("/api/storytime", async (req, res) => {
  const { transcript } = req.body || {};
  const outcome = await runStorytime(transcript || "");
  res.json(outcome);
});

app.post("/api/apply", (req, res) => {
  const { changeId } = req.body || {};
  const out = applyChange(changeId);
  res.json(out);
});

app.post("/api/undo", (req, res) => {
  const out = undoLast();
  res.json(out);
});

const port = Number(process.env.PORT || 8788);
app.listen(port, () => console.log(`Rox Nexus backend listening on :${port}`));
