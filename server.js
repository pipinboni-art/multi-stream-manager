import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import multer from "multer";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });
let streams = {};

app.get("/", (req, res) => {
  res.sendFile(path.resolve("index.html"));
});

app.post("/start", upload.single("file"), (req, res) => {
  const id = Date.now().toString();

  let input = req.body.input;
  if (req.file) input = req.file.path;

  const output = req.body.output;
  if (!input || !output) {
    return res.status(400).json({ error: "Input dan Output wajib diisi" });
  }

  const ff = spawn("ffmpeg", [
    "-re",
    "-i", input,
    "-c:v", "copy",
    "-c:a", "aac",
    "-f", "flv",
    output
  ]);

  ff.stderr.on("data", d => console.log(`[${id}] ${d}`));
  ff.on("close", () => delete streams[id]);

  streams[id] = ff;
  res.json({ ok: true, id });
});

app.post("/stop", (req, res) => {
  const { id } = req.body;
  if (streams[id]) {
    streams[id].kill("SIGINT");
    delete streams[id];
  }
  res.json({ ok: true });
});

app.get("/list", (req, res) => {
  res.json(Object.keys(streams));
});

app.listen(3000, () => {
  console.log("Multi Stream Manager running on port 3000");
});
