import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { querySpenderRisk } from "./graph";

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/spender-risk", async (req, res) => {
  const expectedToken = process.env.PREFLIGHT_API_TOKEN;
  const authHeader = req.headers.authorization;
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    res.status(401).json({ error: "missing or invalid Authorization header" });
    return;
  }

  const spender = req.query.spender;
  if (typeof spender !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(spender)) {
    res.status(400).json({ error: "spender must be a valid address" });
    return;
  }

  try {
    const risk = await querySpenderRisk(spender);
    res.json(risk);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Subgraph query failed" });
  }
});

app.listen(port, () => {
  console.log(`Preflight backend listening on port ${port}`);
});
