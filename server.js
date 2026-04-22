// server.ts
import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
var MODEL_NAME = "gemini-3-flash-preview";
var UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
var upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }
  // 5GB limit
});
async function startServer() {
  const app = express();
  const PORT = 3e3;
  app.use(express.json());
  app.get("/api/download-source", (req, res) => {
    const cwd = process.cwd();
    const tarPath = path.join("/tmp", "source-code.tar.gz");
    exec(`tar -czf ${tarPath} --exclude=node_modules --exclude=dist --exclude=.git -C ${cwd} .`, (err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to compress source code: " + err.message });
      }
      res.download(tarPath, "gemini-transcribe-pro-source.tar.gz");
    });
  });
  app.post("/api/transcribe/youtube", async (req, res) => {
    try {
      const dbApiKey = process.env.GEMINI_API_KEY;
      if (!dbApiKey) {
        throw new Error("Server configuration error: Gemini API key missing on backend");
      }
      const ai = new GoogleGenAI({ apiKey: dbApiKey });
      const { url } = req.body;
      const prompt = `Transcribe the YouTube video at this URL: ${url}.
IMPORTANT: The transcription and summary MUST BE IN THE SAME LANGUAGE AS THE AUDIO CONTENT (e.g., if the video is in Vietnamese, transcribe and summarize in Vietnamese).
Identify the primary language, provide a concise 3-sentence summary, and the full verbatim transcription.`;
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          tools: [{ urlContext: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              language: { type: Type.STRING },
              summary: { type: Type.STRING },
              transcription: { type: Type.STRING }
            },
            required: ["language", "summary", "transcription"]
          }
        }
      });
      const cleanJsonText = response.text?.replace(/^```json\n?/, "").replace(/^```\n?/, "").replace(/\n?```$/, "").trim();
      const parsed = JSON.parse(cleanJsonText || "{}");
      res.json({
        transcription: parsed.transcription || "No transcription available.",
        language: parsed.language || "Unknown",
        summary: parsed.summary || "No summary available.",
        timestamp: Date.now()
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/transcribe/media", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) throw new Error("No file uploaded");
      const dbApiKey = process.env.GEMINI_API_KEY;
      if (!dbApiKey) {
        throw new Error("Server configuration error: Gemini API key missing on backend");
      }
      const ai = new GoogleGenAI({ apiKey: dbApiKey });
      const mimeType = req.file.mimetype || "application/octet-stream";
      const uploadResult = await ai.files.upload({
        file: req.file.path,
        config: { mimeType, displayName: req.file.originalname }
      });
      let state = uploadResult.state;
      while (state === "PROCESSING") {
        await new Promise((r) => setTimeout(r, 2e3));
        const check = await ai.files.get({ name: uploadResult.name });
        state = check.state;
        if (state === "FAILED") throw new Error("File processing failed on Gemini server.");
      }
      if (state !== "ACTIVE") throw new Error(`File not active. Current state: ${state}`);
      const prompt = `Transcribe this media file.
IMPORTANT: The transcription and summary MUST BE IN THE SAME LANGUAGE AS THE AUDIO CONTENT (e.g., if the media is in Vietnamese, transcribe and summarize in Vietnamese).
Identify the primary language, provide a concise 3-sentence summary, and the full verbatim transcription.`;
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [
            { fileData: { mimeType, fileUri: uploadResult.uri } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              language: { type: Type.STRING },
              summary: { type: Type.STRING },
              transcription: { type: Type.STRING }
            },
            required: ["language", "summary", "transcription"]
          }
        }
      });
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      const cleanJsonText = response.text?.replace(/^```json\n?/, "").replace(/^```\n?/, "").replace(/\n?```$/, "").trim();
      const parsed = JSON.parse(cleanJsonText || "{}");
      res.json({
        transcription: parsed.transcription || "No transcription available.",
        language: parsed.language || "Unknown",
        summary: parsed.summary || "No summary available.",
        timestamp: Date.now()
      });
    } catch (e) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: e.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
