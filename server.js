
import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

let streams = {}; // id → ffmpeg process

// Serve HTML dashboard
app.get("/", (req, res) => {
  res.sendFile(path.resolve("index.html"));
});

// Start stream (URL or uploaded file)
app.post("/start", upload.single("file"), (req, res) => {
  const id = Date.now().toString();
  let input = req.body.input || null;

  if (req.file) {
    input = req.file.path;
  }

  const output = req.body.output;
  if (!input || !output) return res.status(400).json({ error: "Input & Output required" });

  const args = ["-re", "-i", input, "-c:v", "copy", "-c:a", "aac", "-f", "flv", output];

  const ff = spawn("ffmpeg", args);
  ff.stderr.on("data", d => console.log(`[${id}] ` + d.toString()));
  ff.on("close", () => { delete streams[id]; });

  streams[id] = { proc: ff, input, output };

  res.json({ ok: true, id });
});

// Stop stream
app.post("/stop", (req, res) => {
  const { id } = req.body;
  if (!streams[id]) return res.status(404).json({ error: "Stream not found" });

  streams[id].proc.kill("SIGINT");
  delete streams[id];

  res.json({ ok: true });
});

// List streams
app.get("/list", (req, res) => {
  res.json(streams);
});

app.listen(3000, () => console.log("Multi Stream Manager running on 3000"));
