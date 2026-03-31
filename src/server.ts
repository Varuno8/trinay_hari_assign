import express from "express";
import multer from "multer";
import path from "path";
import dotenv from "dotenv";
import { buildEvaluationPrompt, CRITERIA, GRADE_SCALE } from "./rulebook";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());

async function evaluateWithLLM(transcripts: string[]): Promise<string> {
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || "llama3.1-8b";

  if (!apiKey) {
    throw new Error("LLM_API_KEY is not set in .env");
  }

  const combinedTranscripts = transcripts
    .map((t, i) => `--- Transcript ${i + 1} ---\n${t}`)
    .join("\n\n");

  const systemPrompt = buildEvaluationPrompt();

  const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Here are the AI coding session transcript(s) to evaluate:\n\n${combinedTranscripts}`,
        },
      ],
      max_tokens: 4096,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LLM API error (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };

  return data.choices[0]?.message?.content || "No evaluation generated.";
}

app.get("/api/rulebook", (_req, res) => {
  res.json({ criteria: CRITERIA, gradeScale: GRADE_SCALE });
});

app.post(
  "/api/evaluate",
  upload.array("transcripts", 10),
  async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ error: "No transcript files uploaded." });
        return;
      }

      const transcripts = files.map((f) => f.buffer.toString("utf-8"));
      const evaluation = await evaluateWithLLM(transcripts);

      res.json({ evaluation, fileCount: files.length });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Evaluation error:", message);
      res.status(500).json({ error: message });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
